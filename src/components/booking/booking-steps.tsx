import React, { useContext, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  useJsApiLoader,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  User,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

import api from "@/services/api";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GOOGLEMAPSAPIKEY = import.meta.env.VITE_GOOGLEMAPSAPIKEY as string;

interface BookingStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface SeatAvailability {
  seatNumber: string;
  status: "available" | "booked" | "locked" | "blocked";
  price: number;
  seatType: string;
  lockedBy?: string;
}

interface CabWithAvailability {
  id: string;
  routeCode: string;
  name: string;
  capacity: number;
  price: number;
  image: string;
  available: boolean;
  route: string;
  seatsAvailable: SeatAvailability[];
}

interface Passenger {
  name: string;
  age: number | "";
  gender: string;
  seatNumber: string;
  fare: number;
  pickupAddress?: string;
  dropAddress?: string;
}

interface PickupPoint {
  name: string;
  address: string;
}

interface DropPoint {
  name: string;
  address: string;
}

const BOOKING_STEPS: BookingStep[] = [
  {
    id: 1,
    title: "Select Date",
    icon: <CalendarIcon className="h-4 w-4" />,
    completed: false,
  },
  {
    id: 2,
    title: "Choose Cab Time",
    icon: <Clock className="h-4 w-4" />,
    completed: false,
  },
  {
    id: 3,
    title: "Select Seat",
    icon: <MapPin className="h-4 w-4" />,
    completed: false,
  },
  {
    id: 4,
    title: "Passenger Details",
    icon: <User className="h-4 w-4" />,
    completed: false,
  },
  {
    id: 5,
    title: "Payment",
    icon: <CreditCard className="h-4 w-4" />,
    completed: false,
  },
  {
    id: 6,
    title: "Confirmation",
    icon: <CheckCircle className="h-4 w-4" />,
    completed: false,
  },
];

const TIMESLOTS_BY_ROUTE: Record<string, string[]> = {
  "AGR-GUR-001": ["6:00"],
  "GUR-AGR-001": ["22:00"],
  "GUR-AGR-003": ["22:00"]
};

export const BookingSteps: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedCab, setSelectedCab] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [availableCabs, setAvailableCabs] = useState<CabWithAvailability[]>([]);

  const { user } = useContext(AuthContext);

  const [pickupOptions, setPickupOptions] = useState<PickupPoint[]>([]);
  const [dropOptions, setDropOptions] = useState<DropPoint[]>([]);
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [dropAddress, setDropAddress] = useState<string>("");

  const pickupBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const dropBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const [timerSeconds, setTimerSeconds] = useState<number>(300);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout>();


  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  });

  const handlePickupChanged = () => {
    const places = pickupBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      setPickupAddress(places[0].formatted_address ?? "");
    }
  };

  const handleDropChanged = () => {
    const places = dropBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      setDropAddress(places[0].formatted_address ?? "");
    }
  };

  useEffect(() => {
    const fetchRoutesAndAvailability = async () => {
      try {
        const routesRes = await api.get("/routes/my-routes");
        const routes = routesRes.data.data.routes;

        const cabsWithAvailabilityPromises = routes.map(async (route: any) => {
          let seatsAvailable: SeatAvailability[] = [];
          let available = false;

          if (selectedDate) {
            if (route.id === selectedCab) {
              setPickupOptions(route.origin?.pickupPoints);
              setDropOptions(route.destination?.dropPoints);
            }

            const dateStr = format(selectedDate, "yyyy-MM-dd");

            try {
              const seatAvailRes = await api.get(
                `/routes/${route.id}/availability?travelDate=${dateStr}`
              );
              seatsAvailable = seatAvailRes.data.data.seatsAvailable;
              available = seatsAvailable.some(
                (seat: SeatAvailability) => seat.status === "available"
              );
            } catch (e) {
              seatsAvailable = [];
              available = false;
            }
          }

          return {
            id: route.id,
            routeCode: route.routeCode,
            name: route?.vehicle?.type || "Cab",
            capacity: route?.vehicle?.capacity || 6,
            price: route?.pricing?.baseFare || 550,
            image: "",
            route: `${route?.origin?.city} to ${route?.destination?.city}`,
            available,
            seatsAvailable,
          } as CabWithAvailability;
        });

        const cabsWithAvailability = await Promise.all(
          cabsWithAvailabilityPromises
        );
        setAvailableCabs(cabsWithAvailability);
      } catch (error) {
        console.error("Failed to fetch route or availability data", error);
      }
    };

    fetchRoutesAndAvailability();
  }, [selectedCab, selectedDate]);

  useEffect(() => {
    if (availableCabs.length > 0 && !selectedCab) {
      const firstAvailableCab = availableCabs.find((cab) => cab.available);
      if (firstAvailableCab) {
        setSelectedCab(firstAvailableCab.id);
      }
    }
  }, [availableCabs, selectedCab]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      handleBookingTimeout();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [timerSeconds, timerActive]);

  const handleBookingTimeout = () => {
    setCurrentStep(1);
    setSelectedCab(null);
    setSelectedTime(null);
    setSelectedSeats([]);
    setPassengers([]);
    setTimerSeconds(300);
    setTimerActive(false);

    toast.error("Booking session expired! ", {
      description: "Your seat lock has been released! Please start over",
      duration: 6000,
      action: {
        label: "Book again",
        onClick: () => setCurrentStep(1)
      }
    })
  }

  const lockSeats = async () => {
    if (!selectedCab || !selectedDate || selectedSeats.length === 0) return;

    const travelDateStr = format(selectedDate, "yyyy-MM-dd");

    await api.post("/bookings/lock", {
      routeId: selectedCab,
      travelDate: travelDateStr,
      seatNumbers: selectedSeats,
    });
  };

  const createBooking = async () => {
    const payload = {
      routeId: selectedCab,
      travelDate: format(selectedDate, "yyyy-MM-dd"),
      passengers: passengers.map((p) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        seatNumber: p.seatNumber,
        fare: p.fare,
        pickupPoint: p.pickupAddress,
        dropPoint: p.dropAddress,
      })),
      paymentMethod: "card",
    };

    try {
      const data = await api.post("/bookings", payload);
      console.log("BOOKING RESPONSE", data);

      if (data?.data?.success) {

        setTimerActive(false);
        clearInterval(timerRef.current);
        setCurrentStep((prev) => prev + 1);
        toast("Booking confirmed!", {
          description: "You can check your dashboard for details"
        })
      } else {
        alert(data?.data?.message || "Booking failed, please try again.");
      }
    } catch (err) {
      alert("Error creating booking");
    }
  };

  const nextStep = async () => {
    if (currentStep === 2) {
      setTimerActive(true);
      setTimerSeconds(300);
      setCurrentStep((prev) => prev + 1);
    }
    else if (currentStep === 3) {
      try {
        await lockSeats();
        setTimerActive(true);

        const newPassengers: Passenger[] = selectedSeats.map((seatNum) => {
          const existing = passengers.find((p) => p.seatNumber === seatNum);

          if (existing) {
            return { ...existing };
          }

          const cab = availableCabs.find((c) => c.id === selectedCab);
          const seatObj = cab?.seatsAvailable.find(
            (s) => s.seatNumber === seatNum
          );

          return {
            name: "",
            age: "",
            gender: "",
            seatNumber: seatNum,
            fare:
              seatObj?.price ||
              availableCabs.find((c) => c.id === selectedCab)?.price ||
              550,
            pickupAddress,
            dropAddress,
          };
        });

        setPassengers(newPassengers);
        setCurrentStep((prev) => prev + 1);
      } catch (err: any) {
        // alert(
        //   err?.response?.data?.message ||
        //   "Failed to lock seats. Please try again or select different seats."
        // );
        toast.error("Failed to lock seats", {
          description: err?.response?.data?.message || "Please try again or select different seats.",
        });
      }
    } else if (currentStep === 5) {
      try {
        await createBooking();
      } catch (err) {
        console.error(err);
      }
    } else if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const selectedCabObj = availableCabs.find((cab) => cab.id === selectedCab);

  const dynamicTimeSlots = selectedCabObj
    ? TIMESLOTS_BY_ROUTE[selectedCabObj.routeCode]
    : [];

  const renderSeatLayout = () => {
    if (!selectedCab) return null;

    const cab = availableCabs.find((c) => c.id === selectedCab);

    if (!cab) return null;

    const seats = cab.seatsAvailable;

    const seatByNum: Record<string, SeatAvailability | undefined> = {};
    seats.forEach((seat) => {
      seatByNum[seat.seatNumber] = seat;
    });

    const layoutRows: (string | null)[][] = [
      ["A1", null, "Driver"],
      ["B1", "B2", "B3"],
      ["C1", null, "C2"],
    ];

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black px-8 py-6 shadow-lg shadow-black/40 w-full max-w-md">
          <div className="text-xs text-white/50 mb-4 uppercase tracking-[0.2em]">
            {cab.route} · {cab.capacity} seats
          </div>

          <div className="flex flex-col gap-4 items-center">
            <div className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
              Front
            </div>

            {/* Front Row */}
            <div className="flex flex-row gap-4 justify-center">
              {layoutRows[0].map((seatNum, idx) =>
                seatNum === "Driver" ? (
                  <div
                    key={seatNum}
                    className="min-w-[52px] min-h-[42px] rounded-lg border border-white/15 bg-white/5 text-[11px] flex items-center justify-center text-white/70"
                  >
                    Driver
                  </div>
                ) : seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                  />
                ) : (
                  <div key={idx} className="min-w-[52px] min-h-[42px]" />
                )
              )}
            </div>

            {/* Middle row */}
            <div className="flex flex-row gap-4 justify-center">
              {layoutRows[1].map((seatNum, idx) =>
                seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                  />
                ) : (
                  <div key={idx} className="min-w-[52px] min-h-[42px]" />
                )
              )}
            </div>

            {/* Last row */}
            <div className="flex flex-row gap-4 justify-center">
              {layoutRows[2].map((seatNum, idx) =>
                seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                  />
                ) : (
                  <div key={idx} className="min-w-[52px] min-h-[42px]" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-[11px] text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-white/20 bg-white/10" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-emerald-400/80 bg-emerald-500/30" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-amber-500/80 bg-amber-500/30" />
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-red-500/80 bg-red-500/30" />
            <span>Booked</span>
          </div>
        </div>
      </div>
    );
  };

  const SeatButton: React.FC<{
    seatNum: string;
    seatObj?: SeatAvailability;
  }> = ({ seatNum, seatObj }) => {
    if (!seatObj) {
      return <div className="min-w-[52px] min-h-[42px]" />;
    }

    const isBooked = seatObj.status === "booked";
    const isSelected = selectedSeats.includes(seatNum);
    const isLocked =
      seatObj.status === "locked" &&
      seatObj.lockedBy &&
      seatObj.lockedBy !== user?.id;

    return (
      <button
        type="button"
        className={[
          "min-w-[52px] min-h-[42px] rounded-lg border-2 text-xs font-semibold flex items-center justify-center transition-all shadow-sm",
          isBooked
            ? "border-red-500/70 bg-red-500/15 text-red-200 cursor-not-allowed"
            : isLocked
              ? "border-amber-500/70 bg-amber-500/15 text-amber-100 cursor-not-allowed"
              : isSelected
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-50 scale-[1.02] shadow-emerald-500/30"
                : "border-white/15 bg-white/5 text-white/80 hover:border-emerald-400/70 hover:bg-emerald-500/10",
        ].join(" ")}
        disabled={isBooked || isLocked}
        onClick={() => {
          if (isBooked || isLocked) return;
          setSelectedSeats((prev) =>
            prev.includes(seatNum)
              ? prev.filter((s) => s !== seatNum)
              : [...prev, seatNum]
          );
        }}
      >
        {seatNum}
      </button>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center text-white">
              Select your travel date
            </h3>
            <div className="flex justify-center">
              <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        );
                        setSelectedDate(localDate);
                      }
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    className="rounded-md border border-white/10 bg-black"
                  />
                  {selectedDate && (
                    <p className="mt-4 text-sm text-white/70">
                      Selected:{" "}
                      <span className="font-medium">
                        {format(selectedDate, "PPP")}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-center text-white">
              Choose your cab & time
            </h3>

            <div className="grid gap-4">
              {availableCabs.map((cab) => (
                <Card
                  key={cab.id}
                  className={[
                    "cursor-pointer transition-all bg-gradient-to-r from-zinc-900 to-black border",
                    selectedCab === cab.id
                      ? "border-emerald-400/70 shadow-lg shadow-emerald-500/20 scale-[1.01]"
                      : "border-white/10 hover:border-emerald-300/50 hover:-translate-y-[2px]",
                    !cab.available ? "opacity-60" : "",
                  ].join(" ")}
                  onClick={() => cab.available && setSelectedCab(cab.id)}
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 text-xl font-semibold">
                        {cab.image || cab.name[0]}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white">{cab.name}</h4>
                        <p className="text-xs sm:text-sm text-white/60">
                          {cab.route}
                        </p>
                        <p className="text-xs text-white/50">
                          {cab.capacity} seats • ₹{cab.price}/trip
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={cab.available ? "default" : "secondary"}
                        className={
                          cab.available
                            ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/50"
                            : "bg-white/10 text-white/60 border-white/20"
                        }
                      >
                        {cab.available ? "Available" : "Full"}
                      </Badge>
                      {selectedCab === cab.id && (
                        <span className="text-[11px] text-emerald-300 uppercase tracking-[0.18em]">
                          Selected
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">
                Available time slots
              </h4>
              {dynamicTimeSlots && dynamicTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {dynamicTimeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className={[
                        "w-full justify-center rounded-full text-sm",
                        selectedTime === time
                          ? "bg-emerald-500 text-black border-emerald-400"
                          : "bg-transparent text-white/80 border-white/20 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">
                  Select route to get the time slots
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center text-white">
              Select your seat
            </h3>
            {renderSeatLayout()}
          </div>
        );

      case 4:
        return (
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8">
            <h3 className="text-2xl font-semibold text-center mb-6 text-white">
              Enter Passenger Details
            </h3>

            <div className="space-y-6">
              {passengers.map((passenger, idx) => (
                <div
                  key={passenger.seatNumber}
                  className="border border-white/10 bg-white/5 rounded-xl p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">
                      Seat {passenger.seatNumber}
                    </h4>
                    <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/50">
                      ₹{passenger.fare}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={passenger.name}
                        onChange={(e) => {
                          const newPax = [...passengers];
                          newPax[idx].name = e.target.value;
                          setPassengers(newPax);
                        }}
                        className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Age
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Age"
                        value={passenger.age}
                        onChange={(e) => {
                          const newPax = [...passengers];
                          newPax[idx].age = Number(e.target.value);
                          setPassengers(newPax);
                        }}
                        className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Gender
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => {
                          const newPax = [...passengers];
                          newPax[idx].gender = e.target.value;
                          setPassengers(newPax);
                        }}
                        className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Uncomment for  dynamic address*/}
                    {/* <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Pickup Address
                      </label>
                      {isLoaded ? (
                        <StandaloneSearchBox
                          onLoad={(ref) => {
                            pickupBoxRef.current = ref;
                          }}
                          onPlacesChanged={handlePickupChanged}
                        >
                          <input
                            type="text"
                            placeholder="Pickup Address"
                            value={passenger.pickupAddress}
                            onChange={(e) => {
                              const newPax = [...passengers];
                              newPax[idx].pickupAddress = e.target.value;
                              setPassengers(newPax);
                              setPickupAddress(e.target.value);
                            }}
                            className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                          />
                        </StandaloneSearchBox>
                      ) : (
                        <input
                          type="text"
                          placeholder="Pickup Address"
                          disabled
                          className="border border-white/10 bg-zinc-900 px-3 py-2.5 rounded-lg w-full text-sm text-white/40"
                        />
                      )}
                    </div> */}
                    <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Pickup Address
                      </label>
                      <select
                        value={passenger.pickupAddress || ""}
                        onChange={(e) => {
                          const newPax = [...passengers];
                          newPax[idx].pickupAddress = e.target.value;
                          setPassengers(newPax);
                        }}
                        className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      >
                        <option value="">Select Pickup</option>
                        {pickupOptions.map((point) => (
                          <option value={point.name}>
                            {point.name} ({point.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Drop Address
                      </label>
                      <select
                        value={passenger.dropAddress || ""}
                        onChange={(e) => {
                          const newPax = [...passengers];
                          newPax[idx].dropAddress = e.target.value;
                          setPassengers(newPax);
                        }}
                        className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      >
                        <option value="">Select Drop</option>
                        {dropOptions.map((point) => (
                          <option value={point.name}>
                            {point.name} ({point.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* <div>
                      <label className="block mb-1 text-xs font-medium text-white/60">
                        Drop Address
                      </label>
                      {isLoaded ? (
                        <StandaloneSearchBox
                          onLoad={(ref) => {
                            dropBoxRef.current = ref;
                          }}
                          onPlacesChanged={handleDropChanged}
                        >
                          <input
                            type="text"
                            placeholder="Drop Address"
                            value={passenger.dropAddress}
                            onChange={(e) => {
                              const newPax = [...passengers];
                              newPax[idx].dropAddress = e.target.value;
                              setPassengers(newPax);
                              setDropAddress(e.target.value);
                            }}
                            className="border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                          />
                        </StandaloneSearchBox>
                      ) : (
                        <input
                          type="text"
                          placeholder="Drop Address"
                          disabled
                          className="border border-white/10 bg-zinc-900 px-3 py-2.5 rounded-lg w-full text-sm text-white/40"
                        />
                      )}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button
                disabled={passengers.some((p) => !p.name || !p.age || !p.gender)}
                onClick={nextStep}
                className="px-10 py-3 text-base rounded-full bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center text-white">
              Payment Details
            </h3>
            <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white max-w-xl mx-auto">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm pt-6">
                <div className="flex justify-between pb-3 border-b border-white/10">
                  <span className="text-white/60">Date</span>
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, "PPP") : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/10">
                  <span className="text-white/60">Time</span>
                  <span className="font-medium">
                    {selectedTime || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/10">
                  <span className="text-white/60">Seats</span>
                  <span className="font-medium">
                    {selectedSeats.join(", ") || "None selected"}
                  </span>
                </div>
                <div className="flex justify-between pt-3 font-semibold text-base">
                  <span>Total Fare</span>
                  <span className="text-emerald-300">
                    ₹
                    {selectedSeats.length
                      ? (selectedSeats.length * 550).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <Button
                  className="w-full mt-6 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-3"
                  onClick={() => alert("Payment flow not yet implemented")}
                >
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 text-center">
            <div className="text-7xl text-emerald-400 font-bold">✓</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">
                Booking Confirmed!
              </h3>
              <p className="text-sm text-white/60">
                Your ride has been successfully booked
              </p>
            </div>
            <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white max-w-md mx-auto">
              <CardContent className="p-6 space-y-4 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-white/60">Booking ID</span>
                  <span className="font-mono font-semibold">CB123456</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-white/60">Date</span>
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, "PPP") : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-white/60">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Seats</span>
                  <span className="font-medium">{selectedSeats.join(", ")}</span>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={() => {
                setCurrentStep(1);
                setSelectedSeats([]);
                setPassengers([]);
              }}
              className="rounded-full bg-white text-black hover:bg-zinc-100 font-semibold py-3 px-6"
            >
              Book Another Ride
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 flex flex-col gap-6"> */}
      <div>
        {timerActive && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-full text-sm font-mono">
              ⏱️ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              <span className="ml-1 text-xs">(Seat lock expires)</span>
            </div>
          </div>
        )}


        {/* Step Progress */}
        {/* <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 pb-2 scrollbar-hide">
            {BOOKING_STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 text-xs font-medium transition-all",
                        isActive
                          ? "bg-emerald-500 text-black border-emerald-300 shadow shadow-emerald-500/40 scale-110"
                          : isCompleted
                          ? "bg-white text-black border-white"
                          : "bg-black border-white/20 text-white/60",
                      ].join(" ")}
                    >
                      {isCompleted ? "✓" : step.id}
                    </div>
                    <span className="mt-1 text-[10px] sm:text-[11px] text-white/60 text-center w-12">
                      {step.title}
                    </span>
                  </div>
                  {index < BOOKING_STEPS.length - 1 && (
                    <div
                      className={[
                        "h-px mx-1 sm:mx-2 transition-colors",
                        currentStep > step.id ? "bg-emerald-400" : "bg-white/15",
                        "w-8 sm:w-12",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div> */}

        {/* Step Content */}
        <Card className="bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white flex-1">
          <CardContent className="p-5 sm:p-7">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 max-w-5xl mx-auto w-full pt-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              currentStep === 6 ||
              (currentStep === 1 && !selectedDate) ||
              (currentStep === 2 && (!selectedCab || !selectedTime)) ||
              (currentStep === 3 && selectedSeats.length === 0) ||
              (currentStep === 4 &&
                passengers.some((p) => !p.name || !p.age || !p.gender))
            }
            className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 6 ? "Complete" : "Next"}
            {currentStep < 6 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
