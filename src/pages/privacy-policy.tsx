import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/ui/navigation'

const sections = [
  {
    title: '1. Introduction',
    content: (
      <p>
        Capsule Cabs (“we”, “us”, “our”) values your privacy and is committed to
        protecting your personal information. This Privacy Policy explains how
        we collect, use, disclose, and safeguard your data when you use our
        website, mobile application, or intercity cab services.
      </p>
    ),
  },
  {
    title: '2. Information We Collect',
    content: (
      <>
        <p className='font-medium'>Personal Information</p>
        <ul className='list-disc pl-5 space-y-2'>
          <li>Name, phone number, and email address</li>
          <li>Pickup and drop-off locations</li>
          <li>Payment and billing details</li>
          <li>Government-issued identification where required</li>
        </ul>

        <p className='font-medium mt-4'>Technical & Usage Information</p>
        <ul className='list-disc pl-5 space-y-2'>
          <li>IP address and device information</li>
          <li>Browser type and operating system</li>
          <li>Website and app usage data</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. How We Use Your Information',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>To provide and manage intercity cab bookings</li>
        <li>To process payments and send booking confirmations</li>
        <li>To communicate trip updates and customer support</li>
        <li>To improve safety, service quality, and platform performance</li>
        <li>To comply with legal and regulatory requirements</li>
      </ul>
    ),
  },
  {
    title: '4. Cookies & Tracking',
    content: (
      <p>
        We use cookies and similar technologies to enhance user experience,
        analyze usage patterns, and improve our services. You may control cookie
        preferences through your browser settings; however, disabling cookies
        may limit certain functionalities.
      </p>
    ),
  },
  {
    title: '5. Sharing of Information',
    content: (
      <>
        <p>
          We do not sell or rent your personal information. We may share data
          only with:
        </p>
        <ul className='list-disc pl-5 space-y-2'>
          <li>Payment gateways and banking partners</li>
          <li>Technology and analytics service providers</li>
          <li>Government or regulatory authorities when legally required</li>
        </ul>
      </>
    ),
  },
  {
    title: '6. Data Security',
    content: (
      <p>
        Capsule Cabs implements reasonable technical and organizational measures
        to protect your data from unauthorized access, loss, or misuse.
        Nevertheless, no digital system is completely secure, and we cannot
        guarantee absolute protection.
      </p>
    ),
  },
  {
    title: '7. Data Retention',
    content: (
      <p>
        We retain personal information only for as long as necessary to fulfill
        service obligations, comply with legal requirements, and resolve
        disputes.
      </p>
    ),
  },
  {
    title: '8. Your Rights',
    content: (
      <ul className='list-disc pl-5 space-y-2'>
        <li>Access the personal data we hold about you</li>
        <li>Request correction or deletion of your data</li>
        <li>Withdraw consent where applicable</li>
      </ul>
    ),
  },
  {
    title: '9. Children’s Privacy',
    content: (
      <p>
        Our services are not intended for individuals under 18 years of age. We
        do not knowingly collect personal information from minors.
      </p>
    ),
  },
  {
    title: '10. Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with an updated effective date.
      </p>
    ),
  },
  {
    title: '11. Contact Us',
    content: (
      <p>
        If you have questions or concerns about this Privacy Policy, please
        contact us at{' '}
        <a
          href='mailto:capsulecabs@gmail.com'
          className='text-primary underline'
        >
          capsulecabs@gmail.com
        </a>
      </p>
    ),
  },
]

const PrivacyPolicy = () => {
  return (
    <div className='min-h-screen bg-[#0b0f14] text-white'>
      {/* Header */}
      <div className='border-b border-white/5 bg-black/80 backdrop-blur-sm sticky top-0 z-40'>
        <Navigation />
      </div>
      <div className='border-b border-white/10'>
        <div className='mx-auto max-w-5xl px-4 py-6'>
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className='inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition'
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        <div className='mx-auto max-w-5xl px-4 pb-12 text-center'>
          <h1 className='text-3xl sm:text-4xl font-semibold'>Privacy Policy</h1>
          <p className='mt-4 text-white/70 max-w-2xl mx-auto'>
            Your privacy matters to us. Learn how Capsule Cabs protects your
            data.
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

export default PrivacyPolicy
