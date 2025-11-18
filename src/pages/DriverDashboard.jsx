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

    // Count accepted bookings (trips accepted)
    const accepted = driverBookings.filter((booking) => booking.status === "accepted" || booking.status === "completed").length;
    const completed = driverBookings.filter((booking) => booking.status === "completed").length;
    const pending = driverBookings.filter((booking) => booking.status === "pending").length;
    
    // Calculate earnings from completed or accepted bookings
    const earnings = driverBookings
      .filter((booking) => booking.status === "completed" || booking.status === "accepted")
      .reduce((sum, booking) => {
        const cost = booking.estimatedCost || booking.total || booking.cost || 0;
        return sum + (typeof cost === 'number' ? cost : 0);
      }, 0);

    setStats({
      total: driverBookings.length || 0,
      accepted: accepted || 0,
      completed: completed || 0,
      pending: pending || 0,
      earnings: earnings || 0,
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
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => {
        localStorage.removeItem("pathfinder_user");
        navigate("/");
      }} />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8">Driver Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trips Accepted</p>
                  <p className="text-3xl font-bold">{stats.accepted || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending || 0}</p>
                </div>
                <Car className="h-8 w-8 text-warning" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.earnings || 0)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Available Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings available</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <p className="font-semibold text-lg mb-2">Booking #{booking.id}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{booking.totalDistance} km route</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Car className="h-4 w-4 text-primary" />
                                <span className="capitalize">{booking.vehicleType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(booking.estimatedCost)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                              booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              booking.status === "accepted" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        {booking.status === "pending" && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              className="flex-1"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeclineBooking(booking.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {booking.status === "accepted" && booking.driverCode && (
                          <div className="bg-primary/5 p-4 rounded-lg mt-4">
                            <p className="text-sm font-medium mb-1">Your Driver Code</p>
                            <p className="text-2xl font-bold text-primary">{booking.driverCode}</p>
                            <p className="text-xs text-muted-foreground mt-1">
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
