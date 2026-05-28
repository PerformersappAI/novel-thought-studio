import jsPDF from "jspdf";

export interface ScanPdfResult {
  title?: string | null;
  url?: string | null;
  source?: string | null;        // e.g. domain or platform
  mention_type?: string | null;
  found_at?: string | null;
  excerpt?: string | null;
}

export interface ScanPdfOptions {
  query?: string | null;
  scanType?: string;
  scannedAt?: Date;
  results: ScanPdfResult[];
}

const DISCLAIMER_LINES = [
  "This is an automated report of POTENTIAL matches identified by software.",
  "These results are unverified and may include false matches or unrelated",
  "parties. You must independently review each item before taking any action.",
  "This report does not constitute a legal determination of infringement.",
  "",
  "For your privacy, ClaimMyFace does NOT retain the findings of your scan.",
  "This data will disappear when you leave this page. If you want a record,",
  "download and save this PDF to your own device.",
];

function extractDomain(url?: string | null) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

/**
 * Build and trigger download of a scan report PDF entirely client-side.
 * The PDF is NEVER uploaded or persisted server-side — it lives only on the
 * user's device, in keeping with the no-retention promise.
 */
export function downloadScanPdf({
  query,
  scanType = "scan",
  scannedAt = new Date(),
  results,
}: ScanPdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ClaimMyFace Scan Report", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Scan type: ${scanType}`, margin, y);
  y += 5;
  if (query) {
    doc.text(`Query: ${query}`, margin, y);
    y += 5;
  }
  doc.text(`Generated: ${scannedAt.toLocaleString()}`, margin, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`ISO: ${scannedAt.toISOString()}`, margin, y);
  doc.setTextColor(0);
  y += 8;

  // Disclaimer box
  doc.setDrawColor(196, 18, 48); // brand crimson
  doc.setLineWidth(0.5);
  const boxStartY = y;
  const boxHeight = DISCLAIMER_LINES.length * 4.2 + 8;
  doc.rect(margin, boxStartY, contentW, boxHeight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT — Please read before acting on these results", margin + 3, boxStartY + 5);
  doc.setFont("helvetica", "normal");
  let lineY = boxStartY + 10;
  for (const line of DISCLAIMER_LINES) {
    doc.text(line, margin + 3, lineY);
    lineY += 4.2;
  }
  y = boxStartY + boxHeight + 8;

  // Results header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Potential matches (${results.length})`, margin, y);
  y += 6;

  // Helper for page breaks
  const ensureRoom = (needed: number) => {
    if (y + needed > pageH - margin - 10) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (results.length === 0) {
    doc.setTextColor(120);
    doc.text("No results captured in this scan.", margin, y);
    doc.setTextColor(0);
  } else {
    results.forEach((r, i) => {
      ensureRoom(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const title = r.title || extractDomain(r.url) || "Untitled";
      const titleLines = doc.splitTextToSize(`${i + 1}. ${title}`, contentW);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      const meta: string[] = [];
      if (r.mention_type) meta.push(r.mention_type);
      if (r.source || r.url) meta.push(r.source || extractDomain(r.url));
      if (r.found_at) {
        try { meta.push(new Date(r.found_at).toLocaleDateString()); } catch { /* ignore */ }
      }
      if (meta.length) {
        doc.text(meta.join(" · "), margin, y);
        y += 4;
      }
      doc.setTextColor(60);
      if (r.url) {
        const urlLines = doc.splitTextToSize(r.url, contentW);
        doc.text(urlLines, margin, y);
        y += urlLines.length * 4;
      }
      if (r.excerpt) {
        const exLines = doc.splitTextToSize(r.excerpt, contentW);
        ensureRoom(exLines.length * 4 + 4);
        doc.text(exLines, margin, y);
        y += exLines.length * 4;
      }
      doc.setTextColor(0);
      y += 3;
      doc.setDrawColor(230);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      "ClaimMyFace does not retain scan findings server-side. This PDF is your only record.",
      margin,
      pageH - 8,
    );
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, pageH - 8, { align: "right" });
    doc.setTextColor(0);
  }

  const stamp = scannedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  doc.save(`claimmyface-scan-${stamp}.pdf`);
}
