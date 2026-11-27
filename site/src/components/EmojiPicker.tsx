/** Lightweight emoji picker popover — a curated grid, no external
 * dependency needed. Click an emoji to insert it via onSelect. */
import { useEffect, useRef } from "react";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉", "😎", "🤔",
  "😢", "😭", "😡", "😱", "🥳", "🙏", "👍", "👎", "👏", "🙌",
  "💪", "🤝", "👋", "✌️", "🤞", "❤️", "🔥", "✨", "🎉", "🎯",
  "✅", "❌", "⚠️", "⏰", "📅", "📌", "📎", "📷", "🎥", "📄",
  "💰", "💼", "📈", "📉", "🚀", "💡", "⭐", "🙂", "😅", "🤷",
];

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-20 w-64 max-h-48 overflow-y-auto grid grid-cols-8 gap-1 p-2 rounded-xl border border-white/10 bg-dark-800 shadow-xl"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="text-lg hover:bg-white/10 rounded-md p-1 transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
