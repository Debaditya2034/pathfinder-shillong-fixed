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

      <main>
        <section className="relative mt-16 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Shillong hills" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-hero-radial" />
          </div>

          <div className="relative z-10 container mx-auto px-4 py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="text-white">
                <Badge variant="demo" className="mb-5 bg-white/10 text-white backdrop-blur">
                  Demo Experience Â· Sample Data
                </Badge>
                <h1 className="text-glow text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
                  Plan Shillong drives the way locals actually travel.
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-white/85">
                  Build thoughtful itineraries, match with verified Khasi drivers, and keep bookings secure with dual
                  codes plus realtime routing intelligence.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {heroHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/25 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/35" role="article" aria-label={item.title}>
                      <item.icon className="mb-3 h-6 w-6 text-accent" aria-hidden="true" />
                      <p className="font-semibold text-lg mb-2">{item.title}</p>
                      <p className="text-sm text-white/85 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  {!isDriver ? (
                    <>
                      <Link to="/itinerary" aria-label="Plan your journey">
                        <Button size="lg" className="shadow-[0_25px_45px_rgba(4,31,18,0.5)] min-h-[48px] px-6 transition-all hover:scale-105 active:scale-95">
                          <MapPin className="mr-2 h-5 w-5" aria-hidden="true" />
                          Plan my journey
                        </Button>
                      </Link>
                      <Link to="/auth?mode=signup" aria-label="Get started">
                        <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10 hover:text-white min-h-[48px] px-6 transition-all hover:scale-105 active:scale-95">
                          Get started
                          <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/driver" aria-label="View ride board">
                        <Button size="lg" variant="accent" className="min-h-[48px] px-6 transition-all hover:scale-105 active:scale-95">
                          <Car className="mr-2 h-5 w-5" aria-hidden="true" />
                          View ride board
                        </Button>
                      </Link>
                      <Link to="/itinerary" aria-label="Book for someone else">
                        <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10 hover:text-white min-h-[48px] px-6 transition-all hover:scale-105 active:scale-95">
                          Book for someone else
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-3" role="region" aria-label="Statistics">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-3xl md:text-4xl font-bold mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{stat.value}</p>
                      <p className="text-sm uppercase tracking-wide text-white/85 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[32px] p-8 shadow-xl border border-border/50">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Next departure</p>
                    <p className="text-2xl font-bold text-foreground mt-1">Skyfall Loop</p>
                  </div>
                  <Badge variant="driver" aria-label="Demo badge">demo</Badge>
                </div>

                <div className="space-y-4">
                  {curatedRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm transition-all hover:border-primary/60 hover:bg-card/90 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Route: ${route.title}`}
                    >
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">{route.title}</p>
                      <p className="text-base font-bold text-foreground mb-1">{route.stops}</p>
                      <p className="text-xs text-muted-foreground">{route.distance}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-lg" role="note" aria-label="Local tip">
                  <p className="text-sm uppercase tracking-wide text-white/90 font-semibold mb-2">Local tip</p>
                  <p className="text-lg font-bold leading-relaxed">
                    Start before sunrise to beat the fog wall on the Laitlum stretch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-halo py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">Built for travellers</p>
              <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Why PathFinder is the calmest way to move through Meghalaya
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {journeySteps.map((step) => (
                <div key={step.title} className="glass-panel rounded-3xl p-6 transition-all hover:scale-105 hover:shadow-lg" role="article" aria-label={step.title}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                    <step.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="text-lg md:text-xl font-bold mb-3">{step.title}</p>
                  <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">Explore Meghalaya</p>
                <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Pick a vibe, PathFinder handles the rest.</h2>
                <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  Walk through misty root bridges, taste smoky Khasi cuisine, shop indigenous handicrafts, and more.
                </p>
              </div>
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPlaces.map((place) => (
                <Card key={place.id} className="group overflow-hidden border border-border/50 bg-card shadow-md transition-all hover:-translate-y-2 hover:shadow-xl" role="article" aria-label={place.name}>
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
                      <Star className="mr-1 inline h-4 w-4 text-accent" />
                      {place.rating}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2">{place.name}</h3>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground line-clamp-2 leading-relaxed">{place.description}</p>
                    {place.distance && (
                      <p className="mt-4 flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
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
                <Card key={spot.id} className="flex flex-col overflow-hidden border border-border/50 bg-card shadow-lg transition-all hover:shadow-xl hover:-translate-y-1" role="article" aria-label={spot.name}>
                  <div className="relative h-56 overflow-hidden">
                    <img src={spot.image} alt={spot.name} className="h-full w-full object-cover transition duration-700 hover:scale-110" loading="lazy" />
                    <div className="absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                      <Star className="mr-1 inline h-4 w-4 text-accent" />
                      {spot.rating.toFixed(1)}
                    </div>
                    <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase text-pf-green">
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

        <section className="relative overflow-hidden py-18">
          <div className="container relative z-10 mx-auto px-4">
            <div className="glass-panel rounded-[32px] border border-white/20 bg-gradient-to-r from-pf-green to-pf-green-600 p-10 text-white shadow-xl">
              <div className="grid items-center gap-10 md:grid-cols-[minmax(0,2fr)_1fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Ready when you are</p>
                  <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                    Reserve your driver and itinerary in less than five minutes.
                  </h2>
                  <p className="mt-4 max-w-2xl text-white/80">
                    PathFinder combines trusted people, verified paperwork, and dynamic routing so every drive through
                    the abode of clouds feels calm.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link to="/itinerary">
                      <Button size="lg" variant="accent" className="bg-white text-pf-green hover:bg-panel-bg">
                        {isDriver ? "Book for someone else" : "Start planning"}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    {isDriver ? (
                      <Link to="/driver">
                        <Button size="lg" variant="ghost" className="text-white">
                          View ride board
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/auth">
                        <Button size="lg" variant="ghost" className="text-white">
                          Sign in to manage trips
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 p-6 text-sm text-white/80 backdrop-blur">
                  <p className="font-semibold uppercase tracking-wide text-white">Live trust signals</p>
                  <ul className="mt-4 space-y-3 text-white/80">
                    <li>â€¢ Dual booking + driver codes</li>
                    <li>â€¢ 24h itinerary concierge</li>
                    <li>â€¢ SOS routing for hill roads</li>
                    <li>â€¢ Transparent driver payouts</li>
                  </ul>
                </div>
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
