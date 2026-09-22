'use client';

import { useEffect, useRef } from 'react';

export default function VideoBlock() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React doesn't reliably output the `muted` attribute, which can block autoplay on iOS
    video.muted = true;
    video.defaultMuted = true;

    // Swap to a mobile poster (the poster attribute accepts only one URL)
    if (window.matchMedia('(max-width: 768px)').matches) {
      video.poster = '/m_BoatHero@2x.jpg';
    }

    // Respect reduced-motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
      video.controls = true;
    } else {
      video.play().catch(() => {
        /* Autoplay blocked; the poster remains visible */
      });
    }
  }, []);

  return (
    <figure className="video-block">
      <video
        ref={videoRef}
        className="video-block__media"
        width={1920}
        height={1080}
        poster="/d_BoatHero@2x.jpg"
        preload="metadata"
        playsInline
        muted
        autoPlay
        loop
        aria-label="Video desc"
      >
        {/* Mobile first: the first matching <source> wins, so order matters */}
        { /* }
        <source
          src="/media/hero-mobile.webm"
          type='video/webm; codecs="vp9"'
          media="(max-width: 767px)"
        />
        { */ }
        <source
          src="/boat-video.mp4"
          type="video/mp4"
          media="(max-width: 768px)"
        />

        {/* Desktop (no media attribute = default for everything else) */}
        {/* <source src="/hero-desktop.webm" type='video/webm; codecs="vp9"' /> */}
        <source src="/boat-video.mp4" type="video/mp4" />

        {/* Fallback for browsers that can't play video at all */}
        <picture>
          <source media="(max-width: 768px)" srcSet="/m_BoatHero@2x.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/hero-poster-desktop.jpg"
            width={1400}
            height={700}
            alt="Image desc"
            loading="lazy"
          />
        </picture>
      </video>
    </figure>
  );
}