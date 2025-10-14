import { useEffect, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, CreditCard, X } from "lucide-react";
import api from "@/services/api";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/mine");
      setBookings(res.data.data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await api.put(`/bookings/${bookingId}/cancel`, {
        reason: "user-request",
      });
      toast.success("Booking cancelled successfully");
      await fetchBookings();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to cancel booking. Please try again."
      );
    }
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      booking.journey &&
      new Date(booking.journey.travelDate).getTime() >= today
  );
  const pastBookings = bookings.filter(
    (booking) =>
      booking.status === "completed" &&
      booking.journey &&
      new Date(booking.journey.travelDate).getTime() < today
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your bookings and view your travel history
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="history">Trip History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Upcoming Trips</h2>
              <Badge variant="secondary">
                {upcomingBookings.length} booking{upcomingBookings.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You don't have any trips scheduled. Ready to book your next ride?
                  </p>
                  <Button>Book a Ride</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.bookingId} className="transition-smooth hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Booking #{booking.bookingId}
                        </CardTitle>
                        <Badge variant="default">Confirmed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.journey
                              ? new Date(booking.journey.travelDate).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.journey?.departureTime || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Seats{" "}
                            {booking.passengers
                              ?.map((p: any) => p.seatNumber)
                              .join(", ") || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            ₹{booking.payment?.totalAmount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">
                          {booking.route?.operatorName || booking.route?.vehicleNumber || "-"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelBooking(booking.bookingId)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel Booking
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Trip History</h2>
              <Badge variant="secondary">
                {pastBookings.length} completed trip{pastBookings.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed trips</h3>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((trip) => (
                  <Card key={trip.bookingId} className="transition-smooth hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Trip #{trip.bookingId}
                        </CardTitle>
                        <Badge variant="outline" className="text-success border-success">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {trip.journey
                              ? new Date(trip.journey.travelDate).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {trip.journey?.departureTime || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Seats{" "}
                            {trip.passengers
                              ?.map((p: any) => p.seatNumber)
                              .join(", ") || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            ₹{trip.payment?.totalAmount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <span className="text-sm font-medium">
                          {trip.route?.operatorName || trip.route?.vehicleNumber || "-"}
                        </span>
                        <Button variant="outline" size="sm">
                          View Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
