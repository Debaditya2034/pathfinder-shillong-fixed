import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { CheckCircle, MapPin, Calendar, Car, Phone } from "lucide-react";
import { generateBookingCode, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const BookingConfirm = () => {
  const navigate = useNavigate();
  const [bookingCode, setBookingCode] = useState("");
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const pending = localStorage.getItem("pending_booking");
    const user = localStorage.getItem("pathfinder_user");
    
    if (!pending || !user) {
      navigate("/");
      return;
    }

    const data = JSON.parse(pending);
    const code = generateBookingCode();
    setBookingCode(code);
    setBookingData(data);

    // Save booking to demo storage
    const userData = JSON.parse(user);
    const booking = {
      id: "BK-" + code,
      touristId: userData.uid,
      ...data,
      bookingCode: code,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const bookings = JSON.parse(localStorage.getItem("pathfinder_bookings") || "[]");
    bookings.push(booking);
    localStorage.setItem("pathfinder_bookings", JSON.stringify(bookings));
    localStorage.removeItem("pending_booking");

    toast.success("Booking confirmed! Waiting for driver acceptance.");
  }, [navigate]);

  if (!bookingData) return null;

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
              <p className="text-4xl font-bold text-center text-primary mt-2">
                {bookingCode}
              </p>
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
                  {bookingData.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span>{stop.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Scheduled Date</p>
                  <p className="text-muted-foreground">
                    {new Date(bookingData.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Vehicle</p>
                  <p className="text-muted-foreground capitalize">{bookingData.vehicleType}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="font-semibold">{bookingData.totalDistance} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(bookingData.estimatedCost)}
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
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirm;
