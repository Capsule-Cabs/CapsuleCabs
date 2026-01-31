import React, { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  MapPin,
  Car,
  History,
  ArrowRight,
  Ticket,
} from 'lucide-react'

import { Navigation } from '@/components/ui/navigation'
import { AuthContext } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'

type BookingStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled'

interface Booking {
  _id: string
  origin: string
  destination: string
  fare: number
  status: BookingStatus
  startTime: string
  travelDate: string
  departureTime: string
  arrivalTime?: string
  seatNumbers: string[]
  totalPassengers: number
}

const upcomingTrips: any[] = []
const pastTrips: any[] = []

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext)
  const [upcomingTrips, setUpcomingTrips] = useState<Booking[]>([])
  const [pastTrips, setPastTrips] = useState<Booking[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [tripError, setTripError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        setLoadingTrips(true)
        setTripError(null)

        const json = await api.get(`/bookings/mine`)
        console.log('Bookings response:', json)
        const bookings = (json?.data?.data?.bookings ?? []) as any[]

        const mapped: Booking[] = bookings.map((b) => {
          const routeOrigin =
            b?.route?.origin ??
            b?.route?.routeId?.origin?.city ??
            b?.route?.routeId?.origin?.location ??
            'Unknown'

          const routeDestination =
            b?.route?.destination ??
            b?.route?.routeId?.destination?.city ??
            b?.route?.routeId?.destination?.location ??
            'Unknown'

          const travelDateIso = b?.journey?.travelDate as string | undefined // "2025-12-09T00:00:00.000Z"
          const departureTime = b?.journey?.departureTime ?? '' // "06:00"
          const estimatedArrivalTime = b?.journey?.estimatedArrivalTime ?? '' // "10:00"

          // Build a proper ISO startTime using travelDate + departure time
          let startTimeIso = new Date().toISOString()
          if (travelDateIso && departureTime) {
            const d = new Date(travelDateIso)
            const [hh, mm] = departureTime.split(':')
            d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0)
            startTimeIso = d.toISOString()
          } else if (travelDateIso) {
            startTimeIso = new Date(travelDateIso).toISOString()
          }

          const fare = b?.payment?.totalAmount ?? b?.payment?.baseFare ?? 0

          // map backend status -> dashboard status
          let status: BookingStatus = 'booked'
          if (b.status === 'cancelled') status = 'cancelled'
          if (b.status === 'completed') status = 'completed'
          if (b.status === 'confirmed') status = 'booked'

          const seatNumbers: string[] =
            Array.isArray(b?.seatNumbers) && b.seatNumbers.length > 0
              ? b.seatNumbers
              : Array.isArray(b?.passengers)
                ? b.passengers.map((p: any) => p.seatNumber).filter(Boolean)
                : []

          const totalPassengers: number =
            typeof b?.totalPassengers === 'number'
              ? b.totalPassengers
              : Array.isArray(b?.passengers)
                ? b.passengers.length
                : 0

          // human-readable date
          const travelDateFormatted = travelDateIso
            ? new Date(travelDateIso).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : ''

          return {
            _id: b._id,
            origin: routeOrigin,
            destination: routeDestination,
            fare,
            status,
            startTime: startTimeIso,
            travelDate: travelDateFormatted,
            departureTime,
            arrivalTime: estimatedArrivalTime,
            seatNumbers,
            totalPassengers,
          }
        })

        const now = new Date()

        const upcoming = mapped.filter((trip) => {
          const start = new Date(trip.startTime)
          return (
            (trip.status === 'booked' || trip.status === 'ongoing') &&
            start >= now
          )
        })

        const past = mapped.filter((trip) => {
          const start = new Date(trip.startTime)
          return start < now || trip.status === 'completed'
        })

        setUpcomingTrips(upcoming)
        setPastTrips(past)
      } catch (err: any) {
        setTripError(err.message || 'Something went wrong fetching bookings')
      } finally {
        setLoadingTrips(false)
      }
    }

    fetchMyBookings()
  }, [])

  return (
    <div className='min-h-screen bg-black text-white flex flex-col'>
      <Navigation />

      <main className='flex-1'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8'>
          {/* Header */}
          <header className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
            <div>
              <p className='text-xs font-mono text-emerald-400/80 tracking-[0.2em] uppercase'>
                My Dashboard
              </p>
              <h1 className='mt-2 text-2xl sm:text-3xl font-semibold tracking-tight'>
                Welcome{user?.firstName ? `, ${user.firstName}` : ''}.
              </h1>
              <p className='mt-1 text-sm text-white/60'>
                Manage your bookings and view your travel history.
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Link to='/booking'>
                <Button className='rounded-full bg-emerald-500 text-black hover:bg-emerald-400 flex items-center gap-2'>
                  <Car className='h-4 w-4' />
                  Book a new ride
                </Button>
              </Link>
              <Badge className='bg-white/10 border border-white/15 text-[11px] text-white/70 rounded-full px-3 py-1'>
                Smart commute · CapsuleCabs
              </Badge>
            </div>
          </header>

          {/* Summary cards */}
          <section className='grid sm:grid-cols-3 gap-4'>
            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div>
                  <p className='text-xs text-white/60'>Upcoming trips</p>
                  <p className='mt-1 text-2xl font-semibold'>
                    {upcomingTrips.length}
                  </p>
                </div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'>
                  <CalendarDays className='h-5 w-5 text-emerald-300' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div>
                  <p className='text-xs text-white/60'>Completed trips</p>
                  <p className='mt-1 text-2xl font-semibold'>
                    {pastTrips.length}
                  </p>
                </div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'>
                  <History className='h-5 w-5 text-emerald-300' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-b from-zinc-950 to-black border-white/10'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div>
                  <p className='text-xs text-white/60'>Active tickets</p>
                  <p className='mt-1 text-2xl font-semibold'>
                    {
                      upcomingTrips.filter(
                        (trip) =>
                          trip.status === 'booked' || trip.status === 'ongoing',
                      ).length
                    }
                  </p>
                </div>
                <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center'>
                  <Ticket className='h-5 w-5 text-emerald-300' />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Upcoming trips */}
          <section className='space-y-4'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2'>
                Upcoming Trips
                <span className='text-xs font-normal text-white/50'>
                  {upcomingTrips.length > 0
                    ? `${upcomingTrips.length} scheduled`
                    : 'No trips scheduled'}
                </span>
              </h2>
              {/* {upcomingTrips.length > 0 && (
                <Link to="/bookings">
                  <Button
                    size="sm"
                    className="rounded-full border-white/20 text-white hover:bg-white/10"
                  >
                    View all
                  </Button>
                </Link>
              )} */}
            </div>

            {upcomingTrips.length === 0 ? (
              <Card className='bg-white/5 border-white/10'>
                <CardContent className='p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-white/90'>
                      No upcoming bookings
                    </p>
                    <p className='text-xs text-white/60 mt-1'>
                      You don&apos;t have any trips scheduled. Ready to book
                      your next ride?
                    </p>
                  </div>
                  <Link to='/booking'>
                    <Button className='rounded-full bg-white text-black hover:bg-zinc-100 flex items-center gap-2'>
                      Book a ride
                      <ArrowRight className='h-4 w-4' />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-3'>
                {upcomingTrips.map((trip: any) => (
                  <Card
                    key={trip.id}
                    className='bg-gradient-to-r from-zinc-950 to-black border-white/10 hover:border-emerald-400/60 hover:-translate-y-[1px] transition-all'
                  >
                    <CardContent className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-start gap-4'>
                        <div className='h-9 w-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center mt-1'>
                          <Car className='h-5 w-5 text-emerald-300' />
                        </div>
                        <div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <p className='font-semibold text-sm'>
                              {trip.origin} → {trip.destination}
                            </p>
                            <Badge className='bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-[11px] rounded-full px-2 py-0.5'>
                              {trip.status === 'ongoing'
                                ? 'Ongoing'
                                : 'Upcoming'}
                            </Badge>
                          </div>
                          <div className='mt-2 flex flex-wrap items-center gap-1 text-xs text-white/60'>
                            <span className='flex items-center gap-1'>
                              {trip.date}
                            </span>
                            <span className='flex items-center gap-1'>
                              <Clock className='h-3 w-3' />
                              <p className='trip-time'>
                                {trip.travelDate} • {trip.departureTime}–
                                {trip.arrivalTime}
                              </p>
                            </span>
                            <span className='flex items-center gap-1'>
                              <MapPin className='h-3 w-3' />
                              Seat {trip.seatNumbers}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <p className='text-sm font-semibold'>
                          ₹
                          {trip.fare?.toFixed
                            ? trip.fare.toFixed(2)
                            : trip.fare}
                        </p>
                        {/* <Link to={`/bookings/${trip.id}`}>
                          <Button
                            size="sm"
                            className="rounded-full border-white/20 text-white hover:bg-white/10"
                          >
                            View ticket
                          </Button>
                        </Link> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className='space-y-4 pb-6'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2'>
                Travel History
              </h2>
              {/* {pastTrips.length > 0 && (
                <Link to="/bookings">
                  <Button
                    size="sm"
                    className="rounded-full border-white/20 text-white hover:bg-white/10"
                  >
                    View all
                  </Button>
                </Link>
              )} */}
            </div>

            {pastTrips.length === 0 ? (
              <Card className='bg-white/5 border-white/10'>
                <CardContent className='p-6 text-sm text-white/65'>
                  No completed trips yet. Your past rides will appear here once
                  you start traveling with CapsuleCabs.
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-3'>
                {pastTrips.map((trip: any) => (
                  <Card
                    key={trip.id}
                    className='bg-zinc-950 border-white/10 hover:border-emerald-400/40 transition-all'
                  >
                    <CardContent className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div>
                        <p className='font-semibold text-sm'>
                          {trip.origin} → {trip.destination}
                        </p>
                        <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-white/60'>
                          <span className='flex items-center gap-1'>
                            <CalendarDays className='h-3 w-3' />
                            {trip.date}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {trip.time}
                          </span>
                          <span className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3' />
                            Seat {trip.seat}
                          </span>
                        </div>
                      </div>
                      <div className='flex flex-col items-end gap-1 text-xs text-white/60'>
                        <span>Total paid</span>
                        <span className='text-sm font-semibold text-white'>
                          ₹
                          {trip.fare?.toFixed
                            ? trip.fare.toFixed(2)
                            : trip.fare}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
