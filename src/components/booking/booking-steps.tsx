import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Capacitor } from '@capacitor/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhonePePaymentPlugin } from 'ionic-capacitor-phonepe-pg'
import { format } from 'date-fns'
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  User,
  ArrowRight,
  X,
  Loader2,
  Wind,
  Wifi,
  Usb,
  Info,
  Leaf,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
  Droplets,
  Lightbulb,
  PhoneForwarded,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

import api from '@/services/api'
import { AuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import phonepe_image from '@/assets/phonepe_image.png'
import fetchRoutes from '@/services/bookingFunctions'
import verifyPaymentDetails from '@/services/paymentFunctions'
import { LoadingSplash } from '../ui/splashScreen'

declare global {
  interface Window {
    ZPayments: any;
  }
}

// const GOOGLEMAPSAPIKEY = import.meta.env.VITE_GOOGLEMAPSAPIKEY as string;

interface BookingStep {
  id: number
  title: string
  icon: React.ReactNode
  completed: boolean
}

interface SeatAvailability {
  seatNumber: string
  status: 'available' | 'booked' | 'locked' | 'blocked'
  price: number
  seatType: string
  lockedBy?: string
  gender?: string
}

interface CabWithAvailability {
  id: string
  routeCode: string
  name: string
  capacity: number
  price: number
  image: string
  available: boolean
  route: string
  seatsAvailable: SeatAvailability[]
  departureTime: string
  arrivalTime: string
  origin: string | any
  destination: string | any
  discount: string | any
}

interface Passenger {
  name: string
  age: number | ''
  gender: string
  seatNumber: string
  fare: number
  pickupAddress?: string
  dropAddress?: string
  email?: string
  phone?: string
}

interface PickupPoint {
  name: string
  address: string
}

interface DropPoint {
  name: string
  address: string
}

const BOOKING_STEPS: BookingStep[] = [
  {
    id: 1,
    title: 'Select Date',
    icon: <CalendarIcon className='h-4 w-4' />,
    completed: false,
  },
  {
    id: 2,
    title: 'Choose Cab Time',
    icon: <Clock className='h-4 w-4' />,
    completed: false,
  },
  {
    id: 3,
    title: 'Select Seat',
    icon: <MapPin className='h-4 w-4' />,
    completed: false,
  },
  {
    id: 4,
    title: 'Passenger Details',
    icon: <User className='h-4 w-4' />,
    completed: false,
  },
  {
    id: 5,
    title: 'Payment',
    icon: <CreditCard className='h-4 w-4' />,
    completed: false,
  },
  {
    id: 6,
    title: 'Confirmation',
    icon: <CheckCircle className='h-4 w-4' />,
    completed: false,
  },
]

const TIMESLOTS_BY_ROUTE: Record<string, string[]> = {
  'AGR-GUR-001': ['6:00'],
  'GUR-AGR-001': ['22:00'],
  'GUR-AGR-003': ['22:00'],
}

export const BookingSteps: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const preFilledData = location.state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(preFilledData ? 2 : 1)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    preFilledData?.date ? new Date(preFilledData.date) : undefined,
  )
  const [selectedCab, setSelectedCab] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [availableCabs, setAvailableCabs] = useState<CabWithAvailability[]>([])

  const { user, isAuthenticated, sendOtp, verifyOtp } = useContext(AuthContext)

  const [pickupOptions, setPickupOptions] = useState<PickupPoint[]>([])
  const [dropOptions, setDropOptions] = useState<DropPoint[]>([])
  const [pickupAddress, setPickupAddress] = useState<string>('')
  const [dropAddress, setDropAddress] = useState<string>('')
  const [globalPickup, setGlobalPickup] = useState('')
  const [globalDrop, setGlobalDrop] = useState('')

  const pickupBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const dropBoxRef = useRef<google.maps.places.SearchBox | null>(null)

  const [timerSeconds, setTimerSeconds] = useState<number>(300)
  const [timerActive, setTimerActive] = useState<boolean>(false)

  const [selectedSource, setSelectedSource] = useState<string>(
    preFilledData?.from || '',
  )
  const [selectedDestination, setSelectedDestination] = useState<string>(
    preFilledData?.to || '',
  )

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE')
  const [loginPhone, setLoginPhone] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<
    'PHONEPE' | 'ZOHO' | null
  >(null)

  const [totalFare, setTotalFare] = useState<number>(0)
  const [fareBreakdown, setFareBreakdown] = useState({
    baseFare: 0,
    gst: 0,
    convenienceFee: 0,
    discount: 0,
  })
  const [viewingRoute, setViewingRoute] = useState<any>(null)

  const timerRef = useRef<NodeJS.Timeout>()

  // If the user is coming after selecting source and destination
  useEffect(() => {
    if (preFilledData && currentStep === 2) {
      // Manually trigger the route fetching logic you have for Step 1
      // Example: handleSearchRoutes(preFilledData.from, preFilledData.to, preFilledData.date);
      fetchRoutesAndAvailability()
      console.log('Pre-filled data detected, skipping to cab selection...')
    }
  }, [preFilledData])

  useEffect(() => {
    if (currentStep === 4 && passengers.length > 0) {
      const baseFare = passengers.reduce((sum, p) => sum + p.fare, 0);
      // Find the current selected cab to get its specific discount
      const selectedCabData = availableCabs.find((c) => c.id === selectedCab);
      const dynamicDiscountPerSeat = selectedCabData?.discount || 0;
      setTotalFareSafely({
        baseFare,
        convenienceFee: 12,
        discount: dynamicDiscountPerSeat * passengers.length,
        gst: (baseFare - (dynamicDiscountPerSeat * passengers.length) + 12) * 0.05
      })
    }
  }, [currentStep, passengers, selectedCab, availableCabs])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const generateStrongOrderId = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)

    const micro = performance.now().toString(36).replace('.', '')

    return (timestamp + random + micro).toUpperCase().slice(0, 14)
  }

  const fetchRoutesAndAvailability = async () => {
    setIsLoading(true); // Start loading
    const minimumDelay = new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const [routes] = await Promise.all([
      fetchRoutes(selectedDate, selectedDestination, selectedSource),
      minimumDelay 
    ]);

      const cabsWithAvailabilityPromises = routes.map(async (route: any) => {
        let seatsAvailable: SeatAvailability[] = []
        let available = false

        if (selectedDate) {
          setPickupOptions(route.origin?.pickupPoints)
          setDropOptions(route.destination?.dropPoints)

          const dateStr = format(selectedDate, 'yyyy-MM-dd')

          try {
            const seatAvailRes = await api.get(
              `/routes/${route._id}/availability?travelDate=${dateStr}`,
            )
            // Based on your previous snippet, seatAvailRes.data.data.seatsAvailable contains the info
            seatsAvailable = seatAvailRes.data.data.seatsAvailable
            available = seatsAvailable.some(
              (seat: SeatAvailability) => seat.status === 'available',
            )
          } catch (e) {
            seatsAvailable = []
            available = false
          }
        }

        const departureTime = route.schedule?.[0]?.departureTime || ''
        const arrivalTime = route.schedule?.[0]?.arrivalTime || ''

        // DYNAMIC DISCOUNT LOGIC:
        // Fetch the first object from the discounts array. 
        // Per your request, treat 'percentage' field as the flat amount to subtract.
        const firstDiscount = route.pricing?.discounts && route.pricing.discounts.length > 0
          ? route.pricing.discounts[0]
          : null;

        const discountAmount = firstDiscount ? firstDiscount.percentage : 0;

        return {
          id: route._id,
          routeCode: route.routeCode,
          name: route?.vehicle?.type || 'Cab',
          capacity: route?.vehicle?.capacity || 6,
          price: route?.pricing?.baseFare || 550,
          discount: discountAmount,
          image: '',
          route: `${route?.origin?.city} to ${route?.destination?.city}`,
          available,
          seatsAvailable,
          departureTime,
          arrivalTime,
          origin: route.origin,
          destination: route.destination,
        } as CabWithAvailability
      })

      const cabsWithAvailability = await Promise.all(
        cabsWithAvailabilityPromises,
      )
      setAvailableCabs(cabsWithAvailability)

      // Safety check for logging
      if (cabsWithAvailability.length > 0) {
        console.log('Fetched cabs with availability', cabsWithAvailability[0])
      }

    } catch (error) {
      console.error('Failed to fetch route or availability data', error)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (availableCabs.length > 0 && !selectedCab) {
      const firstAvailableCab = availableCabs.find((cab) => cab.available)
      if (firstAvailableCab) {
        setSelectedCab(firstAvailableCab.id)
        setSelectedTime(firstAvailableCab.departureTime)
      }
    }
  }, [availableCabs, selectedCab])

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0) {
      handleBookingTimeout()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerSeconds, timerActive])

  const handleBookingTimeout = () => {
    setCurrentStep(1)
    setSelectedCab(null)
    setSelectedTime(null)
    setSelectedSeats([])
    setPassengers([])
    setTimerSeconds(300)
    setTimerActive(false)

    toast.error('Booking session expired! ', {
      description: 'Your seat lock has been released! Please start over',
      duration: 6000,
      action: {
        label: 'Book again',
        onClick: () => setCurrentStep(1),
      },
    })
  }

  const lockSeats = async () => {
    if (!selectedCab || !selectedDate || selectedSeats.length === 0) return

    const travelDateStr = format(selectedDate, 'yyyy-MM-dd')

    await api.post('/bookings/lock', {
      routeId: selectedCab,
      travelDate: travelDateStr,
      seatNumbers: selectedSeats,
    })
  }

  const createBooking = async () => {
    const payload = {
      routeId: selectedCab,
      travelDate: format(selectedDate, 'yyyy-MM-dd'),
      passengers: passengers.map((p) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        seatNumber: p.seatNumber,
        fare: p.fare,
        pickupPoint: p.pickupAddress,
        dropPoint: p.dropAddress,
      })),
      paymentMethod: 'card',
    }

    try {
      const data = await api.post('/bookings', payload)
      console.log('BOOKING RESPONSE', data)

      if (data?.data?.success) {
        setTimerActive(false)
        clearInterval(timerRef.current)
        setCurrentStep((prev) => prev + 1)
        toast('Booking confirmed!', {
          description: 'You can check your dashboard for details',
        })
      } else {
        alert(data?.data?.message || 'Booking failed, please try again.')
      }
    } catch (err) {
      alert('Error creating booking')
    }
  }

  const calculateTotalFare = useCallback(
    (bd = fareBreakdown) => {
      const total = bd.baseFare + bd.gst + bd.convenienceFee - bd.discount
      // Math.max ensures it doesn't go below 0
      // toFixed(4) fixes the precision, and Number() converts it back to a float
      return Number(Math.max(0, total).toFixed(4))
    },
    [fareBreakdown],
  )

  const setTotalFareSafely = useCallback(
    (breakdown: typeof fareBreakdown) => {
      setFareBreakdown(breakdown)
      setTotalFare(calculateTotalFare(breakdown))
    },
    [calculateTotalFare],
  )

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!selectedDate || !selectedSource || !selectedDestination) {
        toast.error('Please select source, destination and date')
        return
      }
      setCurrentStep((prev) => prev + 1)
      await fetchRoutesAndAvailability()
    } else if (currentStep === 2) {
      // setTimerActive(true);
      // setTimerSeconds(300);
      setCurrentStep((prev) => prev + 1)
    } else if (currentStep === 3) {
      try {
        if (isAuthenticated) {
          await lockSeats()
        }
        // setTimerActive(true);
        let runningTotal = 0
        const newPassengers: Passenger[] = selectedSeats.map((seatNum) => {
          const existing = passengers.find((p) => p.seatNumber === seatNum)

          if (existing) {
            runningTotal += existing.fare
            return { ...existing }
          }

          const cab = availableCabs.find((c) => c.id === selectedCab)
          const seatObj = cab?.seatsAvailable.find(
            (s) => s.seatNumber === seatNum,
          )
          // const fare = seatObj?.price || cab?.price || 550;
          // runningTotal += fare; // Add this seat's fare to total

          return {
            name: '',
            age: '',
            gender: '',
            seatNumber: seatNum,
            fare:
              seatObj?.price ||
              availableCabs.find((c) => c.id === selectedCab)?.price ||
              550,
            pickupAddress,
            dropAddress,
          }
        })
        console.log('New Passengers: ', newPassengers)
        // setTotalFare(runningTotal);
        setPassengers(newPassengers)

        // 2. Log the local variable, not the state variable
        // console.log('Calculated Total Fare:', runningTotal)
        setCurrentStep((prev) => prev + 1)
      } catch (err: any) {
        // alert(
        //   err?.response?.data?.message ||
        //   "Failed to lock seats. Please try again or select different seats."
        // );
        toast.error('Failed to lock seats', {
          description:
            err?.response?.data?.message ||
            'Please try again or select different seats.',
        })
      }
    } else if (currentStep === 5) {
      try {
        if (!isAuthenticated) {
          setShowLoginModal(true)
          return
        }
        try {
          await createBooking()
        } catch (err) {
          console.error(err)
        }
      } catch (err) {
        console.error(err)
      }
    } else if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const getBookingPayload = () => {
    return {
      routeId: selectedCab,
      travelDate: format(selectedDate!, 'yyyy-MM-dd'),
      email: passengers[0]?.email || '',
      phone: passengers[0]?.phone || '',
      passengers: passengers.map((p) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        seatNumber: p.seatNumber,
        fare: p.fare,
        pickupPoint: p.pickupAddress,
        dropPoint: p.dropAddress,
      })),
      paymentMethod: 'upi',
    }
  }

  const initiatePaymentFlow = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSelection = async () => {
    const platform = Capacitor.getPlatform()
    if (platform === 'web') {
      makePayment()
    } else {
      startMobilePayment()
    }
  }

  const startMobilePayment = async () => {
    const totalAmount = totalFare
    const merchantOrderId = generateStrongOrderId()
    const bookingPayload = getBookingPayload()
    const apiRes = await api.post('/phonePePayments/createOrderForSdk', {
      amount: totalAmount,
      merchantOrderId,
      phone: user?.phone,
      bookingPayload,
    })
    const { request } = apiRes.data.data
    const decodedRequest = JSON.parse(atob(request))
    console.log('SDK RESPONSE: ', request)
    localStorage.setItem(
      'pending_booking',
      JSON.stringify({
        ...bookingPayload,
        merchantOrderId,
        totalFare,
        paymentDoneBy: 'PHONEPE',
      }),
    )
    try {
      const txnResult = await PhonePePaymentPlugin.startTransaction({
        request: decodedRequest,
        appSchema: 'com.capsulecabs.app',
        showLoaderFlag: true,
      })

      if (txnResult.status === 'SUCCESS') {
        // const paymentResponse = await verifyPaymentDetails(merchantOrderId);
        navigate('/booking-status')
        toast.success('Payment was successfull.')
      } else {
        toast.error('Payment was not successfull.')
      }
    } catch (error) {
      console.log('SDK Error: ', error)
    }
  }

  const generateStrongInvoiceNumber = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const micro = performance.now().toString(36).replace('.', '')

    return `INV-${(timestamp + random + micro).toUpperCase().slice(0, 12)}`
  }
  const zohoPayment = async () => {
    const bookingPayload = getBookingPayload();
    const paymentSessionRes = await api.post('/zohoPayments/create-payment-session', {
      "amount": totalFare.toFixed(2),
      "currency": "INR",
      "expires_in": 900,
      "meta_data": [
        {
          "key": "Mobile Number",
          "value": passengers[0]?.phone || ''
        }
      ],
      "description": `Payment for booking capsule cab by ${passengers[0]?.name || 'customer'}`,
      "invoice_number": "INV-" + generateStrongInvoiceNumber(),
      "reference_number": `REF-${passengers[0]?.phone || 'unknown'}`,
      bookingPayload
    });

    console.log('Payment session zoho: ', paymentSessionRes);
    const config = {
      account_id: '60065063065',
      domain: "IN",
      otherOptions: {
        api_key: "1003.1f9df5a5a293189dbca91067c0d8eb02.a83c0f4fe721f25ebedfcc27545ccfe9",
        is_test_mode: "true"
      }
    };

    const instance = new window.ZPayments(config);
    const options = {
      amount: totalFare.toFixed(2).toString(),
      currency_code: "INR",
      payments_session_id: paymentSessionRes?.data?.payments_session?.payments_session_id,
      description: `Booking for ${selectedCab} on ${format(selectedDate!, 'dd MMM yyyy')}`,
      business: "Capsule Cabs",
      address: {
        name: passengers[0]?.name || "",
        email: passengers[0]?.email || "",
        phone: passengers[0]?.phone || ""
      }
    };

    console.log('OPTIONS: ', options);

    try {
      const response: any = await instance.requestPaymentMethod(options);
      console.log('Zoho Payment Response:', response);

      localStorage.setItem(
        'pending_booking',
        JSON.stringify({
          ...bookingPayload,
          paymentSessionId: options?.payments_session_id || '',
          totalFare,
          response,
          paymentDoneBy: 'ZOHO',
        }),
      );

      if (response.payment_id) {
        console.log('Payment successful with Zoho, payment ID:', response.payment_id);
        window.location.href = '/booking-status';
      }

    } catch (error) {
      if (error.code !== 'Widget_closed') {
        console.log('Zoho Payment Error:', error);
      }
    } finally {
      await instance.close();
    }
  }

  const phonePePayments = async () => {
    const totalAmount = totalFare
    const merchantOrderId = generateStrongOrderId();

    const bookingPayload = getBookingPayload();
    const response = await api.post('/phonePePayments/createOrder', {
      amount: totalAmount,
      merchantOrderId,
      phone: user?.phone,
      bookingPayload,
    });

    localStorage.setItem(
      'pending_booking',
      JSON.stringify({
        ...bookingPayload,
        merchantOrderId,
        totalFare,
        paymentDoneBy: 'PHONEPE',
      }),
    )

    if (response?.data?.data?.redirectUrl) {
      window.location.href = response?.data?.data?.redirectUrl
    } else {
      throw new Error('Payment URL not received')
    }
  }

  const makePayment = async () => {
    setIsAuthLoading(true)
    setShowPaymentModal(false)
    try {
      if (selectedGateway === 'ZOHO') {
        await zohoPayment();
        return;
      } else { // PHONEPE
        await phonePePayments();
      }
    } catch (error: any) {
      console.log('Payment initation failed', error)
      toast.error('Payment failed to initialize', {
        description: error.message || 'Please try again.',
      })
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleAuthCheck = async () => {
    if (isAuthenticated) {
      setTimerActive(true)
      setTimerSeconds(300)
      initiatePaymentFlow()
      // createBooking();
    } else {
      setShowLoginModal(true)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setIsAuthLoading(true)
    try {
      await sendOtp(loginPhone)
      setLoginStep('OTP')
      toast.success('OTP sent to your phone')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginOtp.length < 4) {
      toast.error('Please enter valid OTP')
      return
    }

    setIsAuthLoading(true)
    try {
      const data = await verifyOtp(loginPhone, loginOtp)
      console.log('DATA: ', data)
      if (data.success) {
        toast.success('Login successful!')
        setShowLoginModal(false)
        setLoginOtp('')
        setLoginStep('PHONE')
        await lockSeats()
        setTimerActive(true)
        setTimerSeconds(300)
      }
    } catch (error: any) {
      toast.error('Invalid OTP')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const renderLoginModal = () => {
    if (!showLoginModal) return null

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4'>
        <div className='relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl'>
          {/* Close Button */}
          <button
            onClick={() => setShowLoginModal(false)}
            className='absolute right-4 top-4 p-2 text-white/50 hover:text-white transition-colors'
          >
            <X className='h-5 w-5' />
          </button>

          <div className='p-8'>
            <h2 className='text-2xl font-bold text-white mb-2'>
              {loginStep === 'PHONE' ? 'Login to Continue' : 'Verify OTP'}
            </h2>
            <p className='text-sm text-white/50 mb-6'>
              {loginStep === 'PHONE'
                ? 'Please enter your phone number to proceed with the booking.'
                : `Enter the OTP sent to +91 ${loginPhone}`}
            </p>

            {loginStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className='space-y-4'>
                <div>
                  <label className='text-xs font-medium text-emerald-400 ml-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    placeholder='9876543210'
                    maxLength={10}
                    value={loginPhone}
                    onChange={(e) =>
                      setLoginPhone(e.target.value.replace(/\D/g, ''))
                    }
                    className='w-full mt-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all tracking-widest'
                    autoFocus
                  />
                </div>
                <Button
                  type='submit'
                  disabled={isAuthLoading || loginPhone.length < 10}
                  className='w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-6 rounded-xl'
                >
                  {isAuthLoading ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className='space-y-4'>
                <div>
                  <label className='text-xs font-medium text-emerald-400 ml-1'>
                    One Time Password
                  </label>
                  <input
                    type='text'
                    placeholder='• • • •' // 4 or 6 dots depending on your OTP length
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) =>
                      setLoginOtp(e.target.value.replace(/\D/g, ''))
                    }
                    className='w-full mt-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-center text-2xl tracking-[1em] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all'
                    autoFocus
                  />
                </div>
                <Button
                  type='submit'
                  disabled={isAuthLoading || loginOtp.length < 4}
                  className='w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-6 rounded-xl'
                >
                  {isAuthLoading ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    'Verify & Proceed'
                  )}
                </Button>
                <button
                  type='button'
                  onClick={() => setLoginStep('PHONE')}
                  className='w-full text-xs text-white/40 hover:text-white transition-colors mt-4'
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderPaymentSelectionModal = () => {
    if (!showPaymentModal) return null;

    // Dynamic Theme Mapping
    const themes = {
      ZOHO: {
        primary: 'bg-[#6739b7]', // UPI / Zoho Purple
        accent: 'ring-purple-500',
        shadow: 'shadow-purple-500/20',
        glow: 'rgba(103, 57, 183, 0.4)'
      },
      PHONEPE: {
        primary: 'bg-[#0070e0]', // Card / Blue theme
        accent: 'ring-blue-500',
        shadow: 'shadow-blue-500/20',
        glow: 'rgba(0, 112, 224, 0.4)'
      },
      default: {
        primary: 'bg-zinc-900',
        accent: 'ring-emerald-500',
        shadow: 'shadow-emerald-500/20',
        glow: 'rgba(16, 185, 129, 0.4)'
      }
    };

    const currentTheme = themes[selectedGateway] || themes.default;

    return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl p-4 transition-all duration-500'>
        <div className={`relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500`}>

          {/* Dynamic Header Branding Area */}
          <div className={`transition-colors duration-700 ${currentTheme.primary} p-8 pb-14 flex justify-between items-start relative overflow-hidden`}>
            {/* Subtle Abstract Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className='text-2xl font-black text-white tracking-tight'>
                Checkout
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                <p className='text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]'>
                  Secure Transaction
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className='relative z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-all active:scale-90'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Payment Options Container */}
          <div className='px-5 -mt-8 space-y-3 pb-8 relative z-20'>

            {/* UPI Option */}
            <button
              onClick={() => setSelectedGateway('ZOHO')}
              className={`w-full group flex items-center justify-between p-4 rounded-[1.8rem] bg-white transition-all duration-500 shadow-xl ${selectedGateway === 'ZOHO'
                ? `ring-[3px] ${currentTheme.accent} ring-offset-4 ring-offset-zinc-950 scale-[1.02]`
                : 'hover:bg-zinc-50 border border-transparent'
                }`}
            >
              <div className='flex items-center gap-4'>
                <div className='relative w-14 h-14 flex-shrink-0 flex items-center justify-center bg-zinc-100 rounded-2xl group-hover:rotate-3 transition-transform'>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-10 h-10 object-contain" />
                </div>
                <div className='text-left'>
                  <p className='font-black text-zinc-900 text-xl tracking-tight'>UPI</p>
                  <div className='flex items-center gap-2 mt-1'>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-3 grayscale opacity-70 group-hover:grayscale-0 transition-all" alt="GPay" />
                    <div className="w-[1px] h-2 bg-zinc-300" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">PhonePe & more</span>
                  </div>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedGateway === 'ZOHO' ? 'border-purple-600' : 'border-zinc-200'}`}>
                {selectedGateway === 'ZOHO' && (
                  <div className='w-3 h-3 rounded-full bg-purple-600 animate-in zoom-in duration-300' />
                )}
              </div>
            </button>

            {/* Other Payment Methods */}
            <button
              onClick={() => setSelectedGateway('PHONEPE')}
              className={`w-full group flex items-center justify-between p-4 rounded-[1.8rem] bg-white transition-all duration-500 shadow-xl ${selectedGateway === 'PHONEPE'
                ? `ring-[3px] ${currentTheme.accent} ring-offset-4 ring-offset-zinc-950 scale-[1.02]`
                : 'hover:bg-zinc-50 border border-transparent'
                }`}
            >
              <div className='flex items-center gap-4'>
                <div className='relative w-14 h-14 flex-shrink-0 flex items-center justify-center bg-zinc-100 rounded-2xl group-hover:-rotate-3 transition-transform'>
                  <CreditCard className="w-7 h-7 text-zinc-700" strokeWidth={2.5} />
                </div>
                <div className='text-left'>
                  <p className='font-black text-zinc-900 text-lg tracking-tight'>Other Methods</p>
                  <div className='flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity'>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-2" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="MC" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d1/RuPay.svg" className="h-2" alt="RuPay" />
                  </div>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedGateway === 'PHONEPE' ? 'border-blue-600' : 'border-zinc-200'}`}>
                {selectedGateway === 'PHONEPE' && (
                  <div className='w-3 h-3 rounded-full bg-blue-600 animate-in zoom-in duration-300' />
                )}
              </div>
            </button>

            {/* Proceed Button */}
            <div className="pt-2">
              <Button
                onClick={handlePaymentSelection}
                disabled={isAuthLoading || !selectedGateway}
                className={`w-full h-16 rounded-[1.5rem] transition-all duration-500 font-black text-lg shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${selectedGateway
                  ? `${currentTheme.primary} text-white ${currentTheme.shadow}`
                  : 'bg-zinc-800 text-zinc-500'
                  }`}
              >
                {isAuthLoading ? (
                  <Loader2 className='animate-spin h-6 w-6' />
                ) : (
                  <>
                    <span>PROCEED TO PAY ₹{selectedSeats.length * 550}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderSeatLayout = () => {
    if (!selectedCab) return null

    const cab = availableCabs.find((c) => c.id === selectedCab);
    const currentDiscount = cab?.discount || 0;

    if (!cab) return null

    const seats = cab.seatsAvailable

    const seatByNum: Record<string, SeatAvailability | undefined> = {}
    seats.forEach((seat) => {
      seatByNum[seat.seatNumber] = seat
    })
    console.log('seatbyNum: ', seatByNum)
    const layoutRows: (string | null)[][] = [
      ['A1', null, 'Driver'],
      ['B1', 'B2', 'B3'],
      ['C1', null, 'C2'],
    ]

    return (
      <div className='flex flex-col items-center gap-6'>
        <div className='rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black px-8 py-6 shadow-lg shadow-black/40 w-full max-w-md'>
          <div className='text-xs text-white/50 mb-4 uppercase tracking-[0.2em]'>
            {cab.route} · {cab.capacity} seats
          </div>

          <div className='flex flex-col gap-4 items-center'>
            <div className='text-[11px] text-white/40 uppercase tracking-[0.2em]'>
              Front
            </div>

            {/* Front Row */}
            <div className='flex flex-row gap-4 justify-center'>
              {layoutRows[0].map((seatNum, idx) =>
                seatNum === 'Driver' ? (
                  <div
                    key={seatNum}
                    className='min-w-[52px] min-h-[42px] rounded-lg border border-white/15 bg-white/5 text-[11px] flex items-center justify-center text-white/70'
                  >
                    Driver
                  </div>
                ) : seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                    dynamicDiscount={currentDiscount}
                  />
                ) : (
                  <div key={idx} className='min-w-[52px] min-h-[42px]' />
                ),
              )}
            </div>

            {/* Middle row */}
            <div className='flex flex-row gap-4 justify-center'>
              {layoutRows[1].map((seatNum, idx) =>
                seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                    dynamicDiscount={currentDiscount}
                  />
                ) : (
                  <div key={idx} className='min-w-[52px] min-h-[42px]' />
                ),
              )}
            </div>

            {/* Last row */}
            <div className='flex flex-row gap-4 justify-center'>
              {layoutRows[2].map((seatNum, idx) =>
                seatNum ? (
                  <SeatButton
                    key={seatNum}
                    seatNum={seatNum}
                    seatObj={seatByNum[seatNum]}
                    dynamicDiscount={currentDiscount}
                  />
                ) : (
                  <div key={idx} className='min-w-[52px] min-h-[42px]' />
                ),
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='flex justify-center gap-6 text-[11px] text-white/60'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded border border-emerald-400/80 bg-emerald-500/30' />
            <span>Selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded border border-amber-500/80 bg-amber-500/30' />
            <span>Locked</span>
          </div>
          <div className='flex items-center gap-2'>
            {/* border-rose-500 for the stroke, bg-rose-500/30 for the translucent fill */}
            <div className='w-3 h-3 rounded border border-fuchsia-500 bg-fuchsia-500/25 text-fuchsia-100' />
            <span>Women</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded border border-red-500/80 bg-red-500/30' />
            <span>Booked</span>
          </div>
        </div>
      </div>
    )
  }

  const SeatButton: React.FC<{
    seatNum: string
    seatObj?: SeatAvailability
    dynamicDiscount: number // Add this prop
  }> = ({ seatNum, seatObj, dynamicDiscount }) => { // Destructure it here
    if (!seatObj) return <div className='min-w-[52px] min-h-[42px]' />

    const isBooked = seatObj.status === 'booked'
    const isSelected = selectedSeats.includes(seatNum)
    const isLocked =
      seatObj.status === 'locked' &&
      seatObj.lockedBy &&
      seatObj.lockedBy !== user?.id

    // High-visibility Female check
    const isFemaleBooked =
      isBooked && seatObj.gender?.toLowerCase() === 'female'

    const originalPrice = seatObj.price || 0

    // Replace the hardcoded '100' with 'dynamicDiscount'
    const discountPrice = Math.max(0, originalPrice - dynamicDiscount)

    return (
      <button
        type='button'
        className={[
          'min-w-[52px] min-h-[48px] rounded-lg border-2 text-xs font-semibold flex flex-col items-center justify-center transition-all shadow-sm p-1',
          isFemaleBooked
            ? 'border-fuchsia-500 bg-fuchsia-500/25 text-fuchsia-100 cursor-not-allowed'
            : isBooked
              ? 'border-red-500/70 bg-red-500/15 text-red-200 cursor-not-allowed'
              : isLocked
                ? 'border-amber-500/70 bg-amber-500/15 text-amber-100 cursor-not-allowed'
                : isSelected
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50 scale-[1.02] shadow-emerald-500/30'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-emerald-400/70 hover:bg-emerald-500/10',
        ].join(' ')}
        disabled={isBooked || isLocked}
        onClick={() => {
          if (isBooked || isLocked) return
          setSelectedSeats((prev) =>
            prev.includes(seatNum)
              ? prev.filter((s) => s !== seatNum)
              : [...prev, seatNum],
          )
        }}
      >
        <span className='font-bold leading-tight'>{seatNum}</span>
        <span className='text-[11px] font-bold text-emerald-400 mt-1 leading-none'>
          ₹{discountPrice}
        </span>
        {originalPrice > discountPrice && ( // Only show if there actually is a discount
          <span className='text-[9px] text-white/50 font-medium mt-[1px] leading-none line-through'>
            ₹{originalPrice}
          </span>
        )}
      </button>
    )
  }

  const renderRoutePopup = () => {
    if (!viewingRoute) return null

    const cab = availableCabs.find((c) => c.id === selectedCab)
    if (!cab) return null

    // Extract points from your circuit.model structure
    // We use optional chaining (?.) so it doesn't crash if data is missing
    const pickups = cab.origin?.pickupPoints || []
    const drops = cab.destination?.dropPoints || []

    const allPoints = [
      ...pickups.map((p: any) => ({ ...p, type: 'Pickup', color: 'emerald' })),
      ...drops.map((d: any) => ({ ...d, type: 'Drop', color: 'rose' })),
    ]

    return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md'>
        <div className='bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden'>
          <div className='p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/30'>
            <h3 className='text-xl font-bold text-white'>Route Schedule</h3>
            <X
              className='text-white/40 cursor-pointer'
              onClick={() => setViewingRoute(null)}
            />
          </div>

          <div className='p-8 max-h-[60vh] overflow-y-auto'>
            {allPoints.length > 0 ? (
              <div className='relative space-y-10'>
                {/* Vertical line connecting points */}
                <div className='absolute left-[13px] top-2 bottom-2 w-[2px] bg-white/10' />

                {allPoints.map((point, idx) => (
                  <div key={idx} className='flex gap-6 relative'>
                    <div
                      className={`mt-1.5 w-7 h-7 rounded-full border-2 border-zinc-950 flex items-center justify-center z-10 bg-${point.color}-500`}
                    >
                      <MapPin className='h-3.5 w-3.5 text-black' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='text-base font-bold text-white'>
                            {point.name}
                          </p>
                          <p className='text-sm text-white/40'>
                            {point.address}
                          </p>
                        </div>
                        <div>
                          <span className='text-xs font-bold text-emerald-400'>
                            {point.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-white/40'>
                  No schedule points found for this cab.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='max-w-md mx-auto space-y-6'>
            {/* Compact Header */}
            <div className='text-center space-y-2'>
              <h3 className='text-lg font-semibold text-white tracking-tight'>
                Select Route & Date
              </h3>
              <p className='text-xs text-white/50'>
                Choose your journey details
              </p>
            </div>

            {/* Single Compact Card */}
            <Card className='bg-zinc-950/50 border-white/5 backdrop-blur-sm shadow-lg hover:shadow-emerald/10 transition-shadow'>
              <CardContent className='p-6 space-y-5'>
                {/* Source + Destination */}
                <div className='space-y-3'>
                  <div className='flex items-center gap-3 text-xs font-medium text-white/60 uppercase tracking-wider'>
                    <MapPin className='h-3 w-3' />
                    Route
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <select
                        value={selectedSource || ''}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className='w-full h-11 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all hover:border-white/20'
                      >
                        <option value=''>From</option>
                        {['Agra', 'Gurugram', 'Delhi', 'Noida'].map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={selectedDestination || ''}
                        onChange={(e) => setSelectedDestination(e.target.value)}
                        disabled={!selectedSource}
                        className='w-full h-11 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all hover:border-white/20 disabled:bg-zinc-800/50 disabled:border-zinc-700/50 disabled:text-white/40'
                      >
                        <option value=''>
                          {selectedSource ? 'To' : 'Source first'}
                        </option>
                        {['Agra', 'Gurugram', 'Delhi', 'Noida'].map((city) => (
                          <option
                            key={city}
                            value={city}
                            disabled={city === selectedSource}
                          >
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date Separator + Calendar */}
                <div className='relative'>
                  <div className='absolute -top-6 left-1/2 transform -translate-x-1/2'>
                    <div className='w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent' />
                  </div>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate(),
                        )
                        setSelectedDate(localDate)
                      }
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    className='rounded-lg border border-white/10 bg-zinc-900/70 text-white shadow-sm hover:shadow-md transition-shadow'
                    classNames={{
                      day: 'h-9 w-9 text-sm hover:bg-white/10 rounded-lg text-white',
                      day_selected:
                        '!bg-emerald-600 !text-emerald-50 font-semibold shadow-md border-2 border-emerald-700/50 rounded-lg hover:!bg-emerald-700',
                      day_today: 'ring-1 ring-emerald/40',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Minimal Selection Indicators */}
            <div className='flex items-center justify-center gap-4 text-xs text-white/40'>
              {selectedSource && selectedDestination && selectedDate && (
                <div className='flex items-center gap-1 px-2 py-1 bg-emerald/10 border border-emerald/30 rounded-lg'>
                  <span className='text-emerald/80 font-medium'>
                    {selectedSource} to {selectedDestination} on{' '}
                    {format(selectedDate, 'MMM dd')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className='w-full max-w-4xl mx-auto px-2 py-6 space-y-4'>
            <div className='text-center mb-6'>
              <h3 className='text-xl md:text-2xl font-bold text-white'>
                Select Cab & Time
              </h3>
              <p className='text-zinc-500 text-xs md:text-sm mt-1'>
                Choose your preferred schedule
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {availableCabs.length > 0 ? (
                availableCabs.map((cab) => {
                  const selected = selectedCab === cab.id;
                  const isAvailable = cab.available;
                  console.log('CAB: ', cab);
                  return (
                    <Card
                      key={cab.id}
                      className={`relative overflow-hidden transition-all duration-300 cursor-pointer bg-zinc-950/50 backdrop-blur-xl border rounded-2xl ${selected
                        ? 'ring-1 ring-emerald-500 border-emerald-500/50'
                        : 'border-white/10 hover:border-white/20'
                        } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedCab(cab.id);
                          setSelectedTime(cab.departureTime);
                        }
                      }}
                    >
                      {/* Header Section: Badge & CNG Info */}
                      <div className="bg-white/5 px-4 py-2 flex justify-between items-center border-b border-white/5">
                        <span className="text-[10px] md:text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          {cab.capacity || 6} Seater {cab.routeCode}
                        </span>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Leaf className="h-3 w-3" />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase">
                            CNG Powered: 25% Less CO₂
                          </span>
                        </div>
                      </div>

                      <CardContent className='p-4 md:p-6'>
                        {/* Desktop: Horizontal | Mobile: Vertical Stacking */}
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>

                          {/* Time & Path Section */}
                          <div className='flex items-center justify-between md:justify-start gap-4 md:gap-8'>
                            <div className='flex flex-col'>
                              <span className='text-2xl md:text-3xl font-black text-white leading-none'>
                                {cab.departureTime || '18:00'}
                              </span>
                              <span className='text-[10px] font-bold text-emerald-500 mt-1 uppercase'>Available</span>
                            </div>

                            {/* Visual Path (Dotted line with duration) */}
                            <div className='flex-1 md:flex-none flex flex-col items-center min-w-[80px]'>
                              <span className='text-[10px] text-zinc-500 font-bold mb-1'>(4h 55m)</span>
                              <div className='flex items-center w-full gap-1'>
                                <div className='h-1.5 w-1.5 rounded-full border border-emerald-500' />
                                <div className='flex-1 border-t border-dotted border-zinc-700' />
                                <div className='h-1.5 w-1.5 rounded-full border border-emerald-500' />
                              </div>
                            </div>

                            <span className='text-2xl md:text-3xl font-black text-white leading-none'>
                              {cab.arrivalTime || '22:00'}
                            </span>
                          </div>

                          {/* Divider for Mobile (matches screenshot 2) */}
                          <div className='md:hidden h-px bg-white/5 w-full my-1' />

                          {/* Price & Action Section */}
                          <div className='flex items-center justify-between md:justify-end w-full md:w-auto gap-4 md:gap-8'>
                            <div className='flex flex-col'>
                              <span className='text-[9px] text-zinc-500 font-bold uppercase'>Starting From</span>
                              <div className='flex items-baseline gap-1.5'>
                                <span className='text-zinc-500 line-through text-xs'>₹500</span>
                                <span className='text-2xl md:text-3xl font-black text-emerald-400'>₹{cab.price || 399}</span>
                                <span className='text-[10px] text-zinc-500'>+GST</span>
                              </div>
                              <div className='flex items-center gap-1 mt-1 text-emerald-500 font-bold'>
                                <Tag className='h-3 w-3' />
                                <span className='text-[9px] uppercase tracking-tight'>Welcome100 Applied</span>
                              </div>
                            </div>

                            <button
                              className={`px-6 py-3 md:py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${selected
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                }`}
                            >
                              {selected ? 'Selected' : 'Select Seat'}
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Footer: Features & Route Details */}
                        <div className='flex items-center justify-between mt-6 pt-4 border-t border-white/5'>
                          <div className='flex items-center gap-4 text-zinc-500'>
                            <div className='flex flex-col items-center gap-0.5' title='AC'>
                              <Wind className='h-4 w-4 md:h-5 md:w-5' />
                              <span className='text-[8px] uppercase font-bold'>AC</span>
                            </div>
                            <div className='flex flex-col items-center gap-0.5' title='Wifi'>
                              <Wifi className='h-4 w-4 md:h-5 md:w-5' />
                              <span className='text-[8px] uppercase font-bold'>Wifi</span>
                            </div>
                            <div className='flex flex-col items-center gap-0.5' title='USB'>
                              <Usb className='h-4 w-4 md:h-5 md:w-5' />
                              <span className='text-[8px] uppercase font-bold'>USB</span>
                            </div>
                            <div className='flex flex-col items-center gap-0.5' title='CCTV'>
                              <ShieldCheck className='h-4 w-4 md:h-5 md:w-5' />
                              <span className='text-[8px] uppercase font-bold'>CCTV</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingRoute(cab);
                            }}
                            className='text-[11px] md:text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1'
                          >
                            See Route <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-white text-center p-12 bg-zinc-950/50 rounded-2xl border border-white/5">
                  No cabs available at this time.
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className='space-y-6'>
            <h3 className='text-xl font-semibold text-center text-white'>
              Select your seat
            </h3>
            {renderSeatLayout()}
          </div>
        )

      case 4:
        return (
          <div className='max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>

              {/* LEFT COLUMN: Passenger Details & Points (8 Units wide on Desktop) */}
              <div className='lg:col-span-8 space-y-8 order-2 lg:order-1'>

                {/* Pickup & Drop Selection Group */}
                <div className='bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl'>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='h-6 w-1 bg-emerald-500 rounded-full' />
                    <h3 className='text-lg font-bold text-white'>Boarding & Dropping</h3>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className="space-y-2">
                      <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1'>
                        Pickup Point
                      </label>
                      <Select value={globalPickup || ''} onValueChange={(val) => {
                        setGlobalPickup(val);
                        setPassengers(passengers.map(p => ({ ...p, pickupAddress: val })));
                      }}>
                        <SelectTrigger className='h-12 bg-black/40 border-white/5 rounded-xl text-white'>
                          <SelectValue placeholder='Select Point' />
                        </SelectTrigger>
                        <SelectContent className='bg-zinc-900 border-white/10 text-white'>
                          {pickupOptions.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1'>
                        Drop Point
                      </label>
                      <Select value={globalDrop || ''} onValueChange={(val) => {
                        setGlobalDrop(val);
                        setPassengers(passengers.map(p => ({ ...p, dropAddress: val })));
                      }}>
                        <SelectTrigger className='h-12 bg-black/40 border-white/5 rounded-xl text-white'>
                          <SelectValue placeholder='Select Point' />
                        </SelectTrigger>
                        <SelectContent className='bg-zinc-900 border-white/10 text-white'>
                          {dropOptions.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Passenger Details List */}
                <div className='bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 lg:p-8 shadow-xl'>
                  <div className='flex items-center gap-3 mb-8'>
                    <div className='h-6 w-1 bg-emerald-500 rounded-full' />
                    <h3 className='text-lg font-bold text-white'>Passenger Details</h3>
                  </div>

                  <div className='space-y-10'>
                    {passengers.map((passenger, idx) => (
                      <div key={passenger.seatNumber} className='relative group'>
                        <div className='absolute -top-3 left-4 px-3 py-0.5 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-full z-10'>
                          Seat {passenger.seatNumber} {idx === 0 ? '• Primary' : ''}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 pb-2 border-b border-white/5 group-last:border-0'>
                          <div className='md:col-span-7'>
                            <label className='text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2'>Full Name</label>
                            <div className='relative'>
                              <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600' />
                              <input
                                type='text'
                                placeholder='Full Name'
                                value={passenger.name}
                                onChange={(e) => {
                                  const newPax = [...passengers];
                                  newPax[idx].name = e.target.value;
                                  setPassengers(newPax);
                                }}
                                className='w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none'
                              />
                            </div>
                          </div>
                          <div className='md:col-span-2'>
                            <label className='text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2'>Age</label>
                            <input
                              type='number'
                              value={passenger.age || ''}
                              onChange={(e) => {
                                const newPax = [...passengers];
                                newPax[idx].age = Number(e.target.value);
                                setPassengers(newPax);
                              }}
                              className='w-full py-3 bg-white/5 border border-white/5 rounded-xl text-center text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50'
                            />
                          </div>
                          <div className='md:col-span-3'>
                            <label className='text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2'>Gender</label>
                            <Select value={passenger.gender} onValueChange={(val) => {
                              const newPax = [...passengers];
                              newPax[idx].gender = val;
                              setPassengers(newPax);
                            }}>
                              <SelectTrigger className='h-[46px] bg-white/5 border-white/5 rounded-xl text-white'>
                                <SelectValue placeholder='Select' />
                              </SelectTrigger>
                              <SelectContent className='bg-zinc-900 border-white/10 text-white'>
                                <SelectItem value='male'>Male</SelectItem>
                                <SelectItem value='female'>Female</SelectItem>
                                <SelectItem value='other'>Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {idx === 0 && (
                            <div className='md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'>
                              <div>
                                <label className='text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2'>Contact Phone</label>
                                <input
                                  type='tel'
                                  maxLength={10}
                                  value={passenger.phone ?? ''}
                                  onChange={(e) => {
                                    const newPax = [...passengers];
                                    newPax[idx].phone = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPassengers(newPax);
                                  }}
                                  className='w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white outline-none'
                                />
                              </div>
                              <div>
                                <label className='text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2'>Contact Email</label>
                                <input
                                  type='email'
                                  value={passenger.email ?? ''}
                                  onChange={(e) => {
                                    const newPax = [...passengers];
                                    newPax[idx].email = e.target.value;
                                    setPassengers(newPax);
                                  }}
                                  className='w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white outline-none'
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Fare Breakdown (4 Units wide - STICKY) */}
              <div className='lg:col-span-4 order-1 lg:order-2'>
                <div className='lg:sticky lg:top-24 space-y-4'>

                  {/* Journey Summary */}
                  <div className='bg-zinc-900/60 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group'>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <MapPin className="h-12 w-12 text-emerald-500" />
                    </div>
                    <p className='text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3'>Route Summary</p>
                    <h4 className='text-lg font-bold text-white mb-2 leading-tight'>
                      {globalPickup || 'Origin'} <ArrowRight className="inline h-4 w-4 mx-1 text-zinc-500" /> {globalDrop || 'Destination'}
                    </h4>
                    <div className='flex flex-wrap gap-2 mt-4'>
                      <Badge variant='outline' className='bg-emerald-500/5 border-emerald-500/20 text-emerald-400'>
                        {selectedSeats.length} Seats: {selectedSeats.join(', ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Fare Details */}
                  <div className='bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative'>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                    <h3 className='text-sm font-bold text-white uppercase tracking-tighter mb-6'>Payment Details</h3>

                    <div className='space-y-4'>
                      {/* Base Fare */}
                      <div className='flex justify-between text-sm'>
                        <span className='text-zinc-500'>Base Fare ({passengers.length}x)</span>
                        <span className='text-white font-medium'>₹{fareBreakdown.baseFare}</span>
                      </div>

                      {/* Dynamic Discount */}
                      {fareBreakdown.discount > 0 && (
                        <div className='flex justify-between text-sm items-center'>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <Tag className="h-3.5 w-3.5" />
                            <span className="font-medium">Route Discount</span>
                          </div>
                          <span className='text-emerald-400 font-bold'>- ₹{fareBreakdown.discount}</span>
                        </div>
                      )}

                      {/* Separated Convenience Fee */}
                      <div className='flex justify-between text-sm'>
                        <span className='text-zinc-500'>Convenience Fee</span>
                        <span className='text-white font-medium'>₹{fareBreakdown.convenienceFee}</span>
                      </div>

                      {/* Separated GST */}
                      <div className='flex justify-between text-sm'>
                        <span className='text-zinc-500'>GST (5%)</span>
                        <span className='text-white font-medium'>₹{fareBreakdown.gst.toFixed(2)}</span>
                      </div>

                      {/* Final Total */}
                      <div className='pt-6 mt-2 border-t border-white/5 flex justify-between items-end'>
                        <div>
                          <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>Final Total</p>
                          <p className='text-3xl font-black text-white tracking-tighter'>
                            ₹{Math.round(
                              fareBreakdown.baseFare +
                              fareBreakdown.gst +
                              fareBreakdown.convenienceFee -
                              fareBreakdown.discount
                            )}
                          </p>
                        </div>
                        <div className='bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold text-emerald-500 border border-emerald-500/20 mb-1'>
                          SECURE
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      case 5:
        return (
          <div className='space-y-6'>
            <h3 className='text-xl font-semibold text-center text-white'>
              Payment Details
            </h3>
            <Card className='bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white max-w-xl mx-auto'>
              <CardHeader className='border-b border-white/10'>
                <CardTitle className='text-lg'>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm pt-6'>
                <div className='flex justify-between pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Date</span>
                  <span className='font-medium'>
                    {selectedDate
                      ? format(selectedDate, 'PPP')
                      : 'Not selected'}
                  </span>
                </div>
                <div className='flex justify-between pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Time</span>
                  <span className='font-medium'>
                    {selectedTime || 'Not selected'}
                  </span>
                </div>
                <div className='flex justify-between pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Seats</span>
                  <span className='font-medium'>
                    {selectedSeats.join(', ') || 'None selected'}
                  </span>
                </div>
                <div className='flex justify-between pt-3 font-semibold text-base'>
                  <span>Total Fare</span>
                  <span className='text-emerald-300'>₹{totalFare}</span>
                </div>
                <Button
                  className='w-full mt-6 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold py-3'
                  onClick={() => handleAuthCheck()}
                >
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case 6:
        return (
          <div className='space-y-6 text-center'>
            <div className='text-7xl text-emerald-400 font-bold'>✓</div>
            <div className='space-y-2'>
              <h3 className='text-2xl font-semibold text-white'>
                Booking Confirmed!
              </h3>
              <p className='text-sm text-white/60'>
                Your ride has been successfully booked
              </p>
            </div>
            <Card className='bg-gradient-to-b from-zinc-900 to-black border-white/10 text-white max-w-md mx-auto'>
              <CardContent className='p-6 space-y-4 text-sm'>
                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Booking ID</span>
                  <span className='font-mono font-semibold'>CB123456</span>
                </div>
                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Date</span>
                  <span className='font-medium'>
                    {selectedDate ? format(selectedDate, 'PPP') : ''}
                  </span>
                </div>
                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-white/60'>Time</span>
                  <span className='font-medium'>{selectedTime}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-white/60'>Seats</span>
                  <span className='font-medium'>
                    {selectedSeats.join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={() => {
                setCurrentStep(1)
                setSelectedSeats([])
                setPassengers([])
              }}
              className='rounded-full bg-white text-black hover:bg-zinc-100 font-semibold py-3 px-6'
            >
              Book Another Ride
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    // We use flex-col and min-h-screen to ensure the page fills the height,
    // but doesn't create extra scroll space unless content is long.
    <div className='min-h-screen bg-black text-white flex flex-col relative'>

      {/* Conditionally Render the Loading Splash Screen */}
      {isLoading && <LoadingSplash />}
      {/* Main Content Area */}
      <div className='flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col'>
        {/* Timer Section */}
        {timerActive && (
          <div className='flex justify-center mb-6'>
            <div className='bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-full text-sm font-mono'>
              ⏱️ {Math.floor(timerSeconds / 60)}:
              {(timerSeconds % 60).toString().padStart(2, '0')}
              <span className='ml-1 text-xs'>(Seat lock expires)</span>
            </div>
          </div>
        )}

        {/* Step Content Wrapper */}
        <div className='flex-1'>
          <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white h-full'>
            <CardContent className='p-5 sm:p-7'>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons (Desktop Only - Inlined) */}
        <div className='hidden md:flex justify-between gap-4 max-w-5xl mx-auto w-full pt-8'>
          <Button
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 1}
            className='rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50 px-8'
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              currentStep === 6 ||
              (currentStep === 1 && !selectedDate) ||
              // DISABLED IF ON STEP 2 AND (NO CABS FOUND OR NONE SELECTED)
              (currentStep === 2 &&
                (availableCabs.length === 0 || !selectedCab)) ||
              (currentStep === 3 && selectedSeats.length === 0) ||
              (currentStep === 4 &&
                passengers.some(
                  (p) =>
                    !p.name ||
                    !p.age ||
                    !p.gender ||
                    !globalPickup ||
                    !globalDrop,
                ) &&
                (!passengers[0].phone || !passengers[0].email))
            }
            className='rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold disabled:opacity-50 px-8'
          >
            {currentStep === 6 ? 'Complete' : 'Next'}
            {currentStep < 6 && <ArrowRight className='ml-2 h-4 w-4' />}
          </Button>
        </div>
      </div>

      {/* Sticky Navigation Footer (Mobile Only) */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-lg'>
        <div className='flex justify-between gap-4 p-4'>
          <Button
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 1}
            className='flex-1 rounded-full border-white/20 text-white bg-transparent h-12'
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              currentStep === 6 ||
              (currentStep === 1 && !selectedDate) ||
              // DISABLED IF ON STEP 2 AND (NO CABS FOUND OR NONE SELECTED)
              (currentStep === 2 &&
                (availableCabs.length === 0 || !selectedCab)) ||
              (currentStep === 3 && selectedSeats.length === 0) ||
              (currentStep === 4 &&
                passengers.some(
                  (p) =>
                    !p.name ||
                    !p.age ||
                    !p.gender ||
                    !globalPickup ||
                    !globalDrop,
                ) &&
                (!passengers[0].phone || !passengers[0].email))
            }
            className='flex-1 rounded-full bg-emerald-500 text-black font-bold h-12'
          >
            {currentStep === 6 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Spacer so content doesn't get hidden behind the mobile sticky footer */}
      <div className='h-24 md:hidden' />

      {/* Modals & Popups (Rendered once at the bottom) */}
      {renderLoginModal()}
      {renderPaymentSelectionModal()}
      {renderRoutePopup && renderRoutePopup()}
    </div>
  )
}
