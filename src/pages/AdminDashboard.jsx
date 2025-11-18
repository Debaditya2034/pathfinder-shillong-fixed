import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Users, Car, MapPin, IndianRupee, CheckCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalDrivers: 0,
    pendingDrivers: 0,
    totalRevenue: 0,
  });
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("pathfinder_user");
    if (!userData) {
      navigate("/auth");
      return;
    }

    const parsedUser = JSON.parse(userData);
    // For demo, any user can access admin with ?admin=true or role=admin
    if (parsedUser.role !== "admin" && !window.location.search.includes("admin=true")) {
      // Auto-set admin for demo
      parsedUser.role = "admin";
      localStorage.setItem("pathfinder_user", JSON.stringify(parsedUser));
    }

    setUser(parsedUser);
    loadData();
  }, [navigate]);

  const loadData = () => {
    const bookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
    const drivers = JSON.parse(localStorage.getItem("pathfinder_drivers") || "[]");

    const pending = drivers.filter((driver) => driver.status === "pending");
    const revenue = bookings.filter((booking) => booking.status === "completed").reduce((sum, booking) => sum + booking.estimatedCost, 0);

    setStats({
      totalBookings: bookings.length,
      totalDrivers: drivers.length,
      pendingDrivers: pending.length,
      totalRevenue: revenue,
    });

    setPendingDrivers(pending);
    setAllBookings(bookings);
  };

  const handleVerifyDriver = (driverId, approved) => {
    const drivers = JSON.parse(localStorage.getItem("pathfinder_drivers") || "[]");
    const updatedDrivers = drivers.map((driver) => {
      if (driver.uid === driverId) {
        return { ...driver, status: approved ? "verified" : "rejected" };
      }
      return driver;
    });

    localStorage.setItem("pathfinder_drivers", JSON.stringify(updatedDrivers));
    loadData();
    toast.success(approved ? "Driver verified successfully" : "Driver rejected");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => {
        localStorage.removeItem("pathfinder_user");
        navigate("/");
      }} />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Drivers</p>
                  <p className="text-3xl font-bold">{stats.totalDrivers}</p>
                </div>
                <Car className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-3xl font-bold">{stats.pendingDrivers}</p>
                </div>
                <Users className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Drivers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Driver Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDrivers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending verifications</p>
            ) : (
              <div className="space-y-4">
                {pendingDrivers.map((driver) => (
                  <Card key={driver.uid} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <p className="font-semibold text-lg">{driver.name}</p>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>Email: {driver.email}</p>
                            <p>Phone: {driver.phone}</p>
                            <p>Vehicle: {driver.vehicleType} - {driver.vehicleNumber}</p>
                            <p>License: {driver.licenseNumber}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyDriver(driver.uid, true)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyDriver(driver.uid, false)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {allBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">Booking ID</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Distance</th>
                      <th className="text-left py-3 px-4">Cost</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="py-3 px-4 font-mono text-sm">{booking.id}</td>
                        <td className="py-3 px-4">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">{booking.totalDistance} km</td>
                        <td className="py-3 px-4 font-semibold">
                          {formatCurrency(booking.estimatedCost)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            booking.status === "accepted" ? "bg-green-100 text-green-800" :
                            booking.status === "completed" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
