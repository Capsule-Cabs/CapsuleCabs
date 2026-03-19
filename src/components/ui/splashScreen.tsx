import React from 'react'
import SplashVideo from '../../assets/LoadingCapsule.mp4'

export const LoadingSplash: React.FC = () => (
  <div className='fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500'>
    {/* Refined Video Container - Give it a distinct frame and place it in a visual hotspot */}
    <div className='relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center overflow-hidden'>
      <video
        autoPlay
        loop
        muted
        playsInline
        className='w-full h-full object-cover rounded-full'
      >
        <source src={SplashVideo} type='video/webm' />
        Your browser does not support the video tag.
      </video>
    </div>

    {/* Refined Text and Position (Hotspot 2) */}
    <div className='mt-8 text-center space-y-3 z-10'>
      <h3 className='text-3xl font-black text-white tracking-tighter animate-pulse'>
        FINDING YOUR RIDE...
      </h3>
      <p className='text-sm text-emerald-500 font-bold uppercase tracking-widest'>
        Searching for the best available cabs
      </p>
    </div>

    {/* Integrated Glow Effect */}
    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-10' />
  </div>
)
