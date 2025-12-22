// src/pages/BookingConfirm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { CheckCircle, MapPin, Calendar, Car } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import BookingCodeDialog from "@/components/BookingCodeDialog";
import { createBooking as createBookingFn } from "@/lib/createBooking"; // ensure this file exists and exports createBooking

const BookingConfirm = () => {
  const navigate = useNavigate();
  const [bookingCode, setBookingCode] = useState("");
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // create booking when component mounts if pending_booking exists
    const pendingRaw = localStorage.getItem("pending_booking");
    const userRaw = localStorage.getItem("pathfinder_user");

    // If either missing, go home
    if (!pendingRaw) {
      toast.error("No pending booking found.");
      navigate("/");
      return;
    }

    let pending;
    try {
      pending = JSON.parse(pendingRaw);
    } catch (e) {
      console.error("Invalid pending_booking JSON", e);
      localStorage.removeItem("pending_booking");
      toast.error("Booking data corrupted. Please try again.");
      navigate("/");
      return;
    }

    // Build payload expected by createBooking
    async function create() {
      setLoading(true);
      try {
        const tourist = userRaw ? JSON.parse(userRaw) : null;
        const payload = {
          touristId: tourist ? tourist.uid : null,
          stops: pending.stops || [],
          pickup: pending.pickup || (pending.stops && pending.stops[0]) || null,
          dropoff:
            pending.dropoff ||
            (pending.stops && pending.stops.length ? pending.stops[pending.stops.length - 1] : null),
          estimate: pending.estimatedCost || pending.estimate || null,
          amount: pending.estimatedCost || pending.amount || pending.estimate || null,
          vehicle: pending.vehicleType ? { type: pending.vehicleType } : pending.vehicle || {},
          scheduledAt: pending.scheduledDate || null,
          notes: pending.notes || null,
        };

        // Try to create booking in Firestore via createBooking fn
        let res = null;
        try {
          res = await createBookingFn(payload);
        } catch (err) {
          console.warn("Firestore createBooking failed, falling back to local storage", err);
        }

        // If Firestore succeeded, use returned bookingCode; otherwise generate a local code
        const code = (res && (res.bookingCode || res.tripId)) || (Math.random().toString(36).substring(2, 8).toUpperCase());
        setBookingCode(code);

        // Persist a local demo booking copy (for demo mode / backward compatibility)
        const userData = tourist || { uid: null, email: null };
        const bookingLocal = {
          id: (res && res.bookingId) || "BK-" + code,
          tripId: (res && res.tripId) || null,
          touristId: userData.uid,
          ...pending,
          bookingCode: code,
          status: (res && "pending") || "pending",
          createdAt: new Date().toISOString(),
        };
        const bookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
        bookings.push(bookingLocal);
        localStorage.setItem("pathfinder_bookings", JSON.stringify(bookings));

        // clear pending booking (we already persisted)
        localStorage.removeItem("pending_booking");

        setBookingData(bookingLocal);
        toast.success("Booking confirmed! Waiting for driver acceptance.");
      } catch (e) {
        console.error("create booking failed", e);
        toast.error("Failed to create booking. Try again.");
        // keep pending_booking so user can retry
      } finally {
        setLoading(false);
      }
    }

    create();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (!bookingData) return null;

  function onCodeFound(results) {
    // results is array of booking docs returned by BookingCodeDialog
    if (results && results.length) {
      // show first match in an unobtrusive way
      const r = results[0];
      toast(`Found booking ${r.bookingCode || r.id}`);
    } else {
      toast("No booking found for that code");
    }
  }

  // helper: safe map of stops
  const stops = Array.isArray(bookingData.stops) ? bookingData.stops : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">Your booking is pending driver acceptance</p>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardTitle className="text-center">Booking Code</CardTitle>
              <p className="text-4xl font-bold text-center text-primary mt-2">{bookingCode}</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Present this code to your driver at pickup
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div className="flex-grow">
                  <p className="font-medium mb-2">Route</p>
                  {stops.length ? (
                    stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span>{stop.name || stop.address || stop}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Route details not available</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Scheduled Date</p>
                  <p className="text-muted-foreground">
                    {bookingData.scheduledDate
                      ? new Date(bookingData.scheduledDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "ASAP"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Vehicle</p>
                  <p className="text-muted-foreground capitalize">{bookingData.vehicleType || "Any"}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="font-semibold">{bookingData.totalDistance || 0} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(bookingData.estimatedCost || bookingData.amount || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">⚠️ DEMO MODE</p>
                <p className="text-xs text-muted-foreground">
                  This is a demonstration booking. No real payment is processed.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You will receive an SMS notification once a driver accepts your booking
            </p>
            <Button onClick={() => navigate("/")} variant="outline" disabled={loading}>
              Back to Home
            </Button>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => setDialogOpen(true)} disabled={loading}>
              Lookup Booking Code
            </Button>
            <Button onClick={() => navigator.clipboard?.writeText(bookingCode)} variant="ghost" disabled={loading}>
              Copy Code
            </Button>
          </div>

          <BookingCodeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onFound={onCodeFound} />
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;
