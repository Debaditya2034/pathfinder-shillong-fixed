import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Heart, Phone, Mail } from "lucide-react";

const About = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              About PathFinder Shillong
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Connecting travelers with trusted local drivers to explore the breathtaking beauty of Meghalaya.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                PathFinder Shillong was born from a simple idea: make exploring Meghalaya as authentic and stress-free 
                as possible. We believe that the best travel experiences come from connecting with local people who 
                know the land, the culture, and the hidden gems that guidebooks can't capture.
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Our platform bridges the gap between travelers seeking authentic experiences and local drivers who 
                are passionate about sharing their homeland. Every booking is verified, every route is optimized, 
                and every journey is designed to create lasting memories.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card border-border/50 shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4">
                  <Heart className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Authenticity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We prioritize genuine local experiences over tourist traps, ensuring every journey feels real and meaningful.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4">
                  <Users className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Trust & Safety</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every driver is verified, every vehicle is checked, and every booking is secured with dual verification codes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4">
                  <MapPin className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Local Expertise</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our drivers are locals who know the best routes, weather patterns, and hidden spots that make Meghalaya special.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Areas */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Service Areas</h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                We currently serve the following areas in Meghalaya:
              </p>
              <ul className="space-y-3 text-base md:text-lg text-muted-foreground" role="list">
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Shillong and surrounding areas</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Cherrapunji (Sohra)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Mawlynnong (Asia's Cleanest Village)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Living Root Bridges (Nongriat, Riwai)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Dawki and Umngot River</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Laitlum Grand Canyon</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">•</span>
                  <span>Nohkalikai Falls and surrounding waterfalls</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Get in Touch</h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                Have questions or need assistance? We're here to help you plan your perfect Meghalaya adventure.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary flex-shrink-0">
                    <Phone className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">Phone</h3>
                    <p className="text-muted-foreground">+91 XXX XXX XXXX</p>
                    <p className="text-sm text-muted-foreground mt-1">Available 9 AM - 8 PM IST</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary flex-shrink-0">
                    <Mail className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">Email</h3>
                    <p className="text-muted-foreground">support@pathfindershillong.com</p>
                    <p className="text-sm text-muted-foreground mt-1">We respond within 24 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-primary/30 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Explore Meghalaya?</h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Start planning your journey today and discover the magic of the abode of clouds.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/itinerary" aria-label="Plan your trip">
                  <button className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 active:scale-95 min-h-[48px] shadow-lg">
                    Plan Your Trip
                  </button>
                </Link>
                <Link to="/auth?mode=signup" aria-label="Sign up">
                  <button className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 active:scale-95 min-h-[48px]">
                    Sign Up
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-card/50 py-10 md:py-12" role="contentinfo">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm md:text-base text-muted-foreground">© 2024 PathFinder Shillong. All demo rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;

