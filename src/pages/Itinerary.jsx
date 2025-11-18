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
    <div className="min-h-screen bg-[#0b0f0c]">
      <Navbar />
      
      <main className="min-h-screen bg-[#0f1412] text-[#e8f6ef] p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-[#14221c] border border-[#1d3a2f] rounded-xl p-6">
          <h1 className="text-4xl font-bold mb-8 text-center text-[#e3f5ec]">Plan Your Itinerary</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Locations */}
          <div>
            <Card className="bg-[#14221c] border border-[#1d3a2f]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#e3f5ec]">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Popular Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#1d3a2f] bg-[#0f1412] hover:border-pf-green transition-colors cursor-pointer"
                      onClick={() => addStop(location)}
                    >
                      <div>
                        <p className="font-medium text-[#e3f5ec]">{location.name}</p>
                        <p className="text-sm text-[#d9efe6]">{location.description}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-pf-green hover:text-[#12c77c]">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itinerary Builder */}
          <div className="space-y-6">
            <Card className="bg-[#14221c] border border-[#1d3a2f]">
              <CardHeader>
                <CardTitle className="text-[#e3f5ec]">Your Route ({selectedStops.length} stops)</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStops.length === 0 ? (
                  <p className="text-[#d9efe6] text-center py-8">
                    Select locations to build your itinerary
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedStops.map((stop, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1412] border border-[#1d3a2f]"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pf-green text-black flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium text-[#e3f5ec]">{stop.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStop(index)}
                          className="text-pf-green hover:text-[#12c77c]"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedStops.length >= 2 && (
              <>
                <Card className="bg-[#14221c] border border-[#1d3a2f]">
                  <CardHeader>
                    <CardTitle className="text-[#e3f5ec]">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle" className="text-[#e3f5ec]">Vehicle Type</Label>
                      <select
                        id="vehicle"
                        value={vehicleType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setVehicleType(nextType);
                          calculateRoute(selectedStops, nextType);
                        }}
                        className="w-full mt-2 px-3 py-2 rounded-md border border-[#1d3a2f] bg-[#0f1412] text-[#e8f6ef]"
                      >
                        <option value="sedan">Sedan (4 seater)</option>
                        <option value="suv">SUV (7 seater)</option>
                        <option value="tempo">Tempo Traveller (12 seater)</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="date" className="text-[#e3f5ec]">Scheduled Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-2 bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#14221c] border border-[#1d3a2f]">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#d9efe6]">Total Distance</span>
                      <span className="text-2xl font-bold text-[#e3f5ec]">{totalDistance} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#d9efe6]">Estimated Cost</span>
                      <span className="text-2xl font-bold text-pf-green">
                        {formatCurrency(estimatedCost)}
                      </span>
                    </div>
                    <p className="text-xs text-[#d9efe6]">
                      *Includes fuel, driver charges, and estimated time costs
                    </p>
                    <Button className="w-full bg-pf-green text-black hover:bg-[#12c77c]" size="lg" onClick={handleBooking}>
                      Confirm Booking
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Itinerary;
