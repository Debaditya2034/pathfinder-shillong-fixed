import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { MapPin, Plus, X, Car, Calendar } from "lucide-react";
import { calculateDistance, calculateCost, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const popularLocations = [
  { id: "1", name: "Shillong City Center", lat: 25.5788, lng: 91.8933, description: "Capital city" },
  { id: "2", name: "Living Root Bridge", lat: 25.2622, lng: 91.7323, description: "Natural wonder" },
  { id: "3", name: "Umiam Lake", lat: 25.6815, lng: 91.9059, description: "Scenic lake" },
  { id: "4", name: "Elephant Falls", lat: 25.5218, lng: 91.8847, description: "Waterfall" },
  { id: "5", name: "Mawlynnong Village", lat: 25.2044, lng: 91.9392, description: "Cleanest village" },
  { id: "6", name: "Cherrapunji", lat: 25.2676, lng: 91.7320, description: "Wettest place" },
];

const Itinerary = () => {
  const navigate = useNavigate();
  const [selectedStops, setSelectedStops] = useState([]);
  const [vehicleType, setVehicleType] = useState("sedan");
  const [scheduledDate, setScheduledDate] = useState("");
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const addStop = (location) => {
    const newStops = [...selectedStops, location];
    setSelectedStops(newStops);
    calculateRoute(newStops);
    toast.success(`Added ${location.name} to itinerary`);
  };

  const removeStop = (index) => {
    const newStops = selectedStops.filter((_, i) => i !== index);
    setSelectedStops(newStops);
    calculateRoute(newStops);
  };

  const calculateRoute = (stops, type = vehicleType) => {
    if (stops.length < 2) {
      setTotalDistance(0);
      setEstimatedCost(0);
      return;
    }

    let distance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      distance += calculateDistance(
        stops[i].lat,
        stops[i].lng,
        stops[i + 1].lat,
        stops[i + 1].lng
      );
    }

    setTotalDistance(Math.round(distance));
    setEstimatedCost(calculateCost(distance, type));
  };

  const handleBooking = () => {
    const user = localStorage.getItem("pathfinder_user");
    
    if (!user) {
      toast.error("Please login to confirm booking");
      navigate("/auth");
      return;
    }

    if (selectedStops.length < 2) {
      toast.error("Please select at least 2 locations");
      return;
    }

    if (!scheduledDate) {
      toast.error("Please select a date");
      return;
    }

    // Store booking data and navigate to confirmation
    const bookingData = {
      stops: selectedStops,
      totalDistance,
      estimatedCost,
      vehicleType,
      scheduledDate,
    };
    
    localStorage.setItem("pending_booking", JSON.stringify(bookingData));
    navigate("/booking/confirm");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-8 text-center">Plan Your Itinerary</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Locations */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Popular Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                      onClick={() => addStop(location)}
                    >
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{location.description}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itinerary Builder */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Route ({selectedStops.length} stops)</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select locations to build your itinerary
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedStops.map((stop, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">{stop.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStop(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedStops.length >= 2 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle">Vehicle Type</Label>
                      <select
                        id="vehicle"
                        value={vehicleType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setVehicleType(nextType);
                          calculateRoute(selectedStops, nextType);
                        }}
                        className="w-full mt-2 px-3 py-2 rounded-md border border-input bg-background"
                      >
                        <option value="sedan">Sedan (4 seater)</option>
                        <option value="suv">SUV (7 seater)</option>
                        <option value="tempo">Tempo Traveller (12 seater)</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="date">Scheduled Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-secondary/10">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Distance</span>
                      <span className="text-2xl font-bold">{totalDistance} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estimated Cost</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(estimatedCost)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      *Includes fuel, driver charges, and estimated time costs
                    </p>
                    <Button className="w-full" size="lg" onClick={handleBooking}>
                      Confirm Booking
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
