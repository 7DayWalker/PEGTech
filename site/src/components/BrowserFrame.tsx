/** Realistic browser-chrome frame wrapping a product screenshot image. */
export function BrowserFrame({ src, alt, url = "app.pegtech.co" }: { src: string; alt: string; url?: string }) {
  return (
    <div className="browser-frame">
      <div className="browser-chrome">
        <div className="flex gap-1.5">
          <span className="browser-dot bg-red-500/70" />
          <span className="browser-dot bg-yellow-500/70" />
          <span className="browser-dot bg-green-500/70" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-full bg-white/5 text-xs text-slate-400 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {url}
          </div>
        </div>
      </div>
      <img src={src} alt={alt} className="w-full h-auto" />
    </div>
  );
}
