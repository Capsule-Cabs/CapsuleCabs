import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";

interface CabSelectionProps {
  availableCabs: any[];
  selectedCab: string | null;
  setSelectedCab: (id: string) => void;
}

export const CabSelection: React.FC<CabSelectionProps> = ({ availableCabs, selectedCab, setSelectedCab }) => {
  if (availableCabs.length === 0) {
    return (
      <Card className='p-12 text-center bg-zinc-950/60 border-white/10 rounded-2xl'>
        <Clock className='h-12 w-12 mx-auto mb-4 text-zinc-700' />
        <h4 className='text-lg font-bold text-white'>No cabs available</h4>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {availableCabs.map((cab) => {
        const selected = selectedCab === cab.id;
        return (
          <Card key={cab.id} onClick={() => cab.available && setSelectedCab(cab.id)}
            className={`relative overflow-hidden cursor-pointer bg-zinc-950/50 border border-white/10 rounded-2xl transition-all ${selected ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}`}>
            {selected && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
            <CardContent className='p-4 flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className="flex items-center gap-5">
                <div className="text-center min-w-[80px] border-r border-white/10 pr-5">
                  <span className="text-lg font-black text-white">{cab.departureTime}</span>
                  <ArrowRight className="h-3 w-3 text-emerald-500 mx-auto" />
                  <span className="text-xs text-zinc-500">{cab.arrivalTime}</span>
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{cab.routeCode}</Badge>
                  <h4 className='font-bold text-white uppercase tracking-tight'>{cab.route || `Seater ${cab.id}`}</h4>
                </div>
              </div>
              <div className="flex items-center gap-6 sm:pl-6 sm:border-l border-white/10">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Starting From</p>
                  <p className="text-xl font-black text-white">₹{cab.price || 349}<span className="text-[10px] text-zinc-500 ml-1">+GST</span></p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selected ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-white/10'}`}>
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};