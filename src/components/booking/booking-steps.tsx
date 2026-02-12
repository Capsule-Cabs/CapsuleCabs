import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
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
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

import api from '@/services/api'
import { AuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import phonepe_image from '@/assets/phonepe_image.png'
import fetchRoutes from '@/services/bookingFunctions'

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
}

interface Passenger {
  name: string
  age: number | ''
  gender: string
  seatNumber: string
  fare: number
  pickupAddress?: string
  dropAddress?: string
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
  const preFilledData = location.state
  const [currentStep, setCurrentStep] = useState<number>(preFilledData ? 2 : 1)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    preFilledData?.date ? new Date(preFilledData.date) : undefined,
  )
  const [selectedCab, setSelectedCab] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [availableCabs, setAvailableCabs] = useState<CabWithAvailability[]>([])
  // const [totalFare, setTotalFare] = useState(0);
  const totalFare = useMemo(() => {
    return passengers.reduce((sum, p) => sum + (p.fare || 0), 0)
  }, [passengers])

  const { user, isAuthenticated, sendOtp, verifyOtp } = useContext(AuthContext)

  const [pickupOptions, setPickupOptions] = useState<PickupPoint[]>([])
  const [dropOptions, setDropOptions] = useState<DropPoint[]>([])
  const [pickupAddress, setPickupAddress] = useState<string>('')
  const [dropAddress, setDropAddress] = useState<string>('')

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

  // const { isLoaded } = useJsApiLoader({
  //   googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  //   libraries: ["places"],
  // });

  const handlePickupChanged = () => {
    const places = pickupBoxRef.current?.getPlaces()
    if (places && places.length > 0) {
      setPickupAddress(places[0].formatted_address ?? '')
    }
  }

  const handleDropChanged = () => {
    const places = dropBoxRef.current?.getPlaces()
    if (places && places.length > 0) {
      setDropAddress(places[0].formatted_address ?? '')
    }
  }
  const generateStrongOrderId = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)

    // High-precision alternative for browser
    const micro = performance.now().toString(36).replace('.', '')

    return (timestamp + random + micro).toUpperCase().slice(0, 14)
  }

  const fetchRoutesAndAvailability = async () => {
    try {
      const routes = await fetchRoutes(
        selectedDate,
        selectedDestination,
        selectedSource,
      )
      const cabsWithAvailabilityPromises = routes.map(async (route: any) => {
        let seatsAvailable: SeatAvailability[] = []
        let available = false

        if (selectedDate) {
          // if (route._id === selectedCab) {
          setPickupOptions(route.origin?.pickupPoints)
          setDropOptions(route.destination?.dropPoints)
          // }

          const dateStr = format(selectedDate, 'yyyy-MM-dd')

          try {
            const seatAvailRes = await api.get(
              `/routes/${route._id}/availability?travelDate=${dateStr}`,
            )
            seatsAvailable = seatAvailRes.data.data.seatsAvailable
            available = seatsAvailable.some(
              (seat: SeatAvailability) => seat.status === 'available',
            )
          } catch (e) {
            seatsAvailable = []
            available = false
          }
        }

        const departureTime = route.schedule[0].departureTime || ''
        const arrivalTime = route.schedule[0].arrivalTime || ''

        return {
          id: route._id,
          routeCode: route.routeCode,
          name: route?.vehicle?.type || 'Cab',
          capacity: route?.vehicle?.capacity || 6,
          price: route?.pricing?.baseFare || 550,
          image: '',
          route: `${route?.origin?.city} to ${route?.destination?.city}`,
          available,
          seatsAvailable,
          departureTime,
          arrivalTime,
        } as CabWithAvailability
      })

      const cabsWithAvailability = await Promise.all(
        cabsWithAvailabilityPromises,
      )
      setAvailableCabs(cabsWithAvailability)
      console.log(
        'Fetched cabs with availability',
        await cabsWithAvailability[0],
      )
    } catch (error) {
      console.error('Failed to fetch route or availability data', error)
    }
  }

  useEffect(() => {
    if (availableCabs.length > 0 && !selectedCab) {
      const firstAvailableCab = availableCabs.find((cab) => cab.available)
      if (firstAvailableCab) {
        setSelectedCab(firstAvailableCab.id)
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
        // setTotalFare(runningTotal);
        setPassengers(newPassengers)

        // 2. Log the local variable, not the state variable
        console.log('Calculated Total Fare:', runningTotal)
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

  const initiatePaymentFlow = () => {
    setShowPaymentModal(true)
  }
  const initPhonePe = async () => {
    try {
      const result = await PhonePePaymentPlugin.init({
        environment: 'SANDBOX', // Use "PRODUCTION" for live
        merchantId: 'YOUR_MERCHANT_ID',
        flowId: 'UNIQUE_FLOW_ID', // e.g., a UUID or UserID
        enableLogging: false,
      })
      console.log('PhonePe SDK Initialized:', result)
    } catch (error) {
      console.error('Initialization failed', error)
    }
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
    const apiRes = await api.post('/payments/createOrderForSdk', {
      amount: totalAmount,
      merchantOrderId,
      phone: user?.phone,
    })
    const { request } = apiRes.data.data
    try {
      const txnResult = await PhonePePaymentPlugin.startTransaction({
        request: request,
        appSchema: 'com.capsulecabs.app',
        showLoaderFlag: true,
      })

      if (txnResult.status === 'SUCCESS') {
        // verifyPaymentStatus(merchantOrderId);
        toast.success('Payment was successfull.')
      } else {
        toast.error('Payment was not successfull.')
      }
    } catch (error) {
      console.log('SDK Error: ', error)
    }
  }

  const makePayment = async () => {
    if (selectedGateway !== 'PHONEPE') return
    setIsAuthLoading(true)
    setShowPaymentModal(false)
    try {
      const totalAmount = totalFare
      const merchantOrderId = generateStrongOrderId()
      const response = await api.post('/payments/createOrder', {
        amount: totalAmount,
        merchantOrderId,
        phone: user?.phone,
      })

      if (response?.data?.data?.redirectUrl) {
        const sessionData = {
          selectedCab,
          selectedSeats,
          passengers,
          selectedDate: selectedDate?.toISOString(),
          merchantOrderId,
          totalFare,
        }

        localStorage.setItem('pending_booking', JSON.stringify(sessionData))

        window.location.href = response?.data?.data?.redirectUrl
      } else {
        throw new Error('Payment URL not received')
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
    if (!showPaymentModal) return null

    return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-4'>
        <div className='relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300'>
          {/* Header Branding Area - PhonePe Theme */}
          <div className='bg-[#5f259f] p-8 pb-14 flex justify-between items-start'>
            <div>
              <h2 className='text-2xl font-bold text-white tracking-tight'>
                Checkout
              </h2>
              <p className='text-purple-200/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-1'>
                Secure Transaction
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className='p-2 bg-black/20 rounded-full text-white/50 hover:text-white transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Payment Options Container */}
          <div className='px-5 -mt-8 space-y-4 pb-8'>
            {/* PhonePe Option */}
            <button
              onClick={() => setSelectedGateway('PHONEPE')}
              className={`w-full group flex items-center justify-between p-4 rounded-[2rem] bg-white transition-all duration-500 shadow-xl relative overflow-hidden ${
                selectedGateway === 'PHONEPE'
                  ? 'ring-[3px] ring-emerald-500 ring-offset-4 ring-offset-zinc-900 scale-[1.02]'
                  : 'hover:bg-zinc-50'
              }`}
            >
              <div className='flex items-center gap-4 relative z-10'>
                {/* The Logo Container */}
                <div className='relative w-14 h-14 flex-shrink-0'>
                  {/* Updated: Added PhonePe Brand Purple (#5f259f) and removed border */}
                  <div className='absolute inset-0 rounded-full flex items-center justify-center overflow-hidden'>
                    {/* Updated: Removed 'invert' to keep the logo white as per original asset */}
                    <img
                      src={phonepe_image}
                      alt='PhonePe'
                      className='w-10 h-10 object-contain'
                    />
                  </div>

                  {/* Secure Checkmark Badge */}
                  <div className='absolute -bottom-0.5 -right-0.5 bg-sky-500 rounded-full p-1 border-2 border-white shadow-sm'>
                    <CheckCircle
                      className='w-2.5 h-2.5 text-white'
                      fill='currentColor'
                    />
                  </div>
                </div>

                <div className='text-left'>
                  <p className='font-black text-zinc-900 text-xl tracking-tight leading-none'>
                    PhonePe
                  </p>
                  <div className='flex items-center gap-1 mt-1.5'>
                    <span className='text-[9px] text-zinc-400 font-bold uppercase tracking-tighter'>
                      100% Secured
                    </span>
                    <div className='h-0.5 w-0.5 rounded-full bg-zinc-300' />
                    <span className='text-[9px] text-zinc-400 font-bold uppercase tracking-tighter'>
                      UPI / Cards
                    </span>
                  </div>
                </div>
              </div>

              {/* Pro Radio Selection UI matching image_b8f838.png */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  selectedGateway === 'PHONEPE'
                    ? 'border-sky-500 bg-white'
                    : 'border-zinc-200'
                }`}
              >
                {selectedGateway === 'PHONEPE' && (
                  <div className='w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)] animate-in zoom-in duration-200' />
                )}
              </div>
            </button>

            {/* Zoho Option (Disabled) */}
            <div className='opacity-40 pointer-events-none grayscale px-2'>
              <div className='flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center'>
                    <span className='text-white/20 font-bold text-xs italic'>
                      Zoho
                    </span>
                  </div>
                  <p className='font-bold text-white/30'>Other Methods</p>
                </div>
                <Badge
                  variant='outline'
                  className='text-[10px] border-white/10 text-white/20'
                >
                  Coming Soon
                </Badge>
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handlePaymentSelection}
              disabled={isAuthLoading}
              className='w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg mt-4 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all'
            >
              {isAuthLoading ? (
                <Loader2 className='animate-spin h-6 w-6' />
              ) : (
                `PROCEED TO PAY ₹${selectedSeats.length * 550}`
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  const renderSeatLayout = () => {
    if (!selectedCab) return null

    const cab = availableCabs.find((c) => c.id === selectedCab)

    if (!cab) return null

    const seats = cab.seatsAvailable

    const seatByNum: Record<string, SeatAvailability | undefined> = {}
    seats.forEach((seat) => {
      seatByNum[seat.seatNumber] = seat
    })
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
            <div className='w-3 h-3 rounded border border-white/20 bg-white/10' />
            <span>Available</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded border border-emerald-400/80 bg-emerald-500/30' />
            <span>Selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded border border-amber-500/80 bg-amber-500/30' />
            <span>Locked</span>
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
  }> = ({ seatNum, seatObj }) => {
    if (!seatObj) {
      return <div className='min-w-[52px] min-h-[42px]' />
    }

    const isBooked = seatObj.status === 'booked'
    const isSelected = selectedSeats.includes(seatNum)
    const isLocked =
      seatObj.status === 'locked' &&
      seatObj.lockedBy &&
      seatObj.lockedBy !== user?.id
    const seatPrice = seatObj.price || 0 // Add this line

    return (
      <button
        type='button'
        className={[
          'min-w-[52px] min-h-[48px] rounded-lg border-2 text-xs font-semibold flex flex-col items-center justify-center transition-all shadow-sm p-1',
          isBooked
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
        {seatPrice > 0 && (
          <span className='text-[10px] text-white/70 font-medium mt-[1px] leading-none'>
            ₹{seatPrice}
          </span>
        )}
      </button>
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
          <div className='w-full max-w-4xl mx-auto px-4 py-8 space-y-6'>
            <h3 className='text-2xl font-bold text-white text-center mb-8'>
              Select Cab & Time
            </h3>

            <div
              className={
                availableCabs.length === 1
                  ? 'max-w-2xl mx-auto'
                  : 'grid grid-cols-1 md:grid-cols-2 gap-4'
              }
            >
              {availableCabs.length > 0 ? (
                availableCabs.map((cab) => {
                  const departureTime = cab.departureTime
                    ? new Date(`2000-01-01T${cab.departureTime}`)
                        .toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                        .toLowerCase()
                    : '09:55'
                  const arrivalTime = cab.arrivalTime
                    ? new Date(`2000-01-01T${cab.arrivalTime}`)
                        .toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                        .toLowerCase()
                    : '09:55'

                  const selected = selectedCab === cab.id
                  const isAvailable = cab.available

                  return (
                    <Card
                      key={cab.id}
                      className={`
                  relative group h-full bg-zinc-950/95 backdrop-blur-xl border border-white/10 
                  rounded-2xl p-6 shadow-xl hover:shadow-emerald/25 hover:border-emerald/20 
                  hover:-translate-y-1 transition-all duration-300 ${availableCabs.length === 1 ? 'max-w-none mx-auto shadow-2xl scale-105' : ''}
                  ${selected ? 'ring-2 ring-emerald/40 shadow-emerald/25 border-emerald/20' : ''}
                  ${!isAvailable ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                      onClick={() => isAvailable && setSelectedCab(cab.id)}
                    >
                      {/* Starting From - Plain Text Bottom Right */}
                      <div className='absolute bottom-3 right-3 text-xs text-white/80 font-medium leading-tight z-20 drop-shadow-md'>
                        Starting from <br className='sm:hidden' />
                        <span className='text-sm font-bold text-white'>
                          ₹{cab.price || 349} +GST
                        </span>
                      </div>

                      {selected && (
                        <div className='absolute inset-0 bg-emerald/5 rounded-2xl backdrop-blur-sm z-10' />
                      )}

                      <CardContent className='p-6 relative z-20 h-full flex flex-col justify-between pt-2'>
                        <div className='space-y-4'>
                          {/* Header */}
                          <div className='flex items-center justify-between gap-2 mb-4'>
                            <div
                              className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm'bg-emerald/15 text-emerald-400 hover:bg-emerald/25 shadow-md'`}
                            >
                              {cab.routeCode}
                            </div>
                            <Badge
                              className={`ml-auto px-2.5 py-0.5 text-xs font-semibold h-fit whitespace-nowrap ${
                                selected
                                  ? 'bg-emerald/20 text-emerald-400 border-emerald/30 shadow-sm'
                                  : isAvailable
                                    ? 'bg-emerald/15 text-emerald-400 border-emerald/30'
                                    : 'bg-zinc-800/50 text-white/50 border-zinc-700/50'
                              }`}
                            >
                              {selected
                                ? 'SELECTED'
                                : isAvailable
                                  ? 'Available'
                                  : 'Full'}
                            </Badge>
                          </div>

                          {/* Route */}
                          <h4 className='font-bold text-white text-lg leading-tight line-clamp-1'>
                            {cab.route || `Seater ${cab.id}`}
                          </h4>

                          {/* Seats */}
                          <p className='text-sm text-white/70 flex items-center gap-2'>
                            <span>{cab.capacity || 50} seats</span>
                          </p>

                          {/* Time */}
                          <div
                            className={`px-4 py-3 rounded-xl text-lg font-bold text-center shadow-md transition-all ${
                              selected
                                ? 'bg-emerald/30 text-emerald-50 border-2 border-emerald/40 shadow-emerald/25'
                                : isAvailable
                                  ? 'bg-zinc-900/60 text-white border border-white/20 hover:bg-emerald/20 hover:border-emerald/30 hover:text-emerald-400'
                                  : 'bg-zinc-900/80 text-white/60 border border-zinc-800/50'
                            }`}
                          >
                            {departureTime} — {arrivalTime}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className='col-span-full p-12 text-center bg-zinc-950/60 backdrop-blur-xl border-white/10 rounded-2xl max-w-2xl mx-auto'>
                  <Clock className='h-16 w-16 mx-auto mb-4 text-white/20' />
                  <h4 className='text-xl font-bold text-white mb-2'>
                    No cabs available
                  </h4>
                  <p className='text-white/50 mb-6'>
                    Try different timings or routes
                  </p>
                  <button className='px-8 py-3 bg-emerald/20 text-emerald-300 border border-emerald/30 rounded-xl font-semibold hover:bg-emerald/30 transition-all'>
                    Refresh
                  </button>
                </Card>
              )}
            </div>
          </div>
        )

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
          <div className='max-w-3xl mx-auto bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8'>
            <h3 className='text-2xl font-semibold text-center mb-6 text-white'>
              Enter Passenger Details
            </h3>

            <div className='space-y-6'>
              {passengers.map((passenger, idx) => (
                <div
                  key={passenger.seatNumber}
                  className='border border-white/10 bg-white/5 rounded-xl p-5 sm:p-6 shadow-sm'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='font-semibold text-white'>
                      Seat {passenger.seatNumber}
                    </h4>
                    <Badge className='bg-emerald-500/20 text-emerald-200 border-emerald-400/50'>
                      ₹{passenger.fare}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block mb-1 text-xs font-medium text-white/60'>
                        Name
                      </label>
                      <input
                        type='text'
                        placeholder='Name'
                        value={passenger.name}
                        onChange={(e) => {
                          const newPax = [...passengers]
                          newPax[idx].name = e.target.value
                          setPassengers(newPax)
                        }}
                        className='border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70'
                      />
                    </div>

                    <div>
                      <label className='block mb-1 text-xs font-medium text-white/60'>
                        Age
                      </label>
                      <input
                        type='number'
                        min={1}
                        placeholder='Age'
                        value={passenger.age}
                        onChange={(e) => {
                          const newPax = [...passengers]
                          newPax[idx].age = Number(e.target.value)
                          setPassengers(newPax)
                        }}
                        className='border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70'
                      />
                    </div>

                    <div>
                      <label className='block mb-1 text-xs font-medium text-white/60'>
                        Gender
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => {
                          const newPax = [...passengers]
                          newPax[idx].gender = e.target.value
                          setPassengers(newPax)
                        }}
                        className='border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70'
                      >
                        <option value=''>Select Gender</option>
                        <option value='male'>Male</option>
                        <option value='female'>Female</option>
                        <option value='other'>Other</option>
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
                      <label className='block mb-1 text-xs font-medium text-white/60'>
                        Pickup Address
                      </label>
                      <select
                        value={passenger.pickupAddress || ''}
                        onChange={(e) => {
                          const newPax = [...passengers]
                          newPax[idx].pickupAddress = e.target.value
                          setPassengers(newPax)
                        }}
                        className='border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70'
                      >
                        <option value=''>Select Pickup</option>
                        {pickupOptions.map((point) => (
                          <option value={point.name}>
                            {point.name} ({point.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block mb-1 text-xs font-medium text-white/60'>
                        Drop Address
                      </label>
                      <select
                        value={passenger.dropAddress || ''}
                        onChange={(e) => {
                          const newPax = [...passengers]
                          newPax[idx].dropAddress = e.target.value
                          setPassengers(newPax)
                        }}
                        className='border border-white/15 bg-black/40 px-3 py-2.5 rounded-lg w-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/70'
                      >
                        <option value=''>Select Drop</option>
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

            <div className='flex justify-center mt-6'>
              <Button
                disabled={passengers.some(
                  (p) => !p.name || !p.age || !p.gender,
                )}
                onClick={nextStep}
                className='px-10 py-3 text-base rounded-full bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400'
              >
                Continue
              </Button>
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
    <div className='min-h-screen bg-black text-white flex flex-col'>
      {/* <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 flex flex-col gap-6"> */}
      <div>
        {timerActive && (
          <div className='flex justify-center mb-4'>
            <div className='bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-full text-sm font-mono'>
              ⏱️ {Math.floor(timerSeconds / 60)}:
              {(timerSeconds % 60).toString().padStart(2, '0')}
              <span className='ml-1 text-xs'>(Seat lock expires)</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white flex-1'>
          <CardContent className='p-5 sm:p-7'>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className='flex justify-between gap-4 max-w-5xl mx-auto w-full pt-2'>
          <Button
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 1}
            className='rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              currentStep === 6 ||
              (currentStep === 1 && !selectedDate) ||
              (currentStep === 2 && !selectedCab) ||
              (currentStep === 3 && selectedSeats.length === 0) ||
              (currentStep === 4 &&
                passengers.some((p) => !p.name || !p.age || !p.gender))
            }
            className='rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {currentStep === 6 ? 'Complete' : 'Next'}
            {currentStep < 6 && <ArrowRight className='ml-2 h-4 w-4' />}
          </Button>
        </div>

        {/* Login Modal */}
        {renderLoginModal()}
        <div className='min-h-screen bg-black text-white flex flex-col'>
          {/* ... existing code ... */}
          {renderLoginModal()}
          {renderPaymentSelectionModal()}
        </div>
      </div>
    </div>
  )
}
