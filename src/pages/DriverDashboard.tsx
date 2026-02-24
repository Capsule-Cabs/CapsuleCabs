import React, { useEffect, useState, useContext } from 'react'
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
  QrCode,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'

import { Navigation } from '@/components/ui/navigation'
import { AuthContext } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'

// --- Interfaces (Preserved) ---
interface PassengerDetail {
  name: string
  age: number
  gender: string
  pickupPoint: string
  dropPoint: string
  fare: number,
  seatNumber: number,
}

interface DriverBooking {
  id: string
  routeCode: string
  travelDate: string
  departureTime: string
  estimatedArrivalTime: string
  totalPassengers: number
  totalRevenue: number
  seatNumbers: string[]
  allBookingIds: string[]
  passengerDetails: PassengerDetail[]
}

const DriverDashboard: React.FC = () => {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState<DriverBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<DriverBooking | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // --- Scanning States ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean, data?: any, message?: string } | null>(null)

  // --- Existing Data Fetching ---
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const res = await api.get('/driver/bookings/today')
        setBookings(res.data.bookings)
      } catch (err) {
        console.error('Failed to load driver bookings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  // 1. Updated Permission Logic - Simply trigger the UI
  const handleStartScan = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported on this browser or connection.");
      return;
    }
    // We don't call getUserMedia here anymore to avoid hardware locks
    setIsScanning(true);
  };

  // 2. Updated Scanner Initialization
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      // Small delay to ensure the DOM element #qr-reader is fully mounted
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            // Using a simple facingMode object which is most stable on Android Chrome
            videoConstraints: {
              facingMode: "environment"
            },
            rememberLastUsedCamera: true
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            const id = decodedText.split('/').pop();
            if (id) {
              scanner?.clear().then(() => {
                setIsScanning(false);
                verifyTicket(id);
              }).catch(err => console.error("Clear error", err));
            }
          },
          (errorMessage) => {
            // You can ignore constant frame errors
          }
        );
      }, 100); // 100ms delay

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Cleanup error", err));
        }
      };
    }
  }, [isScanning]);

  const verifyTicket = async (bookingId: string) => {
    try {
      const response = await api.post('/bookings/verify-ticket', { bookingId });
      if (response?.data?.success) {
        setScanResult({ success: true, data: response?.data?.data });
      }
    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.response?.data?.message || "Invalid or Expired Ticket"
      })
    }
  }

  const totalTodayPassengers = bookings.reduce((sum, b) => sum + (b.totalPassengers || 0), 0) || 0
  const totalTodayRevenue = bookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0) || 0

  return (
    <div className='min-h-screen bg-black text-white flex flex-col relative'>
      <Navigation />

      <main className='flex-1 pb-32'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8'>

          <header className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
            <div>
              <p className='text-xs font-mono text-emerald-400/80 tracking-[0.2em] uppercase'>
                Driver Dashboard
              </p>
              <h1 className='mt-2 text-2xl sm:text-3xl font-semibold tracking-tight'>
                {user?.firstName ? `Hi ${user.firstName}, here's your day.` : "Hi Driver, here's your day."}
              </h1>
            </div>
            <div className='flex items-center gap-3'>
              <Badge className='bg-white/10 border border-white/15 text-[11px] text-white/70 rounded-full px-3 py-1'>
                Live · Route assignments
              </Badge>
            </div>
          </header>

          {/* Stats cards */}
          <section className='grid sm:grid-cols-3 gap-4'>
            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div><p className='text-xs text-white'>Today&apos;s trips</p><p className='mt-1 text-2xl font-semibold text-white'>{bookings.length}</p></div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'><Bus className='h-5 w-5 text-emerald-300' /></div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div><p className='text-xs text-white'>Total passengers</p><p className='mt-1 text-2xl font-semibold text-white'>{totalTodayPassengers}</p></div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'><Users className='h-5 w-5 text-emerald-300' /></div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div><p className='text-xs text-white'>Total revenue</p><p className='mt-1 text-2xl font-semibold text-white'>₹{totalTodayRevenue.toLocaleString()}</p></div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'><IndianRupee className='h-5 w-5 text-emerald-300' /></div>
              </CardContent>
            </Card>
          </section>

          {/* Assignments List */}
          <section className='space-y-4'>
            <h2 className='text-lg font-semibold tracking-tight'>Your Assignments</h2>
            {loading ? (
              <div className='p-8 flex items-center justify-center gap-3'><Loader2 className='h-5 w-5 animate-spin text-emerald-400' /><p className='text-sm text-white/70'>Syncing bookings...</p></div>
            ) : (
              <div className='space-y-3'>
                {bookings.map((booking) => (
                  <Card key={booking.id} className='bg-gradient-to-r from-zinc-950 to-black border-white/10 hover:border-emerald-400/60 transition-all cursor-pointer' onClick={() => setSelectedBooking(booking)}>
                    <CardContent className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-start gap-4'>
                        <div className='h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center mt-0.5'><Bus className='h-5 w-5 text-emerald-300' /></div>
                        <div>
                          <p className='font-semibold text-sm text-white'>Route {booking.routeCode}</p>
                          <div className='mt-2 flex gap-4 text-xs text-white/60'>
                            <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{booking.departureTime}</span>
                            <span className='flex items-center gap-1'><Users className='h-3 w-3' />{booking.totalPassengers} Passengers</span>
                          </div>
                        </div>
                      </div>
                      <Button size='sm' variant='ghost' className='text-emerald-400'>View details <ChevronRight className='h-4 w-4 ml-1' /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* --- FLOATING SCAN BUTTON (With Permission Check) --- */}
      <div className='fixed bottom-8 right-6 z-50'>
        <Button
          onClick={handleStartScan}
          className='h-16 w-16 rounded-full bg-[#9dec75] text-black shadow-[0_10px_30px_rgba(157,236,117,0.3)] hover:bg-[#86d664] hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 border-4 border-black'
        >
          <QrCode className='h-6 w-6' />
          <span className='text-[10px] font-black uppercase'>Scan</span>
        </Button>
      </div>

      {/* --- SCANNER OVERLAY --- */}
      {isScanning && (
        <div className='fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl'>
          <div className='w-full max-w-md'>
            <div className='flex justify-between items-center mb-8'>
              <div className='space-y-1 text-left'>
                <h2 className='text-2xl font-bold'>Scan Boarding Pass</h2>
                <p className='text-white/40 text-sm'>Align passenger QR inside the frame</p>
              </div>
              <Button variant='ghost' onClick={() => setIsScanning(false)} className='rounded-full h-12 w-12 bg-white/5 hover:bg-white/10'>
                <X className='h-6 w-6' />
              </Button>
            </div>
            <div className='relative p-1.5 bg-gradient-to-tr from-[#9dec75]/40 to-white/5 rounded-[2.5rem]'>
              <div id='qr-reader' className='overflow-hidden rounded-[2.2rem] bg-zinc-950 aspect-square border border-white/10'></div>
              {/* UI Corner Guides */}
              <div className='absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-[#9dec75] rounded-tl-xl'></div>
              <div className='absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-[#9dec75] rounded-tr-xl'></div>
              <div className='absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-[#9dec75] rounded-bl-xl'></div>
              <div className='absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-[#9dec75] rounded-br-xl'></div>
            </div>
            <Button onClick={() => setIsScanning(false)} className='w-full mt-10 bg-white/5 text-white/40 hover:text-white rounded-2xl py-6 border border-white/5 transition-colors'>Cancel</Button>
          </div>
        </div>
      )}

      {/* --- VERIFICATION RESULT MODAL --- */}
      {scanResult && (
        <div className='fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md'>
          <Card className='w-full max-w-sm bg-zinc-900 border-zinc-800 text-white'>
            <CardContent className='pt-10 pb-6 text-center'>
              {scanResult.success ? (
                <>
                  <div className='w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6'><ShieldCheck className='h-12 w-12 text-emerald-500' /></div>
                  <h3 className='text-2xl font-bold mb-1'>Verified</h3>
                  <p className='text-[#9dec75] font-black text-xl mb-4 uppercase'>{scanResult.data.passengerName}</p>
                  <div className='bg-black/50 rounded-2xl p-4 text-left border border-white/5 mb-8'>
                    <p className='text-[10px] text-white/30 uppercase tracking-widest mb-1'>Seats</p>
                    <p className='text-white font-bold text-lg'>{scanResult.data.seats}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className='w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6'><ShieldAlert className='h-12 w-12 text-red-500' /></div>
                  <h3 className='text-2xl font-bold text-red-500 mb-2'>Invalid</h3>
                  <p className='text-white/50 px-4 mb-8'>{scanResult.message}</p>
                </>
              )}
              <Button onClick={() => setScanResult(null)} className='w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 font-black uppercase tracking-widest transition-transform active:scale-95'>Continue</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- PASSENGER DETAILS MODAL (Preserved) --- */}
      {selectedBooking && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10'>
              <CardTitle className='text-xl'>Booking Details</CardTitle>
              <button onClick={() => setSelectedBooking(null)} className='h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'><X className='h-4 w-4' /></button>
            </CardHeader>
            <CardContent className='pt-6 space-y-6'>
              <div className='space-y-3'>
                <h3 className='text-sm font-semibold uppercase tracking-[0.15em] text-white/70'>Passengers ({selectedBooking.passengerDetails.length})</h3>
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {selectedBooking.passengerDetails.map((pax, idx) => (
                    <div key={idx} className='flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-colors'>
                      <div className='h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0'><UserIcon className='h-5 w-5 text-emerald-400' /></div>
                      <div className='min-w-0 flex-1'><p className='font-bold text-sm text-white truncate'>{pax.name}</p><p className='text-xs text-white/50'>{pax.gender} • {pax.age} yrs</p></div>
                      <Badge className='bg-emerald-500/10 text-emerald-400 border-emerald-500/20'>Seat {pax.seatNumber}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setSelectedBooking(null)} className='w-full rounded-full bg-white text-black font-semibold py-2.5'>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default DriverDashboard