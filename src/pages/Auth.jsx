import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mountain } from "lucide-react";
import { signIn, signUp } from "@/lib/auth";

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
    if (mode === "signup" && !validateAdminInputs()) {
      return;
    }
    setLoading(true);

    try {
      let creds;
      
      if (mode === "login") {
        creds = await signIn(email, password);
      } else {
        creds = await signUp({ email, phone, password, role });
      }

      // Get role from creds
      const userRole = creds?.role || creds?.user?.role || (creds?.user?.email && "tourist") || role || "tourist";
      
      toast.success(mode === "login" ? "Logged in successfully!" : "Account created successfully!");
      
      // Redirect based on role - no forced redirect to signup
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "driver") {
        navigate("/driver");
      } else {
        // Tourist goes to itinerary dashboard
        navigate("/itinerary");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f0c] p-4">
      <Card className="w-full max-w-md shadow-xl bg-[#14221c] border border-[#1d3a2f]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <Mountain className="h-12 w-12 text-primary" />
            </Link>
          </div>
          <CardTitle className="text-2xl text-[#e3f5ec]">PathFinder Shillong</CardTitle>
          <CardDescription className="text-[#d9efe6]">
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
                  <Label htmlFor="email" className="text-[#e3f5ec]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#e3f5ec]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                  />
                </div>
                <Button type="submit" className="w-full bg-pf-green text-black hover:bg-[#12c77c]" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[#e3f5ec]">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-[#e3f5ec]">Phone (for SMS OTP)</Label>
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
                    className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                  />
                  {role === "admin" && <p className="text-xs text-[#d9efe6]">Admin numbers must be exactly 10 digits.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[#e3f5ec]">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    maxLength={role === "admin" ? 10 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                  />
                  {role === "admin" && <p className="text-xs text-[#d9efe6]">Admin password must be exactly 10 characters.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[#e3f5ec]">I am a</Label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[#1d3a2f] bg-[#0f1412] text-[#e8f6ef]">
                    <option value="tourist">Tourist</option>
                    <option value="driver">Driver/Guide</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-pf-green text-black hover:bg-[#12c77c]" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm text-[#d9efe6]">
            <p>DEMO MODE - Any credentials work</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
