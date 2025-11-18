import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, Shield, Star, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-waterfall.jpg";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Badge } from "@/components/Badge";
import { allPlaces } from "@/data/places";

const featuredPlaces = [
  {
    id: "1",
    name: "Living Root Bridge",
    description: "Ancient double-decker living root bridge in Cherrapunji",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
    lat: 25.2622,
    lng: 91.7323,
  },
  {
    id: "2",
    name: "Umiam Lake",
    description: "Scenic reservoir surrounded by hills",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    lat: 25.6815,
    lng: 91.9059,
  },
  {
    id: "3",
    name: "Elephant Falls",
    description: "Three-tiered waterfall near Shillong",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800",
    lat: 25.5218,
    lng: 91.8847,
  },
  {
    id: "4",
    name: "Mawlynnong Village",
    description: "Asia's cleanest village with scenic beauty",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    lat: 25.2044,
    lng: 91.9392,
  },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const getCurrentUser = () => {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getCurrentUser();
  const isDriver = user?.role === "driver";

  const filteredPlaces = selectedCategory === "all" ? allPlaces : allPlaces.filter((place) => place.category === selectedCategory);

  const categoryColors = {
    places: "bg-category-places",
    food: "bg-category-food",
    markets: "bg-category-markets",
    handicrafts: "bg-category-handicrafts",
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden mt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div 
            className="absolute inset-0" 
            style={{ background: "var(--gradient-hero)" }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white mb-8">
            <Badge variant="demo" className="mb-4">
              DEMO MODE - Sample data only
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
              Discover the Abode of Clouds
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90">
              Your personalized travel companion for exploring Meghalaya's hidden gems
            </p>
          </div>

          {/* Hero CTA Card */}
          <div className="max-w-2xl mx-auto bg-card rounded-xl p-6 md:p-8 shadow-xl backdrop-blur-sm border border-border/50 animate-fade-in">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
              Start Your Journey
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {!isDriver ? (
                <>
                  <Link to="/itinerary" className="flex-1">
                    <Button size="lg" className="w-full animate-pulse-glow">
                      <MapPin className="mr-2 h-5 w-5" />
                      Plan My Trip
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full">
                      Get Started
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/driver" className="flex-1">
                    <Button size="lg" className="w-full">
                      <Car className="mr-2 h-5 w-5" />
                      View Rides
                    </Button>
                  </Link>
                  <Link to="/itinerary" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full">
                      Book For Someone Else
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Popular routes: Shillong → Cherrapunji → Mawlynnong
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose PathFinder?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none card-shadow hover-lift bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Custom Itineraries</h3>
                <p className="text-muted-foreground">
                  Build multi-stop routes with automatic distance and cost calculations
                </p>
              </CardContent>
            </Card>
            <Card className="border-none card-shadow hover-lift bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Drivers</h3>
                <p className="text-muted-foreground">
                  Local drivers verified by our team for your safety and comfort
                </p>
              </CardContent>
            </Card>
            <Card className="border-none card-shadow hover-lift bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Bookings</h3>
                <p className="text-muted-foreground">
                  SMS verification and booking codes for secure trip confirmations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Explore by Category */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Explore Meghalaya
              </h2>
              <p className="text-muted-foreground">
                Discover places, food, markets, and authentic handicrafts
              </p>
            </div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaces.map((place) => (
              <Card 
                key={place.id} 
                className="overflow-hidden border-none card-shadow hover-lift bg-card cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 bg-card/90 rounded-full px-3 py-1 flex items-center gap-1 backdrop-blur-sm">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <span className="text-sm font-semibold">{place.rating}</span>
                  </div>
                  <div className={`absolute top-2 left-2 ${categoryColors[place.category]} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                    {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {place.description}
                  </p>
                  {place.distance && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {place.distance} from city center
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Join thousands of travelers who trust PathFinder for their Meghalaya adventures
          </p>
          <Link to="/itinerary">
            <Button size="lg" variant="accent" className="shadow-xl">
              Plan Your Trip Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2024 PathFinder Shillong. All rights reserved.</p>
          <div className="flex justify-center gap-2 items-center mt-2">
            <Badge variant="demo">DEMO MODE</Badge>
            <span className="text-sm text-muted-foreground">Sample data only</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
