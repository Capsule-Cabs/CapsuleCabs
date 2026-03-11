// Booking.tsx
import {Navigation} from "@/components/ui/navigation";
import { BookingSteps } from "@/components/booking/booking-steps";

const Booking = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Central responsive container */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <BookingSteps />
        </div>
      </main>
    </div>
  );
};

export default Booking;
