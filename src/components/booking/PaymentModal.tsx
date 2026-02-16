import React from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGateway: "PHONEPE" | "ZOHO";
  setSelectedGateway: (val: "PHONEPE" | "ZOHO") => void;
  onPay: () => void;
  totalAmount: number;
  isLoading: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, selectedGateway, setSelectedGateway, onPay, totalAmount, isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-[#5f259f] p-8 pb-14 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white italic tracking-tight">Checkout</h2>
            <p className="text-purple-200/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Secure Transaction</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 -mt-8 space-y-4 pb-8">
          <button
            onClick={() => setSelectedGateway("PHONEPE")}
            className={`w-full group flex items-center justify-between p-4 rounded-[2rem] bg-white transition-all duration-500 shadow-xl relative overflow-hidden ${
              selectedGateway === "PHONEPE" ? "ring-[3px] ring-emerald-500 ring-offset-4 ring-offset-zinc-900 scale-[1.02]" : ""
            }`}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="absolute inset-0 bg-[#5f259f] rounded-full flex items-center justify-center border-2 border-white/10">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" 
                       className="w-8 h-8 object-contain brightness-0 invert" alt="PhonePe" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-sky-500 rounded-full p-1 border-2 border-white shadow-sm">
                   <CheckCircle className="w-2 h-2 text-white" fill="currentColor" />
                </div>
              </div>
              <div className="text-left">
                <p className="font-black text-zinc-900 text-xl tracking-tight leading-none">PhonePe</p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase">100% Secured</span>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${selectedGateway === "PHONEPE" ? "border-sky-500 bg-white" : "border-zinc-200"}`}>
              {selectedGateway === "PHONEPE" && <div className="w-4 h-4 rounded-full bg-sky-500 animate-in zoom-in" />}
            </div>
          </button>

          <Button onClick={onPay} disabled={isLoading} className="w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg mt-4 shadow-2xl">
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : `PROCEED TO PAY ₹${totalAmount}`}
          </Button>
        </div>
      </div>
    </div>
  );
};