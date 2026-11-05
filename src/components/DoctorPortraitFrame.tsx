import React, { useState } from 'react';
import { useCms } from '../context/CmsContext';

interface DoctorPortraitFrameProps {
  className?: string;
}

const APPROVED_DOCTOR_PORTRAIT = '/images/dr-navjot-singh-premium.png';

export function DoctorPortraitFrame({ className = '' }: DoctorPortraitFrameProps) {
  const { settings } = useCms();
  const [imageError, setImageError] = useState(false);

  const portraitSrc =
    !settings.doctorPortraitUrl ||
    settings.doctorPortraitUrl.includes('NcUyALnbrKfnL1') ||
    settings.doctorPortraitUrl.includes('doctor-portrait') ||
    settings.doctorPortraitUrl === '/images/dr-navjot-singh.png' ||
    settings.doctorPortraitUrl.includes('ChatGPT_Image')
      ? APPROVED_DOCTOR_PORTRAIT
      : settings.doctorPortraitUrl;

  return (
    <div
      className={`relative w-full max-w-[345px] mx-auto h-[380px] sm:h-[395px] bg-transparent overflow-hidden flex items-end justify-center ${className}`}
    >
      {!imageError && portraitSrc ? (
        <img
          src={portraitSrc}
          alt={`${settings.doctorName} — ${settings.doctorRole}`}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-[center_top] select-none"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <p className="font-heading text-2xl text-[#211A17] mt-1 font-medium">
            {settings.doctorName}
          </p>
          <p className="text-xs text-[#30251F]/80 mt-0.5">{settings.doctorRole}</p>
        </div>
      )}
    </div>
  );
}
