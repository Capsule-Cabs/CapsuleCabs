import { Navigation } from '@/components/ui/navigation'
import { ArrowLeft } from 'lucide-react'
import React from 'react'

const sections = [
  {
    title: '1. Introduction',
    content: (
      <>
        <p>
          Welcome to <strong>Capsule Cabs</strong>. These Terms and Conditions
          govern your access to and use of our website, mobile application, and
          intercity cab transportation services.
        </p>
        <p>
          By accessing or using our services, you agree to be bound by these
          Terms. If you do not agree, you must not use the platform.
        </p>
      </>
    ),
  },
  {
    title: '2. About Capsule Cabs',
    content: (
      <p>
        Capsule Cabs is a technology-enabled intercity travel platform that
        <strong> owns and operates its fleet of vehicles</strong>. We provide
        scheduled and on-demand cab services for travel between cities, offering
        a comfortable and reliable alternative to intercity buses.
      </p>
    ),
  },
  {
    title: '3. Definitions',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>
          <strong>“Platform”</strong> refers to capsulecabs.com and related
          applications.
        </li>
        <li>
          <strong>“Service”</strong> refers to intercity cab transportation
          provided by Capsule Cabs.
        </li>
        <li>
          <strong>“User”</strong> means any individual who books or uses the
          service.
        </li>
        <li>
          <strong>“Booking”</strong> means a confirmed trip between two or more
          cities.
        </li>
      </ul>
    ),
  },
  {
    title: '4. Nature of Service',
    content: (
      <p>
        Capsule Cabs provides point-to-point intercity transportation using its
        own fleet and trained drivers. Services may be shared or private,
        depending on availability and booking selection.
      </p>
    ),
  },
  {
    title: '5. Bookings & Payments',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>Bookings must be made through the Capsule Cabs platform.</li>
        <li>
          Fares are displayed at the time of booking and are subject to route,
          distance, timing, and seat availability.
        </li>
        <li>
          Prices may include tolls, driver charges, and operational costs.
        </li>
        <li>
          Payments may be made via UPI, cards, wallets, net banking, or other
          supported methods.
        </li>
      </ul>
    ),
  },
  {
    title: '6. Scheduling & Delays',
    content: (
      <p>
        While Capsule Cabs aims to maintain accurate schedules, departure or
        arrival times may vary due to traffic, weather conditions, road
        closures, or other unforeseen circumstances.
      </p>
    ),
  },
  {
    title: '7. Cancellations & Refunds',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>
          Cancellation charges may apply based on the time of cancellation
          before departure.
        </li>
        <li>
          Cancellation charge of ticket done in less than 8 hours from Boarding
          Point departure time is 100% and refund of 0%.
        </li>
        <li>
          Cancellation charge of tickets done before 8 hours and in less than 12
          hours from Boarding Point departure time is 50% and refund of 50%.
        </li>
        <li>
          Cancellation charge of tickets done before 12 hrs from Boarding Point
          departure time is 25% and refund of 75%.
        </li>

        <li>
          Eligible refunds will be processed to the original payment method.
        </li>
      </ul>
    ),
  },
  {
    title: '8. Passenger Responsibilities',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>Arrive at the pickup point on time.</li>
        <li>Show valid identification if required.</li>
        <li>
          Maintain respectful behavior towards staff and fellow passengers.
        </li>
        <li>
          Smoking, alcohol, or illegal substances are strictly prohibited inside
          the vehicle and will consider an offence.
        </li>
      </ul>
    ),
  },
  {
    title: '9. Safety & Conduct',
    content: (
      <p>
        Capsule Cabs reserves the right to deny boarding or terminate a journey
        if a passenger’s behavior compromises safety, comfort, or legal
        compliance.
      </p>
    ),
  },
  {
    title: '10. Luggage & Personal Belongings',
    content: (
      <p>
        Passengers are responsible for their personal belongings. Capsule Cabs
        shall not be liable for loss, theft, or damage unless caused by proven
        negligence.
      </p>
    ),
  },
  {
    title: '12. Limitation of Liability',
    content: (
      <p>
        Capsule Cabs shall not be liable for delays, cancellations, or service
        interruptions caused by events beyond reasonable control, including
        natural disasters, strikes, or government actions.
      </p>
    ),
  },
  {
    title: '13. Intellectual Property',
    content: (
      <p>
        All platform content, branding, and software are the exclusive property
        of Capsule Cabs and may not be used without prior written permission.
      </p>
    ),
  },
  {
    title: '11. Modifications to Terms',
    content: (
      <p>
        Capsule Cabs reserves the right to modify these Terms at any time.
        Continued use of the service constitutes acceptance of updated Terms.
      </p>
    ),
  },
  {
    title: '12. Governing Law',
    content: (
      <p>
        These Terms shall be governed by the laws of India. Any disputes shall
        be subject to the exclusive jurisdiction of courts in India.
      </p>
    ),
  },
  {
    title: '13. Contact Information',
    content: (
      <p>
        For queries or concerns, contact us at{' '}
        <a
          href='mailto:support@capsulecabs.com'
          className='text-primary underline'
        >
          support@capsulecabs.com
        </a>
      </p>
    ),
  },
]

const Terms = () => {
  return (
    <div className='min-h-screen bg-[#0b0f14] text-white'>
      {/* Header */}
      <div className='border-b border-white/5 bg-black/80 backdrop-blur-sm sticky top-0 z-40'>
        <Navigation />
      </div>
      <div className='border-b border-white/10'>
        <div className='mx-auto max-w-5xl px-4 pt-4'>
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className='inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition'
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div className='mx-auto max-w-5xl px-4 pb-6 text-center'>
          <h1 className='text-3xl sm:text-4xl font-semibold'>
            Terms & Conditions
          </h1>
          <p className='mt-4 text-white/70 max-w-2xl mx-auto'>
            Intercity travel made comfortable, reliable, and transparent.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto max-w-5xl px-4 py-12 space-y-10'>
        {sections.map((section, index) => (
          <section key={index} className='space-y-3'>
            <h2 className='text-xl sm:text-2xl font-medium'>{section.title}</h2>
            <div className='text-white/80 leading-relaxed space-y-3'>
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default Terms
