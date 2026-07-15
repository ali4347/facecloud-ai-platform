import React from 'react';
import './MacBookDemoFrame.css';

type MacBookDemoFrameProps = {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  ariaLabel?: string;
};

export default function MacBookDemoFrame({
  children,
  className = '',
  screenClassName = '',
  ariaLabel = 'FaceCloud enhancement demo displayed in a premium laptop screen',
}: MacBookDemoFrameProps) {
  return (
    <div className={`fc-macbook ${className}`}>
      {/* Laptop Upper Display Lid */}
      <div
        className="fc-macbook__display-shell"
        role="group"
        aria-label={ariaLabel}
      >
        {/* Metal highlights around the outer lid edge */}
        <div className="fc-macbook__outer-highlight" aria-hidden="true" />

        {/* Outer dark bezel border */}
        <div className="fc-macbook__bezel">
          {/* Subtle camera indicators at the top */}
          <div className="fc-macbook__camera" aria-hidden="true">
            <span className="fc-macbook__camera-lens" />
          </div>

          {/* Screen viewport housing actual child element */}
          <div className={`fc-macbook__screen ${screenClassName}`}>
            {children}

            {/* Glossy non-interactive glass overlays */}
            <div
              className="fc-macbook__screen-reflection"
              aria-hidden="true"
            />
            <div
              className="fc-macbook__screen-vignette"
              aria-hidden="true"
            />
          </div>

          {/* Lower bezel chin */}
          <div className="fc-macbook__chin" aria-hidden="true">
            <span className="fc-macbook__chin-mark" />
          </div>
        </div>
      </div>

      {/* Screen connecting hinge */}
      <div className="fc-macbook__hinge" aria-hidden="true" />

      {/* Laptop Bottom Aluminum Base Deck */}
      <div className="fc-macbook__base" aria-hidden="true">
        <div className="fc-macbook__base-highlight" />
        <div className="fc-macbook__trackpad-hint" />
        <div className="fc-macbook__front-lip" />
      </div>

      {/* Shadow underneath laptop base */}
      <div className="fc-macbook__floor-shadow" aria-hidden="true" />
    </div>
  );
}
