import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, Lock, Eye, EyeOff, Car } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(phone, password);
      window.location.href = "/";
    } catch (err: any) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-4xl w-full grid md:grid-cols-[1.1fr_1fr] gap-8 items-center">
          {/* Left: Form */}
          <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white shadow-2xl">
            <CardHeader className="pb-4">
              <Badge className="w-fit mb-2 bg-white/10 border border-white/15 text-xs uppercase tracking-[0.2em] text-white/70 rounded-full px-3 py-1">
                Welcome
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Sign in to your account
              </CardTitle>
              <p className="text-sm text-white/60 mt-2">
                Enter your credentials to access your account and manage your rides.
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs text-white/70">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <Phone className="h-4 w-4" />
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs text-white/70">
                    Password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-9 pr-10 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Use the phone number you registered with.</span>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-2.5"
                >
                  Sign In
                </Button>

                <div className="text-center text-xs text-white/60">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-emerald-300 hover:text-emerald-200 underline-offset-4 hover:underline"
                  >
                    Create one
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right: Info */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Car className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                    CapsuleCabs
                  </p>
                  <p className="text-sm text-white/80">
                    Seamless intercity cab experience
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/65">
                <li>• View and manage all your bookings in one place.</li>
                <li>• Save frequent routes and passenger details.</li>
                <li>• Faster checkout with stored preferences.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
              <p className="font-medium mb-1 text-white">
                New to CapsuleCabs?
              </p>
              <p className="text-xs text-white/60 mb-3">
                Create an account in less than a minute and start booking rides.
              </p>
              <Link to="/signup">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/30 text-black hover:bg-white hover:text-black"
                >
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
