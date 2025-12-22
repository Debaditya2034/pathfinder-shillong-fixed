// src/pages/DriverDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]); // combined assigned + open
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    completed: 0,
    pending: 0,
    earnings: 0,
  });
  const [driverProfile, setDriverProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // refs to unsubscribe listeners
  const assignedUnsubRef = useRef(null);
  const openUnsubRef = useRef(null);

  // compute stats from a list of trips
  function computeStats(trips, uid) {
    const total = trips.length;
    const accepted = trips.filter(x => x.status === "assigned" || x.driverId === uid).length;
    const completed = trips.filter(x => x.status === "completed").length;
    const pending = trips.filter(x => x.status === "requested").length;
    const earnings = trips.reduce((acc, cur) => acc + (cur.finalFare || cur.fareEstimate || 0), 0);
    return { total, accepted, completed, pending, earnings };
  }

  useEffect(() => {
    // Listen for auth state
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      // clear any previous listeners
      assignedUnsubRef.current && assignedUnsubRef.current();
      openUnsubRef.current && openUnsubRef.current();

      if (!u) {
        setUser(null);
        setBookings([]);
        setStats({ total: 0, accepted: 0, completed: 0, pending: 0, earnings: 0 });
        setDriverProfile(null);
        setVehicles([]);
        return;
      }

      setUser(u);

      try {
        // fetch driver profile (one-time)
        const dpCol = collection(db, "driverProfiles");
        const dpQ = query(dpCol, where("uid", "==", u.uid));
        const dpSnap = await getDocs(dpQ);
        const dp = dpSnap.docs.length ? { id: dpSnap.docs[0].id, ...dpSnap.docs[0].data() } : null;
        setDriverProfile(dp);

        // fetch vehicles (best-effort)
        let vlist = [];
        if (dp && Array.isArray(dp.vehicleIds) && dp.vehicleIds.length) {
          const ids = dp.vehicleIds.slice(0, 10);
          const vq = query(collection(db, "vehicles"), where("vehicleId", "in", ids));
          const vsnap = await getDocs(vq);
          vlist = vsnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          const vq2 = query(collection(db, "vehicles"), where("driverId", "==", dp ? dp.driverId || dp.uid : u.uid));
          const vsnap2 = await getDocs(vq2);
          vlist = vsnap2.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setVehicles(vlist);

        // realtime listeners:
        // 1) assigned to this driver
        const tripsCol = collection(db, "trips");
        const assignedQ = query(tripsCol, where("driverId", "==", u.uid), orderBy("requestedAt", "desc"));
        assignedUnsubRef.current = onSnapshot(assignedQ, (snap) => {
          const assigned = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // merge with any open (if already loaded), assigned should appear first
          setBookings(prev => {
            const open = prev.filter(x => x.status === "requested");
            const combined = [...assigned, ...open];
            setStats(computeStats(combined, u.uid));
            return combined;
          });
        }, (err) => {
          console.error("assigned onSnapshot error", err);
        });

        // 2) open requested trips
        const openQ = query(tripsCol, where("status", "==", "requested"), orderBy("requestedAt", "desc"));
        openUnsubRef.current = onSnapshot(openQ, (snap) => {
          const open = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setBookings(prev => {
            // preserve assigned at top if exists in prev
            const assigned = prev.filter(x => x.status !== "requested");
            const combined = [...assigned, ...open];
            setStats(computeStats(combined, u.uid));
            return combined;
          });
        }, (err) => {
          console.error("open onSnapshot error", err);
        });

      } catch (e) {
        console.error("Error initializing driver dashboard", e);
        toast.error("Unable to load dashboard data");
      }
    });

    return () => {
      // cleanup auth listener + snapshots
      unsubAuth();
      assignedUnsubRef.current && assignedUnsubRef.current();
      openUnsubRef.current && openUnsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transaction-safe accept
  async function acceptTrip(trip) {
    if (!user) return toast.error("Authentication required");
    // optional: block unverified drivers (if you want this behavior)
    if (driverProfile && driverProfile.verified === false) {
      return toast.error("Your driver account is not verified. You cannot accept trips yet.");
    }

    setLoading(true);
    try {
      const tripRef = doc(db, "trips", trip.id);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(tripRef);
        if (!snap.exists()) throw new Error("Trip was removed");
        const data = snap.data();
        // if already assigned or not requested any more -> abort
        if (data.status !== "requested" && data.driverId) {
          throw new Error("Trip already claimed");
        }
        // set driverId and assigned status atomically
        tx.update(tripRef, {
          driverId: user.uid,
          status: "assigned",
          assignedAt: serverTimestamp()
        });
      });

      toast.success("Trip accepted");
      // No need to manually refresh because onSnapshot will emit update
    } catch (e) {
      console.error("acceptTrip transaction failed", e);
      toast.error(e.message || "Failed to accept trip");
    } finally {
      setLoading(false);
    }
  }

  // Mark completed
  async function markCompleted(trip) {
    if (!user) return;
    setLoading(true);
    try {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, {
        status: "completed",
        completedAt: serverTimestamp(),
      });
      toast.success("Trip completed");
      // onSnapshot will update UI
    } catch (e) {
      console.error("markCompleted error", e);
      toast.error("Failed to complete trip");
    } finally {
      setLoading(false);
    }
  }

  // small helper to format scheduledFor (handle null or timestamp objects)
  function formatScheduled(scheduled) {
    if (!scheduled) return "ASAP";
    try {
      // Firestore timestamp object may have seconds
      if (scheduled.seconds) {
        return new Date(scheduled.seconds * 1000).toLocaleString();
      }
      const d = new Date(scheduled);
      return d.toLocaleString();
    } catch {
      return "ASAP";
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f0c]">
      <Navbar />
      <main className="min-h-screen bg-[#0f1412] text-[#e8f6ef] p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left column: profile + stats */}
          <div className="lg:col-span-1">
            <Card className="bg-[#14221c] border border-[#1d3a2f] sticky top-6">
              <CardHeader>
                <CardTitle className="text-[#e3f5ec]">Driver Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {driverProfile ? (
                  <div>
                    <p className="text-sm text-[#d9efe6]">Name: {driverProfile.name || "—"}</p>
                    <p className="text-sm text-[#d9efe6]">Verified: {driverProfile.verified ? "Yes" : "No"}</p>
                    <p className="text-sm text-[#d9efe6]">License: {driverProfile.licenseNumber || "—"}</p>

                    <div className="mt-3">
                      <p className="text-xs text-[#9fd8b8] mb-1">Vehicles</p>
                      {vehicles.length ? (
                        vehicles.map((v) => (
                          <div key={v.id} className="text-sm text-[#e8f6ef] mb-1 border p-2 rounded">
                            <div>{v.make} {v.model}</div>
                            <div className="text-xs text-[#cdebd5]">{v.plate} • Cap: {v.capacity}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No vehicles registered</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Driver profile not found. Please complete your profile.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#14221c] border border-[#1d3a2f] mt-4">
              <CardHeader>
                <CardTitle className="text-[#e3f5ec]">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-[#d9efe6]">Total visible trips</div>
                  <div className="text-2xl font-bold text-[#e3f5ec]">{stats.total}</div>

                  <div className="text-sm text-[#d9efe6]">Accepted</div>
                  <div className="text-2xl font-bold text-[#e3f5ec]">{stats.accepted}</div>

                  <div className="text-sm text-[#d9efe6]">Completed</div>
                  <div className="text-2xl font-bold text-[#e3f5ec]">{stats.completed}</div>

                  <div className="text-sm text-[#d9efe6]">Earnings (est)</div>
                  <div className="text-2xl font-bold text-[#e3f5ec]">{formatCurrency(stats.earnings || 0)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: bookings list */}
          <div className="lg:col-span-2">
            <Card className="bg-[#14221c] border border-[#1d3a2f]">
              <CardHeader>
                <CardTitle className="text-[#e3f5ec]">Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings available.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((b) => (
                      <Card key={b.id} className="bg-[#0f1412] border border-[#1d3a2f]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-[#9fd8b8]">Booking ID: {b.id}</p>
                              <p className="text-lg font-semibold text-[#e3f5ec]">{b.pickup?.address || (b.stops && b.stops[0]?.address) || "Unknown"}</p>
                              <p className="text-sm text-[#d9efe6]">{b.dropoff?.address || (b.stops && b.stops[b.stops.length - 1]?.address)}</p>
                              <p className="text-sm text-[#cdebd5] mt-2">Status: <span className="font-medium">{b.status}</span></p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-[#d9efe6]">{formatScheduled(b.scheduledFor)}</p>
                              <p className="text-lg font-bold text-[#e3f5ec]">{formatCurrency(b.finalFare || b.fareEstimate || 0)}</p>
                              <div className="mt-3 flex flex-col gap-2">
                                {b.status === "requested" && (
                                  <Button onClick={() => acceptTrip(b)} disabled={loading}>Accept</Button>
                                )}

                                {b.status === "assigned" && b.driverId === user?.uid && (
                                  <>
                                    <Button onClick={() => navigate(`/trip/${b.id}`)}>Open</Button>
                                    <Button variant="destructive" onClick={() => markCompleted(b)}>Mark Completed</Button>
                                  </>
                                )}

                                {b.status === "assigned" && b.driverId !== user?.uid && (
                                  <div className="text-xs text-[#cdebd5]">Assigned to another driver</div>
                                )}

                                {b.status === "completed" && (
                                  <div className="text-sm text-[#9fd8b8]">Completed</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
