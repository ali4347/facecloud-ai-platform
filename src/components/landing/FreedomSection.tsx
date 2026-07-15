import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const HLS_SRC =
  'https://stream.mux.com/bnYL6x5cAX6WiJv2pOKpITehZd3NVdXpj3ylJFpX5Lk.m3u8';

const CROSS_ICON =
  'https://cdn.prod.website-files.com/6720dd1ab6df0da205830ab1/686cc0f520a992816d8b15dc_bullet-list-cross.svg';

const CHECK_ICON =
  'https://cdn.prod.website-files.com/6720dd1ab6df0da205830ab1/686cc068490683bbb3377d04_bullet-list.svg';

const negatives = [
  'Dark, blurry, or unusable images are often discovered too late',
  'Manual image review consumes time and delays processing workflows',
  'Scattered uploads make identity records difficult to organize',
  'Repeated quality checks create inconsistent approval decisions',
  'Originals, enhanced files, and reports become difficult to track',
];

const positives = [
  'Automated quality checks identify brightness, blur, and face-size issues',
  'Zero-DCE enhancement improves low-light facial images automatically',
  'Face embeddings organize matching identities into person folders',
  'One image can be assigned securely to every detected person folder',
  'Centralized logs, reports, and downloads keep every action traceable',
];

function HlsVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: false,
        maxMaxBufferLength: 60,
        enableWorker: true,
      });

      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.levels.length > 0) {
          hls.currentLevel = hls.levels.length - 1;
        }

        video.play().catch(() => {});
      });

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SRC;
      video.play().catch(() => {});
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      aria-label="FaceCloud AI processing visualization"
      style={{
        width: '160%',
        height: '160%',
        objectFit: 'cover',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export default function FreedomSection() {
  return (
    <section
      id="methodology"
      className="freedom-section w-full flex flex-col items-center select-none"
      style={{
        backgroundColor: '#ffffff',
        padding: 'clamp(48px, 6vw, 80px) clamp(16px, 3vw, 40px)',
        gap: '36px',
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-9 text-center">
        {/* Badge Pill */}
        <div
          className="flex items-center gap-2 text-lg font-medium rounded-full"
          style={{
            backgroundColor: 'rgb(249, 249, 249)',
            padding: 'clamp(10px, 0.9vw, 14px) clamp(14px, 1.25vw, 20px)',
            color: 'rgb(26, 11, 84)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Inline SVG for Badge */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m4.93 4.93 4.24 4.24" />
            <path d="m14.83 9.17 4.24-4.24" />
            <path d="m14.83 14.83 4.24 4.24" />
            <path d="m9.17 14.83-4.24 4.24" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', fontWeight: 500, letterSpacing: '0.05em' }}>Control</span>
        </div>

        {/* Heading */}
        <h2
          className="font-medium tracking-tight"
          style={{
            fontSize: 'clamp(32px, 4vw, 56px)',
            color: 'rgb(26, 11, 84)',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Stop absorbing image chaos.<br />
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, rgb(43,167,255), rgb(202,69,255) 50%, rgb(254,136,27))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              paddingBottom: '0.3vw',
              display: 'inline-block',
            }}
          >
            Run FaceCloud with confidence.
          </span>
        </h2>

        {/* Supporting sentence */}
        <p
          className="text-xs sm:text-sm md:text-base leading-relaxed max-w-[760px] mx-auto font-medium"
          style={{
            color: 'rgb(131, 121, 158)',
            lineHeight: 1.6,
          }}
        >
          FaceCloud transforms unstructured facial images into enhanced, validated, identity-grouped, and securely downloadable results.
        </p>
      </div>

      {/* Three-Column Layout */}
      <div
        className="w-full flex flex-col lg:grid"
        style={{
          gridTemplateColumns: 'minmax(250px, 26vw) minmax(220px, 1fr) minmax(250px, 26vw)',
          columnGap: '36px',
          rowGap: '24px',
          alignItems: 'center',
          padding: '0 clamp(0px, 2.92vw, 40px)',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Left Column: Negatives */}
        <div
          className="flex flex-col w-full"
          style={{
            gap: '12px',
          }}
        >
          {negatives.map((text, i) => (
            <div
              key={`neg-${i}`}
              className="flex flex-col w-full"
              style={{
                gap: '12px',
                padding: 'clamp(12px, 0.97vw, 16px) clamp(14px, 1.25vw, 20px)',
                borderRadius: '18px',
                backgroundColor: 'rgb(255,255,255)',
                boxShadow: '0 3px 9.1px #3f4a7e0d, 0 1px 29px #3f4a7e1a',
                border: '1px solid rgba(63, 74, 126, 0.05)',
              }}
            >
              <img
                src={CROSS_ICON}
                alt=""
                aria-hidden="true"
                style={{
                  width: 'clamp(16px, 1.25vw, 20px)',
                  height: 'auto',
                }}
              />
              <span
                style={{
                  fontSize: 'clamp(13px, 1.15vw, 17px)',
                  color: 'rgb(131, 121, 158)',
                  lineHeight: 1.4,
                  fontWeight: 400,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Center Column: HlsVideo Circle */}
        <div
          className="flex items-center justify-center order-first lg:order-none"
          style={{
            alignSelf: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: '50%',
              overflow: 'hidden',
              width: 'clamp(200px, 22vw, 400px)',
              height: 'clamp(200px, 22vw, 400px)',
              flexShrink: 0,
              backgroundColor: '#140b2f',
              boxShadow: '0 24px 80px rgba(84, 62, 190, 0.18)',
              border: '1px solid rgba(65, 36, 142, 0.12)',
            }}
          >
            <HlsVideo />
          </div>
        </div>

        {/* Right Column: Positives */}
        <div
          className="flex flex-col w-full"
          style={{
            gap: '12px',
          }}
        >
          {positives.map((text, i) => (
            <div
              key={`pos-${i}`}
              className="flex flex-col w-full"
              style={{
                gap: '12px',
                padding: 'clamp(12px, 0.97vw, 16px) clamp(14px, 1.25vw, 20px)',
                borderRadius: '18px',
                backgroundColor: 'rgb(255,255,255)',
                boxShadow: '0 3px 9.1px #3f4a7e0d, 0 1px 29px #3f4a7e1a',
                border: '1px solid rgba(63, 74, 126, 0.05)',
              }}
            >
              <img
                src={CHECK_ICON}
                alt=""
                aria-hidden="true"
                style={{
                  width: 'clamp(16px, 1.25vw, 20px)',
                  height: 'auto',
                }}
              />
              <span
                style={{
                  fontSize: 'clamp(13px, 1.15vw, 17px)',
                  color: 'rgb(26, 11, 84)',
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
