import React from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  phone: string
  setPhone: (val: string) => void
  otp: string
  setOtp: (val: string) => void
  otpSent: boolean
  isLoading: boolean
  onSendOtp: () => void
  onVerifyOtp: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen, onClose, phone, setPhone, otp, setOtp, otpSent, isLoading, onSendOtp, onVerifyOtp
}) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl'>
      <div className='w-full max-w-sm p-8 bg-zinc-900 border border-white/10 rounded-3xl relative'>
        <button onClick={onClose} className='absolute top-4 right-4 text-white/30'><X /></button>
        <h2 className='text-2xl font-bold text-white mb-6'>Login to Continue</h2>
        
        <div className='space-y-4'>
          <input 
            type='tel' placeholder='Phone Number' value={phone} 
            onChange={e => setPhone(e.target.value)}
            disabled={otpSent}
            className='w-full bg-black border border-white/10 p-4 rounded-xl text-white' 
          />
          {otpSent && (
            <input 
              type='text' placeholder='Enter OTP' value={otp} 
              onChange={e => setOtp(e.target.value)}
              className='w-full bg-black border border-white/10 p-4 rounded-xl text-white animate-in slide-in-from-top-2' 
            />
          )}
          <Button 
            onClick={otpSent ? onVerifyOtp : onSendOtp} 
            disabled={isLoading}
            className='w-full h-14 bg-white text-black font-bold rounded-xl'
          >
            {isLoading ? <Loader2 className='animate-spin' /> : (otpSent ? 'Verify OTP' : 'Send OTP')}
          </Button>
        </div>
      </div>
    </div>
  )
}