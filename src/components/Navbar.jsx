import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Mountain, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Navbar = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
    navigate("/");
  };

  const renderAuthButtons = (variant = "desktop") => {
    const sharedProps = variant === "mobile" ? { className: "w-full" } : {};

    if (user) {
      return (
        <>
          <Link to={`/${user.role}`} className="text-foreground/80 hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className={`gap-2 ${sharedProps.className ?? ""}`.trim()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </>
      );
    }

    return (
      <>
        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" size="sm" {...sharedProps}>
            Login
          </Button>
        </Link>
        <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
          <Button size="sm" {...sharedProps}>
            Sign Up
          </Button>
        </Link>
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">PathFinder</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors" aria-label="Home">
              Home
            </Link>
            <Link to="/about" className="text-foreground/80 hover:text-foreground transition-colors" aria-label="About">
              About
            </Link>
            <Link to="/itinerary" className="text-foreground/80 hover:text-foreground transition-colors" aria-label="Plan Trip">
              Plan Trip
            </Link>
            {renderAuthButtons()}
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="md:hidden text-foreground" aria-label="Toggle menu">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 flex flex-col gap-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-foreground/80 hover:text-foreground transition-colors" aria-label="Home">
              Home
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-foreground/80 hover:text-foreground transition-colors" aria-label="About">
              About
            </Link>
            <Link to="/itinerary" onClick={() => setMobileMenuOpen(false)} className="text-foreground/80 hover:text-foreground transition-colors" aria-label="Plan Trip">
              Plan Trip
            </Link>
            {renderAuthButtons("mobile")}
          </div>
        )}
      </div>
    </nav>
  );
};
