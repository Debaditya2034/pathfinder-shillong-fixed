import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, Shield, Star, ChevronRight, Sparkles, Compass, Clock3 } from "lucide-react";
import { UtensilsCrossed } from "lucide-react";
import heroImage from "@/assets/hero-waterfall.jpg";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Badge } from "@/components/Badge";
import { allPlaces } from "@/data/places";
import { highlightedRestaurants } from "@/data/restaurants";

const heroHighlights = [
  {
    title: "Locally curated",
    description: "Itineraries designed with Khasi guides & mountain rescuers",
    icon: Sparkles,
  },
  {
    title: "Weather aware",
    description: "Realtime rain + fog intel keeps each segment flexible",
    icon: Compass,
  },
];

const heroStats = [
  { label: "Routes designed", value: "1.2K+" },
  { label: "Verified drivers", value: "210" },
  { label: "Avg. rating", value: "4.9" },
];

const curatedRoutes = [
  {
    id: "cloud-chaser",
    title: "Cloud Chaser",
    stops: "Shillong â†’ Laitlum â†’ Cherrapunji",
    distance: "184 km loop",
  },
  {
    id: "living-roots",
    title: "Living Roots",
    stops: "Umiam â†’ Nongriat â†’ Mawlynnong",
    distance: "212 km",
  },
  {
    id: "market-trails",
    title: "Market Trails",
    stops: "Police Bazaar â†’ Bara Bazaar â†’ Craft Lane",
    distance: "18 km",
  },
];

