import { Navigation } from "@/components/ui/navigation";
import { BookingSteps } from "@/components/booking/booking-steps";

const Booking = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* <div className="mb-8">
            <h1 className="text-2xl sm:text-2xl font-semibold text-white mb-2">
              Complete your booking
            </h1>
          </div> */}

          {/* Booking Steps Component */}
          <BookingSteps />
        </div>
      </main>

      {/* Footer Info */}
      <div className="border-t border-white/10 bg-black/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-white/50 uppercase text-xs tracking-[0.15em]">
                Quick & Easy
              </p>
              <p className="text-white/70">
                Book your ride in under 5 minutes
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/50 uppercase text-xs tracking-[0.15em]">
                Secure Payment
              </p>
              <p className="text-white/70">
                Safe and encrypted transactions
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/50 uppercase text-xs tracking-[0.15em]">
                Live Tracking
              </p>
              <p className="text-white/70">
                Track your ride in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
