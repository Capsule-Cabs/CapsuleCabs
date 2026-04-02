import { Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from 'lucide-react'

interface FooterProps {
  Link?: any // React Router Link component passed as prop
}

export const Footer = ({ Link }: FooterProps) => {
  // Fallback to anchor tag if Link is not provided
  const LinkComponent = Link || 'a'

  return (
    <footer className='border-t border-white/5 bg-black'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Main Footer Content */}
        <div className='py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Brand Column */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-lime-300' />
              <span className='text-lg font-bold text-white'>CapsuleCabs</span>
            </div>
            <p className='text-sm text-white/60 leading-relaxed mb-4'>
              Premium intercity commute reimagined. Guaranteed seats,
              transparent pricing, and stress-free travel.
            </p>
            <div className='flex items-center gap-3'>
              <a
                href='https://twitter.com/capsulecabs'
                target='_blank'
                rel='noopener noreferrer'
                className='h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-emerald-300 hover:border-emerald-400/60 transition-all'
              >
                <Twitter className='h-4 w-4' />
              </a>
              <a
                href='https://linkedin.com/company/capsulecabs'
                target='_blank'
                rel='noopener noreferrer'
                className='h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-emerald-300 hover:border-emerald-400/60 transition-all'
              >
                <Linkedin className='h-4 w-4' />
              </a>
              <a
                href='https://instagram.com/capsulecabs'
                target='_blank'
                rel='noopener noreferrer'
                className='h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-emerald-300 hover:border-emerald-400/60 transition-all'
              >
                <Instagram className='h-4 w-4' />
              </a>
              <a
                href='mailto:hello@capsulecabs.com'
                className='h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-emerald-300 hover:border-emerald-400/60 transition-all'
              >
                <Mail className='h-4 w-4' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider text-white'>
              Quick Links
            </h3>
            <ul className='space-y-3'>
              <li>
                <LinkComponent
                  to='/booking'
                  href='/booking'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Book a Ride
                </LinkComponent>
              </li>
              <li>
                <a
                  href='#features'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href='#about'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider text-white'>
              Support
            </h3>
            <ul className='space-y-3'>
              <li>
                <LinkComponent
                  to='/terms'
                  href='/terms'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Terms of Service
                </LinkComponent>
              </li>
              <li>
                <LinkComponent
                  to='/privacy-policy'
                  href='/privacy-policy'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Privacy Policy
                </LinkComponent>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider text-white'>
              Contact
            </h3>
            <ul className='space-y-3'>
              <li className='flex items-start gap-2 text-sm text-white/60'>
                <MapPin className='h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-300' />
                <span>
                  28, Jorawar Nagar, Balaji Puram, Shahganj, Agra
                  <br />
                  Uttar Pradesh 282010
                </span>
              </li>
              <li className='flex items-center gap-2 text-sm text-white/60'>
                <Phone className='h-4 w-4 flex-shrink-0 text-emerald-300' />
                <a
                  href='tel:+919719226535'
                  className='hover:text-emerald-300 transition-colors'
                >
                  +919719226535
                </a>
              </li>
              <li className='flex items-center gap-2 text-sm text-white/60'>
                <Mail className='h-4 w-4 flex-shrink-0 text-emerald-300' />
                <a
                  href='mailto:capsulecabs@gmail.com'
                  className='hover:text-emerald-300 transition-colors'
                >
                  capsulecabs@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-t border-white/5 py-8 pb-20 lg:pb-8'>
          <div className='flex flex-col lg:flex-row items-center justify-between gap-8'>
            {/* Left Side Info */}
            <div className='flex flex-col gap-2 items-center lg:items-start'>
              <p className='text-xs text-white/40'>
                © 2026 CapsuleCabs. All rights reserved.
              </p>
              <div className='flex items-center gap-2 text-xs font-medium text-emerald-400/80'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse' />
                Now live: Gurugram ↔ Agra
              </div>
            </div>

            {/* Right Side Apps - Forces single row on all screens */}
            <div className='flex flex-row items-center justify-center gap-3 sm:gap-4'>
              {/* Google Play Button */}
              <div className='group relative'>
                <div className='flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 transition-all cursor-default'>
                  <svg className='h-5 w-5 sm:h-6 sm:w-6' viewBox='0 0 24 24'>
                    <path fill='#4285F4' d='M3,20.5V3.5C3,2.9 3.5,2.4 4,2.6L18.5,11.1C19.1,11.5 19.1,12.5 18.5,12.9L4,21.4C3.5,21.6 3,21.1 3,20.5Z' />
                    <path fill='#34A853' d='M10,12l8.5,8.5c0.6,0.4,1.1-0.1,0.6-0.6L10,12z' />
                    <path fill='#FBBC05' d='M10,12L3.5,5.5c-0.4-0.6,0.1-1.1,0.6-0.6L10,12z' />
                    <path fill='#EA4335' d='M10,12L4,2.6C3.5,2.4,3,2.9,3,3.5L10,12z' />
                  </svg>
                  <div className='flex flex-col items-start'>
                    <span className='text-[8px] sm:text-[10px] text-white/40 uppercase font-bold tracking-tighter leading-none'>Get it on</span>
                    <span className='text-xs sm:text-sm text-white font-semibold leading-tight'>Google Play</span>
                  </div>
                </div>
                <span className='absolute -top-1.5 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-full border border-black uppercase'>
                  Soon
                </span>
              </div>

              {/* App Store Button */}
              <div className='group relative'>
                <div className='flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 transition-all cursor-default'>
                  <svg className='h-5 w-5 sm:h-6 sm:w-6 fill-white' viewBox='0 0 24 24'>
                    <path d='M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z' />
                  </svg>
                  <div className='flex flex-col items-start'>
                    <span className='text-[8px] sm:text-[10px] text-white/40 uppercase font-bold tracking-tighter leading-none'>Download on the</span>
                    <span className='text-xs sm:text-sm text-white font-semibold leading-tight'>App Store</span>
                  </div>
                </div>
                <span className='absolute -top-1.5 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-full border border-black uppercase'>
                  Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}