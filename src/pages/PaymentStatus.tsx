import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Calendar, Armchair, IndianRupee, ArrowLeft, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import verifyPaymentDetails from "@/services/paymentFunctions";
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/sections/Footer'

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attempts = useRef(0);
  const MAX_ATTEMPTS = 20; 

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    const finalizeBooking = async () => {
      const pendingData = localStorage.getItem("pending_booking");
      if (!pendingData) {
        navigate('/');
        return;
      }
      
      const parsedData = JSON.parse(pendingData);
      setTotalPaid(parsedData?.totalFare);

      const pollStatus = async () => {
        try {
          attempts.current += 1;
          
          // 1. Fetch status from your orderStatus API
          const response = await verifyPaymentDetails(parsedData?.merchantOrderId);
          
          // Based on your JSON output: response.data contains the fields
          const paymentData = response?.data; 
          const state = paymentData?.state; // "COMPLETED"
          const bookingId = paymentData?.bookingId; // The ID created by backend
          console.log('parsed data: ', parsedData);

          // 2. If backend has finished processing and linked a booking
          if (state === 'COMPLETED' && bookingId) {
            stopPolling();
            
            setBookingDetails({ 
              ...parsedData, 
              bookingId: bookingId // Use the ID returned from backend
            });
            
            setStatus("success");
            localStorage.removeItem("pending_booking");
            toast.success("Booking Confirmed!");
          } 
          // 3. Handle failure cases
          else if (state === 'FAILED' || attempts.current >= MAX_ATTEMPTS) {
            stopPolling();
            setStatus("failed");
            if (attempts.current >= MAX_ATTEMPTS) {
              toast.error("Verification timed out. Please check your email or history.");
            }
          }
        } catch (error) {
          console.error("Polling Error:", error);
          // Keep polling on temporary network errors until MAX_ATTEMPTS
        }
      };

      // Initial check immediately
      pollStatus();
      // Set interval for subsequent checks (every 3 seconds)
      pollingRef.current = setInterval(pollStatus, 3000);
    };

    finalizeBooking();
    return () => stopPolling();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full transition-colors duration-1000 opacity-20 -z-10 ${
          status === 'success' ? 'bg-emerald-500' : status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
        }`} />

        <AnimatePresence mode="wait">
          {status === "loading" ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="relative h-24 w-24 mx-auto">
                <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
                <Loader2 className="h-24 w-24 animate-pulse text-emerald-500/20 p-6" />
              </div>
              <h2 className="text-xl font-medium tracking-tight text-white/80">Verifying Ticket...</h2>
              <p className="text-sm text-white/40 italic">We are securing your seats, please wait</p>
            </motion.div>
          ) : status === "success" ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Ride Confirmed!</h1>
                <p className="text-zinc-400 mt-2">Pack your bags, your driver is notified.</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-[2rem] blur opacity-50 group-hover:opacity-75 transition duration-1000" />
                
                <Card className="relative bg-zinc-950 border-white/5 rounded-[1.8rem] overflow-hidden shadow-2xl">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Booking Details</span>
                                <h4 className="text-lg font-semibold text-white/90">CapsuleCabs</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Booking ID</span>
                                <p className="text-xs font-mono text-zinc-400 mt-1">{bookingDetails?.bookingId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 py-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5"><Calendar className="h-4 w-4 text-zinc-400" /></div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Travel Date</p>
                                    <p className="text-sm font-medium">{bookingDetails?.travelDate ? format(new Date(bookingDetails.travelDate), "MMM dd, yyyy") : ""}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex items-center px-2 py-2">
                        <div className="absolute left-[-12px] w-6 h-6 rounded-full bg-[#050505] border-r border-white/5" />
                        <div className="flex-1 border-t border-dashed border-white/10 mx-4" />
                        <div className="absolute right-[-12px] w-6 h-6 rounded-full bg-[#050505] border-l border-white/5" />
                    </div>

                    <div className="p-6 bg-white/[0.02] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Amount Paid</p>
                            <div className="flex items-center text-2xl font-black text-emerald-400 italic">
                                <IndianRupee className="h-5 w-5" />
                                <span>{totalPaid}</span>
                            </div>
                        </div>
                        {/* <div className="h-14 w-14 bg-white p-1 rounded-lg opacity-80">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingDetails?.bookingId}`} alt="QR" className="w-full h-full" />
                        </div> */}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => navigate("/")} className="h-14 rounded-2xl border-white/5 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 transition-all gap-2">
                    <Home className="h-4 w-4" /> Home
                </Button>
                <Button onClick={() => window.print()} className="h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                    Save Ticket
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                    <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Payment Failed</h1>
                <p className="text-zinc-400 mt-2 px-6">Your transaction was declined. Don't worry, your money is safe if deducted.</p>
              </div>
              <Card className="bg-zinc-950 border-red-500/20 rounded-[2rem] overflow-hidden mb-6">
                <CardContent className="p-8 space-y-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">This usually happens due to bank timeouts. Your seat lock will be held for the next 5 minutes.</p>
                  <Button onClick={() => navigate("/booking")} className="w-full h-14 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    Retry Payment Now
                  </Button>
                </CardContent>
              </Card>
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                <ArrowLeft className="h-4 w-4" /> Cancel and return home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;