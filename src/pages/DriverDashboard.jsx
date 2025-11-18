import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Car, MapPin, Calendar, CheckCircle, X, IndianRupee } from "lucide-react";
import { formatCurrency, generateBookingCode } from "@/lib/utils";
import { toast } from "sonner";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, completed: 0, pending: 0, earnings: 0 });

  useEffect(() => {
    const userData = localStorage.getItem("pathfinder_user");
    if (!userData) {
      navigate("/auth");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "driver") {
      navigate("/");
      return;
    }

    setUser(parsedUser);
    loadBookings(parsedUser.uid);
  }, [navigate]);

  const loadBookings = (driverId) => {
    const allBookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
    const driverBookings = allBookings.filter((booking) => booking.status === "pending" || booking.driverId === driverId);
    setBookings(driverBookings);

    // Use analytics utility
    const analytics = computeDriverAnalytics(allBookings, driverId);

    setStats({
      total: analytics.total || 0,
      accepted: analytics.accepted || 0,
      completed: analytics.completed || 0,
      pending: analytics.pending || 0,
      earnings: analytics.earnings || 0,
    });
  };

  const handleAcceptBooking = (bookingId) => {
    const allBookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
    const updatedBookings = allBookings.map((booking) => {
      if (booking.id === bookingId) {
        return {
          ...booking,
          driverId: user.uid,
          status: "accepted",
          driverCode: generateBookingCode(),
        };
      }
      return booking;
    });

    localStorage.setItem("pathfinder_bookings", JSON.stringify(updatedBookings));
    loadBookings(user.uid);
    toast.success("Booking accepted! Customer will be notified.");
  };

  const handleDeclineBooking = (bookingId) => {
    const allBookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
    const updatedBookings = allBookings.filter((booking) => booking.id !== bookingId);
    localStorage.setItem("pathfinder_bookings", JSON.stringify(updatedBookings));
    loadBookings(user.uid);
    toast.info("Booking declined");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b0f0c]">
      <Navbar user={user} onLogout={() => {
        localStorage.removeItem("pathfinder_user");
        navigate("/");
      }} />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8 text-[#e3f5ec]">Driver Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Trips Accepted</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.accepted || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Completed</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Pending</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.pending || 0}</p>
                </div>
                <Car className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Total Earnings</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">₹{stats.earnings.toLocaleString('en-IN') || 0}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings */}
        <Card className="bg-[#14221c] border border-[#1d3a2f]">
          <CardHeader>
            <CardTitle className="text-[#e3f5ec]">Available Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-center text-[#d9efe6] py-8">No bookings available</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-2 border-[#1d3a2f] bg-[#0f1412]">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <p className="font-semibold text-lg mb-2 text-[#e3f5ec]">Booking #{booking.id}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-[#d9efe6]">
                                <MapPin className="h-4 w-4 text-pf-green" aria-hidden="true" />
                                <span>{booking.totalDistance} km route</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#d9efe6]">
                                <Calendar className="h-4 w-4 text-pf-green" aria-hidden="true" />
                                <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#d9efe6]">
                                <Car className="h-4 w-4 text-pf-green" aria-hidden="true" />
                                <span className="capitalize">{booking.vehicleType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-pf-green">
                              {formatCurrency(booking.estimatedCost)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                              booking.status === "pending" ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50" :
                              booking.status === "accepted" ? "bg-pf-green/20 text-pf-green border border-pf-green/50" :
                              "bg-[#0f1412] text-[#d9efe6] border border-[#1d3a2f]"
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        {booking.status === "pending" && (
                          <div className="flex gap-3 pt-4 border-t border-[#1d3a2f]">
                            <Button
                              className="flex-1 bg-pf-green text-black hover:bg-[#12c77c]"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-[#1d3a2f] text-[#e8f6ef] hover:bg-[#14221c] hover:border-pf-green"
                              onClick={() => handleDeclineBooking(booking.id)}
                            >
                              <X className="mr-2 h-4 w-4" aria-hidden="true" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {booking.status === "accepted" && booking.driverCode && (
                          <div className="bg-pf-green/10 p-4 rounded-lg mt-4 border border-pf-green/20">
                            <p className="text-sm font-medium mb-1 text-[#e3f5ec]">Your Driver Code</p>
                            <p className="text-2xl font-bold text-pf-green">{booking.driverCode}</p>
                            <p className="text-xs text-[#d9efe6] mt-1">
                              Show this code to the customer at pickup
                            </p>
                          </div>
                        )}
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
  );
};

export default DriverDashboard;
