import { Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from 'lucide-react'

interface FooterProps {
  Link?: any // React Router Link component passed as prop
}

export const Footer = ({ Link }: FooterProps) => {
  // Fallback to anchor tag if Link is not provided
  const LinkComponent = Link || 'a'

  return (
    <footer className='border-t border-white/5 bg-black'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Main Footer Content */}
        <div className='py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Brand Column */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-lime-300' />
              <span className='text-lg font-bold'>CapsuleCabs</span>
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
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider'>
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
              <li>
                <LinkComponent
                  to='/faq'
                  href='/faq'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  FAQ
                </LinkComponent>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider'>
              Support
            </h3>
            <ul className='space-y-3'>
              <li>
                <LinkComponent
                  to='/help'
                  href='/help'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Help Center
                </LinkComponent>
              </li>
              <li>
                <LinkComponent
                  to='/safety'
                  href='/safety'
                  className='text-sm text-white/60 hover:text-emerald-300 transition-colors'
                >
                  Safety
                </LinkComponent>
              </li>
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
            <h3 className='text-sm font-semibold mb-4 uppercase tracking-wider'>
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
                  href='tel:+911234567890'
                  className='hover:text-emerald-300 transition-colors'
                >
                  +919719226535
                </a>
              </li>
              <li className='flex items-center gap-2 text-sm text-white/60'>
                <Mail className='h-4 w-4 flex-shrink-0 text-emerald-300' />
                <a
                  href='mailto:hello@capsulecabs.com'
                  className='hover:text-emerald-300 transition-colors'
                >
                  capsulecabs@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-t border-white/5 py-6'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <p className='text-xs text-white/50 text-center sm:text-left'>
              © 2026 CapsuleCabs. All rights reserved.
            </p>
            <div className='flex items-center gap-4'>
              <span className='inline-flex items-center gap-2 text-xs text-white/50'>
                <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
                Now live: Gurugram ↔ Agra
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
