import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Car } from "lucide-react"; // Replaced Lock icons with MessageSquare
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      const response = await sendOtp(phone);
      if (response.success) {
        setOtpSent(true);
        toast.success("OTP sent successfully", {
          description: `A verification code has been sent to ${phone}`,
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP", {
        description: "Please check your phone number and try again.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Flow 1: Request OTP
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    // Flow 2: Verify OTP
    try {
      const loginResponse = await verifyOtp(phone, otp);
      if (loginResponse.success) {
        navigate('/');
      } else {
        toast.error(loginResponse?.message || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed", {
        description: "The OTP entered is incorrect or has expired.",
        duration: 4000
      });
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
                {otpSent ? "Verify OTP" : "Sign in to your account"}
              </CardTitle>
              <p className="text-sm text-white/60 mt-2">
                {otpSent 
                  ? "Enter the code sent to your mobile device to continue." 
                  : "Enter your phone number to receive a secure login code."}
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
                      disabled={otpSent}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70 disabled:opacity-50"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="otp" className="text-xs text-white/70">
                      One-Time Password
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="pl-9 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/70"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 hover:text-emerald-300 uppercase tracking-wider font-bold"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{otpSent ? "Code expires in 5 minutes." : "Use the phone number you registered with."}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-2.5 transition-all"
                >
                  {otpSent ? "Verify & Sign In" : "Send Login Code"}
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

          {/* Right: Info (Remains Unchanged) */}
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