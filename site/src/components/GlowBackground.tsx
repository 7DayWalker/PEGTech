/** Ambient gradient glow orbs — Gemini blue/purple/pink, floating behind content. */
export function GlowBackground({ variant = "default" }: { variant?: "default" | "hero" }) {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb w-[500px] h-[500px] bg-gemini-blue -top-20 -left-40 animate-float" />
        <div className="glow-orb w-[450px] h-[450px] bg-gemini-pink top-0 -right-40 animate-float-delayed" />
        <div className="glow-orb w-[400px] h-[400px] bg-gemini-purple top-1/3 left-1/3 opacity-20 animate-float" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="glow-orb w-[400px] h-[400px] bg-gemini-purple opacity-20 top-1/4 -left-20" />
      <div className="glow-orb w-[350px] h-[350px] bg-gemini-blue opacity-20 bottom-0 -right-20" />
    </div>
  );
}