const journeySteps = [
  {
    title: "Map your dream",
    description: "Pick up to seven stopsâ€”PathFinder calculates road time, breaks, and driver pricing.",
    icon: MapPin,
  },
  {
    title: "Match verified drivers",
    description: "Each driver is identity checked with vehicle papers, earnings history, and reviews.",
    icon: Car,
  },
  {
    title: "Lock it with dual codes",
    description: "Booking & driver codes plus SMS reminders keep every pickup authentic.",
    icon: Shield,
  },
  {
    title: "Track & tweak live",
    description: "Need a detour to a hidden cafÃ©? Update the itinerary without losing pace.",
    icon: Clock3,
  },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getCurrentUser = () => {
    const keys = ["pathfinder_user", "currentUser"];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  };

  const user = getCurrentUser();
  const isDriver = user?.role === "driver";

  const filteredPlaces =
    selectedCategory === "all" ? allPlaces : allPlaces.filter((place) => place.category === selectedCategory);

  const categoryColors = {
    places: "bg-category-places",
    food: "bg-category-food",
    markets: "bg-category-markets",
    handicrafts: "bg-category-handicrafts",
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main role="main">
        <section aria-label="Hero" className="relative mt-16 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Shillong landscape" className="w-full h-64 md:h-96 object-cover" />
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="h-full w-full" style={{background: 'linear-gradient(180deg, rgba(11,15,12,0.0) 10%, rgba(11,15,12,0.6) 90%)'}} />
            </div>
          </div>

          <div className="relative z-10 container mx-auto px-4 md:px-8 py-12 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="text-white">
                <Badge variant="demo" className="mb-5 bg-white/10 text-white backdrop-blur">
                  Demo Experience · Sample Data
                </Badge>
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4">
                  PathFinder Shillong
                </h1>
                <p className="mt-2 max-w-xl text-sm md:text-base leading-relaxed text-white/90">
                  Localized travel & guide services across Meghalaya.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {heroHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-glow backdrop-blur">
                      <item.icon className="mb-3 h-6 w-6 text-accent" />
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-white/70">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  {!isDriver ? (
                    <>
                      <Link to="/itinerary" tabIndex={0} className="pf-focus">
                        <button className="pf-btn bg-pf-green text-black hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                          <MapPin className="mr-2 h-5 w-5" aria-hidden="true" />
                          Plan my journey
                        </button>
                      </Link>
                      <Link to="/auth?mode=signup" tabIndex={0} className="pf-focus">
                        <button className="pf-btn bg-transparent border border-gray-600 text-white hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                          Get started
                          <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/driver" tabIndex={0} className="pf-focus">
                        <button className="pf-btn bg-pf-green text-black hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                          <Car className="mr-2 h-5 w-5" aria-hidden="true" />
                          View ride board
                        </button>
                      </Link>
                      <Link to="/itinerary" tabIndex={0} className="pf-focus">
                        <button className="pf-btn bg-transparent border border-gray-600 text-white hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                          Book for someone else
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                      <p className="text-sm uppercase tracking-wide text-white/70">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[32px] p-8 shadow-xl bg-pf-muted">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Next departure</p>
                    <p className="text-2xl font-semibold text-foreground whitespace-normal break-words">Skyfall Loop</p>
                  </div>
                  <Badge variant="driver" className="ml-2 flex-shrink-0">demo</Badge>
                </div>

                <div className="space-y-4">
                  {curatedRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="rounded-2xl border border-border/70 bg-panel-bg/70 px-4 py-3 shadow-sm transition hover:border-pf-green/60 min-h-[120px]"
                    >
                      <p className="text-sm font-medium text-muted-foreground whitespace-normal break-words">{route.title}</p>
                      <p className="text-base font-semibold text-foreground whitespace-normal break-words">{route.stops}</p>
                      <p className="text-xs text-muted-foreground whitespace-normal break-words">{route.distance}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-gradient-to-r from-pf-green to-pf-green-600 p-5 text-white">
                  <p className="text-sm uppercase tracking-wide text-white/80">Local tip</p>
                  <p className="text-lg font-semibold">
                    Start before sunrise to beat the fog wall on the Laitlum stretch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-halo py-16" aria-label="featured places">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-pf-green">Built for travellers</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-foreground">
                Why PathFinder is the calmest way to move through Meghalaya
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {journeySteps.map((step) => (
                <div key={step.title} className="glass-panel rounded-3xl p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-pf-green/10 text-pf-green">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-pf-green">Explore Meghalaya</p>
                <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Pick a vibe, PathFinder handles the rest.</h2>
                <p className="text-sm md:text-base leading-relaxed text-gray-200 mt-2">
                  Walk through misty root bridges, taste smoky Khasi cuisine, shop indigenous handicrafts, and more.
                </p>
              </div>
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPlaces.map((place) => (
                <Card key={place.id} className="group overflow-hidden border-none bg-panel-bg/90 shadow-md transition hover:-translate-y-1 min-h-[120px]">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold uppercase text-white">
                      <span className={`${categoryColors[place.category]} px-3 py-1 rounded-full`}>
                        {place.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                      <Star className="mr-1 inline h-4 w-4 text-accent" aria-hidden="true" />
                      {place.rating}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold">{place.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{place.description}</p>
                    {place.distance && (
                      <p className="mt-3 flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" aria-hidden="true" />
                        {place.distance} from city centre
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-panel-bg/60 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-pf-green flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Shillong eats
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">Restaurants locals recommend without a second thought.</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Seed your itinerary with smoky jadoh kitchens, zero-mile farm tables, and cafÃ©s that stay open through the rain curtains.
                </p>
              </div>
              <Link to="/itinerary">
                <Button size="lg" variant="accent" className="shadow-[0_25px_45px_rgba(15,90,54,0.25)]">
                  {isDriver ? "Book for someone else" : "Add food halts"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {highlightedRestaurants.map((spot) => (
                <Card key={spot.id} className="flex flex-col overflow-hidden border-none bg-white shadow-[0_25px_60px_rgba(15,90,54,0.08)]">
                  <div className="relative h-56 overflow-hidden">
                    <img src={spot.image} alt={spot.name} className="h-full w-full object-cover transition duration-700 hover:scale-110" />
                    <div className="absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                      <Star className="mr-1 inline h-4 w-4 text-accent" aria-hidden="true" />
                      {spot.rating.toFixed(1)}
                    </div>
                    <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase text-pf-green whitespace-normal break-words">
                      Signature: {spot.specialty}
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-4 p-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Chef verified</p>
                      <h3 className="text-xl font-semibold text-foreground">{spot.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">{spot.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {spot.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-panel-bg px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 md:py-20" role="region" aria-label="Call to action">
          <div className="container relative z-10 mx-auto px-4 md:px-8">
            <div className="bg-pf-muted rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-white">Plan your trip across Meghalaya</h2>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">Create multi-stop itineraries, pick vehicles, and get instant estimates.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/itinerary" tabIndex={0} className="pf-focus">
                  <button className="pf-btn bg-pf-green text-black hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed">
                    Plan a Trip
                  </button>
                </Link>
                <Link to="/about" className="text-sm text-gray-300 pf-focus" tabIndex={0}>
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-panel-bg/70 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">Â© 2024 PathFinder Shillong. All demo rights reserved.</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="demo">Demo mode</Badge>
            <span className="text-sm text-muted-foreground">Sample data only</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
