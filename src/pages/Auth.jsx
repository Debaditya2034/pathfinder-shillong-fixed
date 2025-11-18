import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mountain } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("tourist");
  const [loading, setLoading] = useState(false);

  const validateAdminInputs = () => {
    if (mode !== "signup" || role !== "admin") return true;

    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Enter a valid admin email.");
    }
    if (!/^\d{10}$/.test(phone)) {
      errors.push("Admin phone number must be exactly 10 digits.");
    }
    if (password.length !== 10) {
      errors.push("Admin password must be exactly 10 characters.");
    }

    if (errors.length) {
      toast.error(errors[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAdminInputs()) {
      return;
    }
    setLoading(true);

    // Demo mode - simulate authentication
    setTimeout(() => {
      const demoUser = {
        uid: "demo-" + Date.now(),
        email,
        phone,
        role,
        displayName: email.split("@")[0],
      };
      
      localStorage.setItem("pathfinder_user", JSON.stringify(demoUser));
      toast.success(mode === "login" ? "Logged in successfully!" : "Account created successfully!");
      
      // Redirect based on role
      if (role === "driver") {
        navigate("/driver");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <Mountain className="h-12 w-12 text-primary" />
            </Link>
          </div>
          <CardTitle className="text-2xl">PathFinder Shillong</CardTitle>
          <CardDescription>
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (for SMS OTP)</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    inputMode="numeric"
                    maxLength={role === "admin" ? 10 : undefined}
                    pattern="\d*"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  {role === "admin" && <p className="text-xs text-muted-foreground">Admin numbers must be exactly 10 digits.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    maxLength={role === "admin" ? 10 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {role === "admin" && <p className="text-xs text-muted-foreground">Admin password must be exactly 10 characters.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background">
                    <option value="tourist">Tourist</option>
                    <option value="driver">Driver/Guide</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>DEMO MODE - Any credentials work</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
