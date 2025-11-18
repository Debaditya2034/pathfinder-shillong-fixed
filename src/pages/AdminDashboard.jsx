import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Users, Car, MapPin, IndianRupee, CheckCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { computeAnalytics } from "@/lib/analytics";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalDrivers: 0,
    pendingDrivers: 0,
    totalRevenue: 0,
    totalTourists: 0,
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
    const users = JSON.parse(localStorage.getItem("pathfinder_users") || "[]");

    const pending = drivers.filter((driver) => driver.status === "pending");
    
    // Use analytics utility
    const analytics = computeAnalytics(bookings);
    
    // Count tourists
    const touristCount = users.filter((u) => u.role === "tourist").length || 
      new Set(bookings.map((b) => b.touristId).filter(Boolean)).size;

    setStats({
      totalBookings: analytics.totalBookings || 0,
      totalDrivers: drivers.length || 0,
      pendingDrivers: pending.length || 0,
      totalRevenue: analytics.totalEarnings || 0,
      totalTourists: touristCount || 0,
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
    <div className="min-h-screen bg-[#0b0f0c]">
      <Navbar user={user} onLogout={() => {
        localStorage.removeItem("pathfinder_user");
        navigate("/");
      }} />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8 text-[#e3f5ec]">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Total Bookings</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.totalBookings || 0}</p>
                </div>
                <MapPin className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Total Drivers</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.totalDrivers || 0}</p>
                </div>
                <Car className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Total Tourists</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.totalTourists || 0}</p>
                </div>
                <Users className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Pending Verification</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">{stats.pendingDrivers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#14221c] border border-[#1d3a2f]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d9efe6]">Total Earnings</p>
                  <p className="text-3xl font-bold text-[#e3f5ec]">₹{stats.totalRevenue.toLocaleString('en-IN') || 0}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-pf-green" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Drivers */}
        <Card className="mb-8 bg-[#14221c] border border-[#1d3a2f]">
          <CardHeader>
            <CardTitle className="text-[#e3f5ec]">Pending Driver Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDrivers.length === 0 ? (
              <p className="text-center text-[#d9efe6] py-8">No pending verifications</p>
            ) : (
              <div className="space-y-4">
                {pendingDrivers.map((driver) => (
                  <Card key={driver.uid} className="border-2 border-[#1d3a2f] bg-[#0f1412]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <p className="font-semibold text-lg text-[#e3f5ec]">{driver.name}</p>
                          <div className="mt-2 space-y-1 text-sm text-[#d9efe6]">
                            <p>Email: {driver.email}</p>
                            <p>Phone: {driver.phone}</p>
                            <p>Vehicle: {driver.vehicleType} - {driver.vehicleNumber}</p>
                            <p>License: {driver.licenseNumber}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-pf-green text-black hover:bg-[#12c77c]"
                            onClick={() => handleVerifyDriver(driver.uid, true)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#1d3a2f] text-[#e8f6ef] hover:bg-[#14221c] hover:border-pf-green"
                            onClick={() => handleVerifyDriver(driver.uid, false)}
                          >
                            <X className="mr-2 h-4 w-4" aria-hidden="true" />
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
        <Card className="bg-[#14221c] border border-[#1d3a2f]">
          <CardHeader>
            <CardTitle className="text-[#e3f5ec]">All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {allBookings.length === 0 ? (
              <p className="text-center text-[#d9efe6] py-8">No bookings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#1d3a2f]">
                    <tr>
                      <th className="text-left py-3 px-4 text-[#e3f5ec]">Booking ID</th>
                      <th className="text-left py-3 px-4 text-[#e3f5ec]">Date</th>
                      <th className="text-left py-3 px-4 text-[#e3f5ec]">Distance</th>
                      <th className="text-left py-3 px-4 text-[#e3f5ec]">Cost</th>
                      <th className="text-left py-3 px-4 text-[#e3f5ec]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-[#1d3a2f]">
                        <td className="py-3 px-4 font-mono text-sm text-[#d9efe6]">{booking.id}</td>
                        <td className="py-3 px-4 text-[#d9efe6]">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-[#d9efe6]">{booking.totalDistance} km</td>
                        <td className="py-3 px-4 font-semibold text-[#e3f5ec]">
                          {formatCurrency(booking.estimatedCost)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            booking.status === "pending" ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50" :
                            booking.status === "accepted" ? "bg-pf-green/20 text-pf-green border border-pf-green/50" :
                            booking.status === "completed" ? "bg-blue-900/30 text-blue-300 border border-blue-700/50" :
                            "bg-[#0f1412] text-[#d9efe6] border border-[#1d3a2f]"
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
