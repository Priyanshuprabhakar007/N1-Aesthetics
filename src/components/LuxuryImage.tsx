import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackLabel?: string;
}

/**
 * Production-minded responsive <Image> component supporting priority LCP loading,
 * responsive sizes attribute, and graceful luxury fallback if an image is missing
 * or is an empty 0-byte placeholder.
 */
export function Image({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  fallbackLabel,
  className = '',
  ...rest
}: ImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#30251F] via-[#281E19] to-[#211A17] text-[#E6CDB5] p-6 text-center ${className}`}
      >
        <div className="w-12 h-12 rounded-full border border-[#BA9876]/40 flex items-center justify-center mb-3">
          <span className="font-heading text-lg tracking-wider text-[#E6CDB5]">N7</span>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#E6CDB5]/80">
          {fallbackLabel || 'Reserved Media Slot'}
        </p>
        <p className="mt-1.5 text-[11px] text-[#F5EEE8]/60 max-w-[22ch] leading-relaxed">
          Place approved asset at <code className="text-[#E6CDB5]/90">{src}</code>
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth === 0) {
          setHasError(true);
        }
      }}
      className={className}
      {...rest}
    />
  );
}
