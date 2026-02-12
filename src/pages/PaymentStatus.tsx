import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";

const PaymentStatus = () => {
//   const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [totalPaid, setTotalPaid] = useState(null);

  useEffect(() => {
    const finalizeBooking = async () => {
    //   const isSuccess = searchParams.get("status") === "success"; // Adjust key based on PhonePe callback
      const pendingData = localStorage.getItem("pending_booking");
      
      const parsedData = JSON.parse(pendingData);
      setTotalPaid(parsedData?.totalFare);

      const paymentResponse = await api.post('/payments/orderStatus', { merchantOrderId: parsedData?.merchantOrderId });
      
      const isSuccess = paymentResponse?.data?.data?.state === 'COMPLETED';
      if (!isSuccess || !pendingData) {
        setStatus("success");
        return;
      }

      try {
        // Match the payload structure from your createBooking function
        const payload = {
          routeId: parsedData.selectedCab,
          travelDate: format(new Date(parsedData.selectedDate), "yyyy-MM-dd"),
          passengers: parsedData.passengers.map((p: any) => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
            seatNumber: p.seatNumber,
            fare: p.fare,
            pickupPoint: p.pickupAddress,
            dropPoint: p.dropAddress,
          })),
          paymentMethod: "card",
        //   transactionId: searchParams.get("transactionId") // Provided by PhonePe
        };

        const response = await api.post("/bookings", payload);

        if (response?.data?.success) {
          setBookingDetails(parsedData);
          setStatus("success");
          localStorage.removeItem("pending_booking");
          toast.success("Booking Confirmed!");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Finalize Booking Error:", error);
        setStatus("failed");
      }
    };

    finalizeBooking();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-lg font-medium">Verifying Payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        
        {status === "success" ? (
          <>
            <div className="text-7xl text-emerald-400 font-bold animate-in zoom-in duration-500">✓</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">Booking Confirmed!</h3>
              <p className="text-sm text-white/60">Your ride has been successfully booked</p>
            </div>
            
            <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white text-left">
              <CardContent className="p-6 space-y-4 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-white/60">Date</span>
                  <span className="font-medium">
                    {bookingDetails?.selectedDate ? format(new Date(bookingDetails.selectedDate), "PPP") : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-white/60">Seats</span>
                  <span className="font-medium">{bookingDetails?.selectedSeats?.join(", ")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Paid</span>
                  <span className="text-emerald-400 font-bold">₹{totalPaid}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate("/")}
              className="w-full rounded-full bg-white text-black hover:bg-zinc-100 font-semibold py-6 mt-4"
            >
              Go to Home
            </Button>
          </>
        ) : (
          <>
            <div className="text-7xl text-red-500 font-bold animate-in zoom-in duration-500">
              <XCircle className="mx-auto h-20 w-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">Payment Failed</h3>
              <p className="text-sm text-white/60">We couldn't process your payment. Your seat lock may expire soon.</p>
            </div>

            <Card className="bg-gradient-to-b from-zinc-900 to-black border-red-500/20 text-white">
              <CardContent className="p-6">
                <p className="text-sm text-white/80 mb-4">Don't worry, if any amount was deducted, it will be refunded within 5-7 business days.</p>
                <Button
                  onClick={() => navigate("/booking")}
                  className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-6"
                >
                  Try Payment Again
                </Button>
              </CardContent>
            </Card>
            
            <button 
              onClick={() => navigate("/")}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Cancel and Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;