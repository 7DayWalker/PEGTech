/**
 * PREVIEW VARIANT — real stock footage (Pexels, free license: close-up of a
 * code editor / terminal in dark mode) trimmed to an 8s loop, darkened,
 * desaturated and softly blurred so it reads as ambient atmosphere behind
 * the hero text rather than a distracting, fully-legible screen recording.
 * A faint brand-gradient wash ties the cool blue syntax-highlighting into
 * the PEGTech blue→red palette.
 */
export function HeroVideoBackgroundStock() {
  return (
    <>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/hero-bg-stock-poster.jpg"
        aria-hidden="true"
      >
        <source src="/videos/hero-bg-stock-loop.mp4" type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0 bg-gemini-gradient opacity-[0.14] mix-blend-overlay"
        aria-hidden="true"
      />
    </>
  );
}
