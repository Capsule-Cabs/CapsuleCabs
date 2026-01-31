import { useContext } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Star,
  Users,
  Smartphone,
  Car,
} from 'lucide-react'

import { Navigation } from '@/components/ui/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import heroImage from '@/assets/hero-cab.png'
import { AuthContext } from '@/contexts/AuthContext'
import DriverDashboard from './DriverDashboard'
import { AboutUs } from '@/components/sections/AboutUs'
import { Footer } from '@/components/sections/Footer'

const FEATURES = [
  {
    icon: Shield,
    title: 'Trusted & Safe',
    description:
      'Verified drivers, live tracking, and secure payments for every ride.',
  },
  {
    icon: Clock,
    title: 'Always On Time',
    description:
      'Smart routing and live traffic data help you reach on time, every time.',
  },
  {
    icon: MapPin,
    title: 'Smart Routing',
    description:
      'Optimized pickup and drop points to reduce detours and save time.',
  },
  {
    icon: Users,
    title: 'Shared & Private',
    description: 'Choose shared rides with guaranteed seats and clear pricing.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Choose route & time',
    desc: 'Select your origin, destination, travel date, and preferred time slot.',
  },
  {
    step: '02',
    title: 'Pick your seat',
    desc: 'View live seat layout, lock your seat, and enjoy transparent pricing.',
  },
  {
    step: '03',
    title: 'Enter passenger details',
    desc: 'Add passenger information and pickup / drop addresses with ease.',
  },
  {
    step: '04',
    title: 'Pay & ride',
    desc: 'Complete payment securely and track your ride in real time.',
  },
]

const STATS = [
  { label: '', value: '25k+' },
  { label: 'Trips completed', value: '120k+' },
  { label: 'Average rating', value: '4.8★' },
]

const TESTIMONIALS = [
  {
    name: 'Amit Verma',
    role: 'Daily commuter',
    comment:
      'CapsuleCabs will surely made my Gurgaon–Agra commute predictable and stress-free. Fixed pricing is a game changer.',
  },
  {
    name: 'Priya Sharma',
    role: 'Frequent traveler',
    comment:
      'The UI is clean, booking is fast, and the routes are well planned. Feels premium without a premium price tag.',
  },
]

