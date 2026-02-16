import React from "react";
import { User, MapPin, CreditCard, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PassengerDetailsProps {
  passengers: any[];
  setPassengers: (pax: any[]) => void;
  selectedSeats: string[];
  pickupOptions: any[];
  dropOptions: any[];
  onNext: () => void;
}

export const PassengerDetails: React.FC<PassengerDetailsProps> = ({
  passengers,
  setPassengers,
  selectedSeats,
  pickupOptions,
  dropOptions,
  onNext,
}) => {
  // Logic remains exactly as your original
  const baseFare = passengers.reduce((sum, p) => sum + (p.fare || 0), 0);
  const gst = baseFare * 0.05;
  const serviceFee = 40; // Matching the logic from previous step
  const totalFare = baseFare + gst + serviceFee;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. TOP SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Seat Info */}
        <div className="md:col-span-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
            Booking Summary
          </p>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {selectedSeats.length} Seats Reserved
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
              {selectedSeats.join(", ")}
            </Badge>
          </h3>
        </div>

        {/* Right: Fare Breakdown */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Base Fare</span>
              <span className="text-white font-medium">₹{baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>GST (5%)</span>
              <span className="text-white font-medium">₹{gst.toFixed(2)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between items-end">
              <span className="text-sm font-bold text-emerald-400">Total</span>
              <span className="text-2xl font-black text-white">
                ₹{totalFare.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PASSENGER FORMS */}
      <div className="space-y-8 mt-4">
        {passengers.map((p, idx) => (
          <div
            key={p.seatNumber}
            className="group relative border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-6"
          >
            {/* Floating Seat Label */}
            <div className="absolute -top-3 left-6 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                Seat {p.seatNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Name Input */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Enter passenger name"
                    value={p.name}
                    onChange={(e) => {
                      const newPax = [...passengers];
                      newPax[idx].name = e.target.value;
                      setPassengers(newPax);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div>
                <label className="block mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Age & Gender
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Age"
                    value={p.age || ""}
                    onChange={(e) => {
                      const newPax = [...passengers];
                      newPax[idx].age = Number(e.target.value);
                      setPassengers(newPax);
                    }}
                    className="w-16 py-3 bg-black/40 border border-white/10 rounded-xl text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <select
                    value={p.gender}
                    onChange={(e) => {
                      const newPax = [...passengers];
                      newPax[idx].gender = e.target.value;
                      setPassengers(newPax);
                    }}
                    className="flex-1 px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none"
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Pickup & Drop Selection (Your original logic) */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Pickup Point
                  </label>
                  <select
                    value={p.pickupAddress || ""}
                    onChange={(e) => {
                      const newPax = [...passengers];
                      newPax[idx].pickupAddress = e.target.value;
                      setPassengers(newPax);
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="">Select Pickup</option>
                    {pickupOptions.map((point) => (
                      <option key={point.name} value={point.name}>
                        {point.name} ({point.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Drop Point
                  </label>
                  <select
                    value={p.dropAddress || ""}
                    onChange={(e) => {
                      const newPax = [...passengers];
                      newPax[idx].dropAddress = e.target.value;
                      setPassengers(newPax);
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="">Select Drop</option>
                    {dropOptions.map((point) => (
                      <option key={point.name} value={point.name}>
                        {point.name} ({point.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};