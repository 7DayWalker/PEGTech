/**
 * Looping ambient background video for the hero — a procedurally generated,
 * seamlessly-looping animation (pulsing network nodes + faint scrolling code)
 * in the PEGTech brand blue→red gradient. Uses mix-blend-screen so the video's
 * near-black background disappears into the page, leaving only the glowing
 * network/code accents visible — no visible video "frame" or seams.
 */
export function HeroVideoBackground() {
  return (
    <video
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-screen"
      autoPlay
      loop
      muted
      playsInline
      poster="/videos/hero-bg-poster.jpg"
      aria-hidden="true"
    >
      <source src="/videos/hero-bg-loop.mp4" type="video/mp4" />
    </video>
  );
}
