// Booking.tsx
import { Navigation } from "@/components/ui/navigation";
import { BookingSteps } from "@/components/booking/booking-steps";

const Booking = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      {/* <main className="flex-1"> */}
        <div className="mx-auto max-w-5xl">
            <BookingSteps />
        </div>
      {/* </main> */}
    </div>
  );
};

export default Booking;
