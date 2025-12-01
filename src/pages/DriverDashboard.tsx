import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {Navigation} from "@/components/ui/navigation";
import api from "../services/api";

const DriverDashboard = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings assigned to this driver
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/driver/bookings/today');
        setBookings(res.data.bookings); // Structure: booking.route, booking.passengers[]
      } catch (err) {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="bg-background min-h-screen">
      <Navigation />
      <main className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-4">Driver Dashboard</h1>
        <p className="text-lg text-muted-foreground mb-10">
          All bookings assigned to your routes. Click a booking for ride details.
        </p>
        {loading ? (
          <div className="text-center py-12">
            <span className="text-xl">Loading your bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-blue-50 rounded-lg shadow-sm">
            <h3 className="text-2xl font-semibold text-blue-700 mb-2">No bookings assigned yet</h3>
            <p className="text-muted-foreground">New bookings will appear here as passengers book your route.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => (
              <Card key={`${booking.routeId}_${booking.departureTime}_${index}`} className="shadow-lg hover:shadow-xl transition">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Trip #{index + 1}</Badge>
                    <div className="text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      {booking.totalPassengers} Passengers
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{booking.origin} → {booking.destination}</CardTitle>
                  <div className="text-md text-blue-500 font-medium mt-1">
                    {booking.vehicleNumber} • {booking.operatorName}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <span><strong>Route Code:</strong> {booking.routeCode}</span>
                    <span><strong>Date:</strong> {new Date(booking.travelDate).toLocaleDateString()}</span>
                    <span><strong>Time:</strong> {booking.departureTime} - {booking.estimatedArrivalTime}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Passengers</p>
                      <p className="text-2xl font-bold text-blue-700">{booking.totalPassengers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-700">₹{booking.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booked Seats</p>
                      <p className="text-2xl font-bold text-purple-700">{booking.seatNumbers.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booking IDs</p>
                      <p className="text-sm font-semibold text-gray-700 max-w-xs truncate">{booking.allBookingIds.length} booking{booking.allBookingIds.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Booking Status Summary</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(booking.bookingStatuses).map(([status, count]) => (
                        <Badge key={status} className={`px-3 py-1 ${
                          status === "confirmed" ? "bg-green-100 text-green-700" :
                          status === "cancelled" ? "bg-red-100 text-red-700" :
                          status === "in-transit" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {status}: {String(count)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Passengers ({booking.passengerDetails.length})</h3>
                    <div className="divide-y divide-blue-100 border border-blue-100 rounded-lg overflow-hidden">
                      {booking.passengerDetails.length === 0 ? (
                        <div className="p-4 text-muted-foreground">No passengers in this trip.</div>
                      ) : (
                        booking.passengerDetails.map((pax, idx) => (
                          <div key={`${pax.seatNumber}_${idx}`} className="p-4 hover:bg-blue-50 transition">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-blue-600 text-white text-sm">Seat {pax.seatNumber}</Badge>
                                <div>
                                  <p className="font-semibold">{pax.name}</p>
                                  <p className="text-sm text-muted-foreground">{pax.gender.charAt(0).toUpperCase() + pax.gender.slice(1)}, {pax.age} yrs</p>
                                </div>
                              </div>
                              <div className="flex flex-col md:flex-row gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Pickup</p>
                                  <p className="font-medium">{pax.pickupPoint}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Drop</p>
                                  <p className="font-medium">{pax.dropPoint}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fare</p>
                                  <p className="font-bold text-blue-700">₹{pax.fare.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