const Index = () => {
  const { user, isAuthenticated } = useContext(AuthContext)

  if (user?.role === 'driver') {
    return <DriverDashboard />
  }

  return (
    <div className='h-screen w-screen bg-black min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col'>
      {/* Top Navigation */}
      <div className='border-b border-white/5 bg-black/80 backdrop-blur-sm sticky top-0 z-40'>
        <Navigation />
      </div>

      {/* Page Content */}
      <main className='flex-1 bg-black'>
        {/* Hero */}
        <section className='relative overflow-hidden w-full'>
          {/* Glow background */}
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute -top-32 -left-32 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl' />
            <div className='absolute bottom-0 right-0 h-80 w-80 rounded-full bg-lime-500/15 blur-3xl' />
          </div>

          <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24'>
            <div className='grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 items-center'>
              {/* Left: Text */}
              <div className='space-y-6'>
                <Badge className='bg-white/10 text-xs uppercase tracking-[0.2em] border border-white/15 text-white/80 rounded-full px-3 py-1'>
                  Constant Fares. Consitent Care.
                </Badge>
                <h1 className='text-3.5xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight'>
                  The intercity{' '}
                  <span className='inline-block bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent'>
                    commute you've
                  </span>
                  <br className='hidden sm:block' /> been waiting for.
                </h1>

                <p className='text-base sm:text-lg text-white/60 max-w-xl'>
                  Premium intercity travel with guaranteed seats, live tracking,
                  and transparent pricing. Starting with daily rides between
                  Gurugram and Agra — more routes coming soon.
                </p>

                <div className='flex flex-col sm:flex-row gap-3 sm:items-center'>
                  {isAuthenticated ? (
                    <Link to='/booking'>
                      <Button className='group bg-white text-black hover:bg-zinc-100 px-6 py-5 text-base rounded-full shadow-lg shadow-emerald-500/15'>
                        Book your first ride
                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                      </Button>
                    </Link>
                  ) : (
                    <Link to='/login'>
                      <Button className='group bg-white text-black hover:bg-zinc-100 px-6 py-5 text-base rounded-full shadow-lg shadow-emerald-500/15'>
                        Book your first ride
                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                      </Button>
                    </Link>
                  )}
                  <div className='flex items-center gap-2 text-xs sm:text-sm text-white/60'>
                    <div className='flex -space-x-2'>
                      {/* <div className="h-7 w-7 rounded-full border border-black bg-emerald-500/80" />
                      <div className="h-7 w-7 rounded-full border border-black bg-lime-400/80" />
                      <div className="h-7 w-7 rounded-full border border-black bg-white/80" /> */}
                    </div>
                    {/* <span>See how it works</span> */}
                  </div>
                </div>

                {/* Stats */}
                {/* <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md pt-6">
                  {STATS.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4 backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:border-emerald-400/60"
                    >
                      <div className="text-sm text-white/50">{item.label}</div>
                      <div className="mt-1 text-lg sm:text-xl font-semibold">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>

              {/* Right: Image + card */}
              <div className='space-y-4 lg:space-y-6'>
                <div className='relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 to-black shadow-2xl shadow-black/60'>
                  <img
                    src={heroImage}
                    alt='CapsuleCabs'
                    className='h-64 sm:h-72 w-full object-cover opacity-90 scale-105 transition-transform duration-700 hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />
                  <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs sm:text-sm text-white'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Car className='h-4 w-4 text-emerald-400' />
                        <span className='font-medium'>Gurugram → Agra</span>
                      </div>
                      <p className='text-white/60'>
                        Live seat availability · Smart pickup points
                      </p>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      <span className='inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs'>
                        <Star className='h-3 w-3 mr-1 text-emerald-300' />
                        4.8 rating
                      </span>
                      <span className='text-[11px] text-white/60'>
                        Avg. commute saved: 18 min
                      </span>
                    </div>
                  </div>
                </div>

                <Card className='bg-white/5 border-white/10 backdrop-blur-sm text-white'>
                  <CardContent className='flex items-center justify-between gap-4 py-4 px-4 sm:px-5'>
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center'>
                        <Smartphone className='h-5 w-5 text-emerald-300' />
                      </div>
                      <div>
                        <p className='text-xs uppercase tracking-[0.18em] text-white/50'>
                          Live seat map
                        </p>
                        <p className='text-sm text-white/80'>
                          Lock your seat before you even start.
                        </p>
                      </div>
                    </div>
                    {isAuthenticated ? (
                      <Link to='/booking'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-white/20 bg-transparent text-white hover:bg-white hover:text-black rounded-full'
                        >
                          Start now
                        </Button>
                      </Link>
                    ) : (
                      <Link to='/login'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-white/20 bg-transparent text-white hover:bg-white hover:text-black rounded-full'
                        >
                          Start now
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id='features'
          className='border-t border-white/5 bg-gradient-to-b from-black to-zinc-950 py-1 sm:py-12'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8'>
              <div>
                <span className='text-xs uppercase tracking-wider text-white/50'>
                  How we're different
                </span>
                <h2 className='text-2xl sm:text-3xl font-semibold tracking-tight'>
                  Built for daily riders.
                </h2>
                <p className='mt-2 text-sm sm:text-base text-white/60 max-w-xl'>
                  We designed CapsuleCabs for real people who commute
                  frequently. No clutter, just the things you need—fast and
                  fluid.
                </p>
              </div>
              <Badge className='bg-white/10 text-white/70 border border-white/15 rounded-full px-3 py-1'>
                Live beta · New routes coming soon
              </Badge>
            </div>

            <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className='group text-color-white bg-white/5 border-white/10 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20'
                >
                  <CardContent className='pt-4 pb-5 px-4 space-y-3'>
                    <div className='h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-500/25 transition-colors'>
                      <feature.icon className='h-4 w-4' />
                    </div>
                    <div className='space-y-1'>
                      <h3 className='text-sm font-medium'>{feature.title}</h3>
                      <p className='text-xs sm:text-sm text-white/60 leading-relaxed'>
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        {/* <section
          id="how-it-works"
          className="border-t border-white/5 bg-black py-12 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Book in four smooth steps.
                </h2>
                <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">
                  A booking flow designed to be fast on mobile and desktop
                  alike—no unnecessary fields or friction.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-white/20 text-black hover:bg-white hover:text-black rounded-full"
                asChild
              >
                {isAuthenticated ? (
                  <Link to="/booking">
                    Try the booking flow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <Link to="/login">
                    Try the booking flow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {STEPS.map((item, index) => (
                <Card
                  key={item.step}
                  className="bg-white/5 border-white/10 overflow-hidden group"
                >
                  <CardContent className="px-4 py-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="font-mono text-[11px]">
                        Step {item.step}
                      </span>
                      <span className="h-1.5 w-8 rounded-full bg-emerald-400/60 group-hover:w-10 transition-all" />
                    </div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section> */}

        {/* Testimonials */}
        <section
          id='testimonials'
          className='border-t border-white/5 bg-gradient-to-b from-black to-zinc-950 py-12 sm:py-16'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8'>
              <div>
                <h2 className='text-2xl sm:text-3xl font-semibold tracking-tight'>
                  Loved by Surveyee.
                </h2>
                <p className='mt-2 text-sm sm:text-base text-white/60 max-w-xl'>
                  Early riders are already rethinking intercity travel with
                  CapsuleCabs.
                </p>
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-4 sm:gap-5'>
              {TESTIMONIALS.map((t) => (
                <Card
                  key={t.name}
                  className='bg-white/5 text-color-white border-white/10 relative overflow-hidden'
                >
                  <div className='pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl' />
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center justify-between text-base'>
                      <span>{t.name}</span>
                      <span className='flex items-center gap-1 text-xs text-emerald-300'>
                        <Star className='h-3 w-3 fill-emerald-300 text-emerald-300' />
                        4.8
                      </span>
                    </CardTitle>
                    <p className='text-xs text-white/50'>{t.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-white/70 leading-relaxed'>
                      “{t.comment}”
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <AboutUs />
      </main>

      <Footer />

      {/* Bottom Nav on mobile (optional) */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-white/60'>
          <span>CapsuleCabs · Smart commute</span>
          <Link to='/booking'>
            <Button
              size='sm'
              className='bg-white text-black hover:bg-zinc-100 rounded-full'
            >
              Book now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Index
