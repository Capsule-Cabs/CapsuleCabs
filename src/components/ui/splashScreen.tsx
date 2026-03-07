import React from 'react';
import SplashVideo from '../../assets/splash.webm'

export const LoadingSplash: React.FC = () => (
  <div className='fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500'>
    <div className='w-64 h-64 md:w-80 md:h-80 flex items-center justify-center overflow-hidden'>
      <video
        autoPlay
        loop
        muted
        playsInline
        className='w-full h-full object-contain'
      >
        {/* Use absolute path if file is in public/splash.webm */}
        <source src={SplashVideo} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>

    <div className='mt-4 text-center space-y-2'>
      <h3 className='text-2xl font-black text-white tracking-tighter animate-pulse'>
        FINDING YOUR RIDE...
      </h3>
      <p className='text-xs text-emerald-500 font-bold uppercase tracking-widest'>
        Searching for the best available cabs
      </p>
    </div>

    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
  </div>
);