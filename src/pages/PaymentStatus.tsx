import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Calendar, Armchair, IndianRupee, ArrowLeft, Home, MailCheck, ShieldCheck } from "lucide-react";
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

  // Inside PaymentStatus component
  useEffect(() => {
    const finalizeBooking = async () => {
      const pendingData = localStorage.getItem("pending_booking");

      if (!pendingData) {
        navigate('/');
        return;
      }

      const parsedData = JSON.parse(pendingData);
      const paymentGateway = parsedData?.paymentDoneBy as 'PHONEPE' | 'ZOHO';
      setTotalPaid(parsedData?.totalFare);

      // FIX 1: Access the correct payment_id property from your JSON
      const orderId = paymentGateway === 'ZOHO'
        ? parsedData?.response?.payment_id // Changed from paymentId to payment_id
        : parsedData?.merchantOrderId;

      const pollStatus = async () => {
        try {
          attempts.current += 1;

          // FIX 2: Correct the typo from 'signarture' to 'signature'
          // FIX 3: Use paymentSessionId correctly
          const response = await verifyPaymentDetails(
            orderId,
            paymentGateway,
            {
              payments_session_id: parsedData?.paymentSessionId,
              signature: parsedData?.response?.signature // Fixed spelling
            }
          );

          const paymentData = response?.data;

          // Normalize status check: Zoho usually returns 'succeeded', PhonePe 'COMPLETED'
          const isSuccess = paymentGateway === 'ZOHO'
            ? paymentData?.status === 'succeeded'
            : paymentData?.state === 'COMPLETED';

          const bookingId = paymentData?.bookingId;

          if (isSuccess && bookingId) {
            stopPolling();
            setBookingDetails({ ...parsedData, bookingId });
            console.log('Booking details: ', bookingDetails);
            setStatus("success");
            localStorage.removeItem("pending_booking");
            localStorage.removeItem("paymentDoneBy"); // Cleanup
            toast.success("Booking Confirmed!");
          }
          else if (paymentData?.status === 'failed' || paymentData?.state === 'FAILED' || attempts.current >= MAX_ATTEMPTS) {
            stopPolling();
            setStatus("failed");
          }
        } catch (error) {
          console.error("Polling Error:", error);
        }
      };

      pollStatus();
      pollingRef.current = setInterval(pollStatus, 3000);
    };

    finalizeBooking();
    return () => stopPolling();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />

        <AnimatePresence mode="wait">
          {status === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-sm font-medium tracking-widest uppercase text-emerald-500/60">Verifying</p>
            </motion.div>
          ) : status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[400px]"
            >
              {/* Status Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 mb-4">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Booking Confirmed</h1>
                <p className="text-zinc-500 text-sm mt-1">Your journey is all set to go.</p>
              </div>

              {/* Minimalist Summary Card */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md">
                <div className="p-6 space-y-6">
                  {/* Route Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Booking ID</span>
                      <span className="text-sm font-mono text-zinc-300">#{bookingDetails?.bookingId?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/5" />
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Travel Date</span>
                      <span className="text-sm font-semibold">
                        {bookingDetails?.travelDate ? format(new Date(bookingDetails.travelDate), "MMM dd") : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                  {/* Route Visual */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <p className="text-sm font-medium text-zinc-300">{bookingDetails.passengers[0]?.pickupPoint}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full border border-zinc-600 bg-red-500" />
                      <p className="text-sm font-medium text-zinc-300">{bookingDetails.passengers[0]?.dropPoint}</p>
                    </div>
                  </div>
                </div>

                {/* The "Mail Info" Section */}
                <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <MailCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-400/80">
                    A digital copy of your <span className="text-emerald-400 font-bold uppercase tracking-tighter">QR Ticket</span> has been dispatched to your registered email.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-sm font-medium transition-all"
                >
                  Return Home
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 h-12 rounded-2xl bg-white text-black hover:bg-zinc-200 text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" /> Secure Pass
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[360px] w-full text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Error in booking, Sorry for the inconvience caused</h1>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                The transaction couldn't be completed. Don't worry, any deducted amount will be auto-refunded.
              </p>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => {
                    console.log('Button hit');
                    navigate("/booking")
                  }
                  }
                  className="w-full h-12 rounded-2xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Retry Booking
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full h-12 rounded-2xl bg-transparent border border-white/5 text-zinc-500 hover:text-white text-sm transition-all"
                >
                  Cancel Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentStatus;