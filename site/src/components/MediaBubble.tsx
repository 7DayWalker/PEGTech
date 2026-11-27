/** Renders a WhatsApp media attachment (image/video/audio/document) stored
 * server-side as a MediaAsset, inline in the Message Center history. */
import { FileText, Download } from "lucide-react";
import { mediaUrl } from "../lib/api";

type Props = {
  mediaId: number;
  mediaType: string | null | undefined;
};

export function MediaBubble({ mediaId, mediaType }: Props) {
  const url = mediaUrl(mediaId);

  if (mediaType === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={url} alt="attachment" className="max-h-48 rounded-lg border border-white/10 object-cover" />
      </a>
    );
  }
  if (mediaType === "video") {
    return (
      <video controls className="mt-1 max-h-48 rounded-lg border border-white/10">
        <source src={url} />
      </video>
    );
  }
  if (mediaType === "audio") {
    return (
      <audio controls className="mt-1 w-full h-9">
        <source src={url} />
      </audio>
    );
  }
  // document, sticker, or anything else — a simple download link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="mt-1 flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 underline w-fit"
    >
      <FileText size={14} /> Download attachment <Download size={12} />
    </a>
  );
}
