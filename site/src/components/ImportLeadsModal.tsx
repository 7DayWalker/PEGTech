/**
 * Bulk-import leads from a research spreadsheet (CSV/XLSX) instead of
 * entering local businesses one at a time — the primary top-of-funnel
 * alongside (or instead of) paid ad campaigns.
 */
import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { uploadFile } from "../lib/api";
import { useToast } from "../lib/Toast";

type ImportResult = {
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  warnings: { row: number; business_name?: string | null; message: string }[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Called once an import completes successfully, so the caller can
   * refetch the leads list. */
  onImported: () => void;
};

const TEMPLATE_CSV =
  "Business Name,Contact Name,Phone,Email,Website,Address,City,State,Country,Service,Score,Source,Notes\n" +
  'Example Plumbing Co,John Doe,+1 555 123 4567,,,123 Main St,Austin,TX,US,Plumbing,WARM,Local research,"No website found — good candidate"\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pegtech_leads_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportLeadsModal({ isOpen, onClose, onImported }: Props) {
  const { show } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setUploading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function handleImport() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadFile("/api/admin/leads/import", file);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setResult(data);
        onImported();
        show(`Import complete — ${data.created} created, ${data.updated} enriched.`, "success");
      } else {
        setError(data?.detail || "Import failed — check the file and try again.");
      }
    } catch {
      setError("Network error — couldn't upload the file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads from Spreadsheet" size="md">
      <div className="space-y-4">
        {!result && (
          <>
            <p className="text-sm text-gray-400">
              Upload a CSV or Excel file of researched businesses and we'll populate the Leads pipeline
              automatically. Column headers are matched loosely — common names like "Business", "Phone",
              "Email", "City" etc. all work. Re-uploading an updated sheet is safe: matching rows enrich
              existing leads instead of creating duplicates.
            </p>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-gemini-blue hover:text-white transition-colors"
            >
              <Download size={13} /> Download a starter template (CSV)
            </button>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center cursor-pointer hover:border-gemini-purple/40 hover:bg-white/[0.04] transition-colors"
            >
              {file ? (
                <>
                  <FileSpreadsheet size={28} className="text-gemini-blue" />
                  <p className="text-sm text-white font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)}KB — click to change</p>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-gray-500" />
                  <p className="text-sm text-gray-300">Click to browse, or drag a file here</p>
                  <p className="text-xs text-gray-600">.csv, .xlsx — up to 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xlsm,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handlePickFile}
              />
            </div>

            {error && (
              <p className="flex items-start gap-1.5 text-xs text-amber-400">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} size="sm">Cancel</Button>
              <Button onClick={handleImport} disabled={!file || uploading} size="sm">
                {uploading ? "Importing…" : "Upload & Import"}
              </Button>
            </div>
          </>
        )}

        {result && (
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              <div className="text-sm text-gray-200">
                Processed {result.total_rows} row{result.total_rows === 1 ? "" : "s"} —{" "}
                <span className="text-emerald-400 font-medium">{result.created} new lead{result.created === 1 ? "" : "s"}</span>,{" "}
                <span className="text-gemini-blue font-medium">{result.updated} enriched</span>
                {result.skipped > 0 && (
                  <>, <span className="text-amber-400 font-medium">{result.skipped} skipped</span></>
                )}
                .
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-medium text-gray-400 mb-1">Heads up:</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-gray-500">
                    Row {w.row}{w.business_name ? ` (${w.business_name})` : ""} — {w.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset} size="sm">Import another file</Button>
              <Button onClick={handleClose} size="sm">
                <X size={14} /> Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
