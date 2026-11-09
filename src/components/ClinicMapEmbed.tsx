import React from 'react';
import { MapPin, ArrowUpRight } from 'lucide-react';

export const CLINIC_ADDRESS_DEFAULT = '1849, Sector 80, Mohali, Punjab 160062, India';

interface ClinicMapEmbedProps {
  address?: string;
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * Standard, lightweight Google Maps embed for N7 Aesthetics Clinic Coordination.
 * - Standard LIGHT roadmap appearance (t=m) with no dark mode CSS filter hacks.
 * - Rounded corners (14px) and warm champagne / ivory borders.
 * - Compact responsive height (170px mobile, 190px tablet/desktop).
 * - Clearly pinpoints 1849, Sector 80, Mohali with standard red pin marker.
 * - Preserves Google Maps official attribution, terms, and branding without overlays.
 * - Includes direct "Get Directions" navigation action.
 */
export function ClinicMapEmbed({
  address = CLINIC_ADDRESS_DEFAULT,
  variant = 'dark',
  className = '',
}: ClinicMapEmbedProps) {
  // Use clinic address if valid, otherwise fallback to confirmed location
  const cleanAddress =
    address && !address.includes('[') && address.trim().length > 0
      ? address.trim()
      : CLINIC_ADDRESS_DEFAULT;

  const encodedQuery = encodeURIComponent(cleanAddress);
  // Standard Google Maps light roadmap embed (t=m, z=16, iwloc=near for red pin focus)
  const embedSrc = `https://maps.google.com/maps?q=${encodedQuery}&t=m&z=16&output=embed&iwloc=near`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;

  const isDark = variant === 'dark';

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-medium tracking-wide uppercase text-[10px] ${
            isDark ? 'text-[#E6CDB5]/75' : 'text-[#30251F]/70'
          }`}
        >
          <MapPin className="w-3 h-3 text-[#BA9876] shrink-0" />
          <span>Interactive Location</span>
        </span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get directions to N7 Aesthetics at 1849, Sector 80, Mohali on Google Maps"
          className={`inline-flex items-center gap-1 font-medium transition-colors ${
            isDark
              ? 'text-[#E6CDB5] hover:text-[#FFFFFF]'
              : 'text-[#30251F] hover:text-[#211A17]'
          }`}
        >
          <span>Get Directions</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>

      <div
        className={`relative w-full h-[170px] sm:h-[190px] rounded-[14px] overflow-hidden bg-[#FAF5F0] transition-shadow ${
          isDark
            ? 'border border-[#E6CDB5]/25 shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
            : 'border border-[#30251F]/15 shadow-[0_2px_10px_rgba(48,37,31,0.06)]'
        }`}
      >
        <iframe
          title="N7 Aesthetics Clinic Location - 1849, Sector 80, Mohali"
          src={embedSrc}
          width="100%"
          height="100%"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label="Google Map showing N7 Aesthetics at 1849, Sector 80, Mohali, Punjab"
          className="w-full h-full border-0 rounded-[14px]"
          style={{
            // Keep native light appearance, zero inversion, zero filter hacks
            filter: 'none',
          }}
        />
      </div>
    </div>
  );
}
