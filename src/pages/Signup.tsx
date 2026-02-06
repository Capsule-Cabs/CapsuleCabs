import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Car,
  User,
  Phone as PhoneIcon,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const { register } = useContext(AuthContext);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
      });
      window.location.href = "/";
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-1">
        <div className="max-w-5xl w-full grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          {/* Left: Form */}
          <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Join CapsuleCabs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs text-white/70">
                      First Name
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <User className="h-4 w-4" />
                      </span>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="First name"
                        className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs text-white/70">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Last name"
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-white/70">
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="you@example.com"
                      className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                    />
                  </div>
                </div> */}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs text-white/70">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <PhoneIcon className="h-4 w-4" />
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="Enter your phone number"
                        className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs text-white/70">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                    >
                      <SelectTrigger className="bg-black/40 border-white/20 text-white focus:ring-emerald-400/70">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/20 text-white">
                        <SelectItem value="passenger" className="focus:bg-white/10 focus:text-white">
                          Passenger
                        </SelectItem>
                        {/* <SelectItem value="operator" className="focus:bg-white/10 focus:text-white">
                          Operator
                        </SelectItem>
                        <SelectItem value="admin" className="focus:bg-white/10 focus:text-white">
                          Admin
                        </SelectItem> */}
                        <SelectItem value="driver" className="focus:bg-white/10 focus:text-white">
                          Driver
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
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
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Create a password"
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs text-white/70"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <Lock className="h-4 w-4" />
                      </span>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Re-enter password"
                        className="pl-9 pr-10 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/60">
                  Use at least 8 characters, including a number and a symbol.
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-2.5"
                >
                  Create account
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:text-primary-hover font-semibold transition-smooth">
                      Sign in here
                    </Link>
                  </p>
                </div>

              </form>
            </CardContent>
          </Card>

          {/* Right: Info */}
          <div className="hidden lg:flex flex-col gap-4 mt-20">
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
                    Built for your daily commute
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/65">
                <li>• Save your favourite routes and passengers.</li>
                <li>• Access bookings and tickets anytime.</li>
                <li>• Get a smoother, faster checkout experience.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
              <p className="font-medium mb-1 text-white">
                Why sign up?
              </p>
              <p className="text-xs text-white/60 mb-2">
                Your details are securely stored and make every future booking much faster.
              </p>
              <p className="text-xs text-white/50">
                You can update your profile and preferences anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;