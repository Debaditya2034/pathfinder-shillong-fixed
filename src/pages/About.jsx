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
    <div className="min-h-screen bg-pf-dark">
      <Navbar user={user} />
      
      <main role="main" className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-white">
              About PathFinder Shillong
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-gray-200">
              Connecting travelers with trusted local drivers to explore the breathtaking beauty of Meghalaya.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <Card className="bg-pf-muted border-gray-700 shadow-lg">
            <CardContent className="p-6 md:p-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">Our Mission</h2>
              <p className="text-sm md:text-base leading-relaxed text-gray-200 mb-4">
                PathFinder Shillong was born from a simple idea: make exploring Meghalaya as authentic and stress-free 
                as possible. We believe that the best travel experiences come from connecting with local people who 
                know the land, the culture, and the hidden gems that guidebooks can't capture.
              </p>
              <p className="text-sm md:text-base leading-relaxed text-gray-200">
                Our platform bridges the gap between travelers seeking authentic experiences and local drivers who 
                are passionate about sharing their homeland. Every booking is verified, every route is optimized, 
                and every journey is designed to create lasting memories.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-white">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-pf-muted border-gray-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 min-h-[120px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pf-green/20 text-pf-green mb-4">
                  <Heart className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Authenticity</h3>
                <p className="text-sm leading-relaxed text-gray-200">
                  We prioritize genuine local experiences over tourist traps, ensuring every journey feels real and meaningful.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-pf-muted border-gray-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 min-h-[120px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pf-green/20 text-pf-green mb-4">
                  <Users className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Trust & Safety</h3>
                <p className="text-sm leading-relaxed text-gray-200">
                  Every driver is verified, every vehicle is checked, and every booking is secured with dual verification codes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-pf-muted border-gray-700 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 min-h-[120px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-pf-green/20 text-pf-green mb-4">
                  <MapPin className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Local Expertise</h3>
                <p className="text-sm leading-relaxed text-gray-200">
                  Our drivers are locals who know the best routes, weather patterns, and hidden spots that make Meghalaya special.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Areas */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <Card className="bg-pf-muted border-gray-700 shadow-lg">
            <CardContent className="p-6 md:p-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">Service Areas</h2>
              <p className="text-sm md:text-base leading-relaxed text-gray-200 mb-6">
                We currently serve the following areas in Meghalaya:
              </p>
              <ul className="space-y-3 text-sm md:text-base text-gray-200" role="list">
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Shillong and surrounding areas</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Cherrapunji (Sohra)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Mawlynnong (Asia's Cleanest Village)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Living Root Bridges (Nongriat, Riwai)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Dawki and Umngot River</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Laitlum Grand Canyon</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-pf-green" aria-hidden="true">•</span>
                  <span>Nohkalikai Falls and surrounding waterfalls</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <Card className="bg-gradient-to-br from-pf-green/10 to-pf-green/5 border-pf-green/30 shadow-lg">
            <CardContent className="p-6 md:p-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">Get in Touch</h2>
              <p className="text-sm md:text-base leading-relaxed text-gray-200 mb-8">
                Have questions or need assistance? We're here to help you plan your perfect Meghalaya adventure.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pf-green/20 text-pf-green flex-shrink-0">
                    <Phone className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Phone</h3>
                    <p className="text-gray-200">+91 XXX XXX XXXX</p>
                    <p className="text-xs text-gray-300 mt-1">Available 9 AM - 8 PM IST</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pf-green/20 text-pf-green flex-shrink-0">
                    <Mail className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Email</h3>
                    <p className="text-gray-200">support@pathfindershillong.com</p>
                    <p className="text-xs text-gray-300 mt-1">We respond within 24 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Demo Mode Notice */}
        <section className="container mx-auto px-4 md:px-8">
          <Card className="bg-pf-muted/50 border-yellow-500/30 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-sm md:text-base text-yellow-300 font-semibold mb-2">DEMO MODE</p>
              <p className="text-xs md:text-sm text-gray-300">
                This is a demonstration version. No real payments are processed. All bookings and data are stored locally.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-gray-700 bg-pf-muted py-10 md:py-12" role="contentinfo">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm md:text-base text-gray-300">© 2024 PathFinder Shillong. All demo rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;

