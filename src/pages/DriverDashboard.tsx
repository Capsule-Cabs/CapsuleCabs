import React, { useEffect, useState, useContext } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  Loader2,
  Bus,
  User as UserIcon,
  ChevronRight,
  X,
} from "lucide-react";

import { Navigation } from "@/components/ui/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";

interface PassengerDetail {
  name: string;
  age: number;
  gender: string;
  pickupPoint: string;
  dropPoint: string;
  fare: number;
}

interface DriverBooking {
  id: string;
  routeCode: string;
  travelDate: string;
  departureTime: string;
  estimatedArrivalTime: string;
  totalPassengers: number;
  totalRevenue: number;
  seatNumbers: string[];
  allBookingIds: string[];
  passengerDetails: PassengerDetail[];
}

const DriverDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<DriverBooking | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // TODO: Replace with your actual API call
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/driver/bookings/today');
        setBookings(res.data.bookings);
      } catch (err) {
        console.error("Failed to load driver bookings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const totalTodayPassengers =
    bookings.reduce((sum, b) => sum + (b.totalPassengers || 0), 0) || 0;
  const totalTodayRevenue =
    bookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-emerald-400/80 tracking-[0.2em] uppercase">
                Driver Dashboard
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
                {user?.firstName
                  ? `Hi ${user.firstName}, here's your day.`
                  : "Hi Driver, here's your day."}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                All bookings assigned to your routes. Click a booking for ride
                details.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/10 border border-white/15 text-[11px] text-white/70 rounded-full px-3 py-1">
                Live · Route assignments
              </Badge>
            </div>
          </header>

          {/* Summary cards */}
          <section className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">Today&apos;s trips</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {bookings.length}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Bus className="h-5 w-5 text-emerald-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">Total passengers</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {totalTodayPassengers}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">Total revenue</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    ₹{totalTodayRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-emerald-300" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Bookings list */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Your Assignments
                <span className="text-xs font-normal text-white/50">
                  {bookings.length > 0
                    ? `${bookings.length} today`
                    : "No assignments"}
                </span>
              </h2>
            </div>

            {loading ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  <p className="text-sm text-white/70">Loading your bookings...</p>
                </CardContent>
              </Card>
            ) : bookings.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      No bookings assigned yet
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      New bookings will appear here as passengers book your
                      route.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="bg-gradient-to-r from-zinc-950 to-black border-white/10 hover:border-emerald-400/60 hover:-translate-y-[1px] transition-all cursor-pointer group"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center mt-0.5">
                          <Bus className="h-5 w-5 text-emerald-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-white">
                              Route {booking.routeCode}
                            </p>
                            <Badge className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-[11px] rounded-full px-2 py-0.5">
                              {booking.totalPassengers} passengers
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white/60">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(booking.travelDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {booking.departureTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.seatNumbers.length} seats
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              ₹{booking.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/60 transition-all"
                      >
                        View details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10">
              <CardTitle className="text-xl">Booking Details</CardTitle>
              <button
                onClick={() => setSelectedBooking(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Route & Time Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                  Trip Overview
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/60">Route Code</p>
                    <p className="mt-1 font-semibold">{selectedBooking.routeCode}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/60">Date</p>
                    <p className="mt-1 font-semibold">
                      {new Date(selectedBooking.travelDate).toLocaleDateString(
                        "en-IN",
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/60">Departure</p>
                    <p className="mt-1 font-semibold">
                      {selectedBooking.departureTime}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/60">Estimated Arrival</p>
                    <p className="mt-1 font-semibold">
                      {selectedBooking.estimatedArrivalTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                  Booking Summary
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 p-3">
                    <p className="text-xs text-white/60">Total Passengers</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      {selectedBooking.totalPassengers}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 p-3">
                    <p className="text-xs text-white/60">Booked Seats</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      {selectedBooking.seatNumbers.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 p-3">
                    <p className="text-xs text-white/60">Total Revenue</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      ₹{selectedBooking.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seat Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                  Seat Information
                </h3>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.seatNumbers.map((seat) => (
                      <Badge
                        key={seat}
                        className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
                      >
                        Seat {seat}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-white/60 mt-3">
                    Booking IDs: {selectedBooking.allBookingIds.length} booking
                    {selectedBooking.allBookingIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Passengers List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                  Passengers ({selectedBooking.passengerDetails.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedBooking.passengerDetails.map((pax, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-emerald-300" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{pax.name}</p>
                            <p className="text-xs text-white/60">
                              {pax.gender.charAt(0).toUpperCase() +
                                pax.gender.slice(1)}
                              , {pax.age} yrs
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm">
                          ₹{pax.fare.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-white/60">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">Pickup: {pax.pickupPoint}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/60">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">Drop: {pax.dropPoint}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setSelectedBooking(null)}
                className="w-full rounded-full bg-white text-black hover:bg-zinc-100 font-semibold py-2.5"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
