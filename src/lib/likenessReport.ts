import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ScanResult {
  url: string;
  title?: string;
  description?: string;
  snippet?: string;
  match_type?: string;
}

interface Scan {
  id: string;
  query: string;
  scan_type: string;
  status: string;
  result_count: number;
  results: ScanResult[];
  created_at: string;
}

interface ReportProfile {
  legal_name?: string | null;
  full_name?: string | null;
  stage_name?: string | null;
  email?: string | null;
}

const CRIMSON: [number, number, number] = [196, 30, 58];
const NAVY: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

export const generateLikenessReport = (scans: Scan[], profile: ReportProfile) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;

  // ===== HEADER BAR =====
  doc.setFillColor(...CRIMSON);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ClaimMyFace", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Likeness Scan Report", margin, 52);

  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, pageWidth - margin, 52, { align: "right" });

  // ===== PERFORMER BLOCK =====
  let y = 100;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const stageName = profile.stage_name || profile.full_name || "Unnamed Performer";
  doc.text(stageName, margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  if (profile.legal_name && profile.legal_name !== stageName) {
    doc.text(`Legal name: ${profile.legal_name}`, margin, y);
    y += 14;
  }
  if (profile.email) {
    doc.text(`Email: ${profile.email}`, margin, y);
    y += 14;
  }
  doc.text(`Report generated: ${dateStr}`, margin, y);
  y += 24;

  // ===== SUMMARY =====
  const totalFindings = scans.reduce((sum, s) => sum + (s.result_count || 0), 0);
  const imageCount = scans.filter((s) => s.scan_type === "image_search").length;
  const textCount = scans.filter((s) => s.scan_type !== "image_search").length;

  doc.setFillColor(245, 246, 250);
  doc.rect(margin, y, pageWidth - margin * 2, 56, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SCAN SUMMARY", margin + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const summaryLine = `${scans.length} scan${scans.length === 1 ? "" : "s"} · ${totalFindings} total finding${totalFindings === 1 ? "" : "s"} · ${imageCount} image scan${imageCount === 1 ? "" : "s"} · ${textCount} text scan${textCount === 1 ? "" : "s"}`;
  doc.text(summaryLine, margin + 12, y + 38);
  y += 80;

  // ===== PER-SCAN TABLES =====
  if (scans.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(11);
    doc.text("No scans on record.", margin, y);
  }

  scans.forEach((scan, idx) => {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${idx + 1}. ${scan.query || "Untitled scan"}`, margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const scanDate = new Date(scan.created_at).toLocaleDateString();
    const typeLabel = scan.scan_type === "image_search" ? "Image search" : "Text search";
    doc.text(
      `${typeLabel} · ${scanDate} · ${scan.result_count || 0} result${scan.result_count === 1 ? "" : "s"}`,
      margin,
      y,
    );
    y += 12;

    const results = (scan.results as ScanResult[]) || [];
    if (results.length > 0) {
      autoTable(doc, {
        startY: y + 4,
        head: [["#", "Title", "URL", "Match"]],
        body: results.map((r, i) => [
          String(i + 1),
          (r.title || "Untitled").slice(0, 60),
          (r.url || "").slice(0, 70),
          r.match_type === "visually_similar"
            ? "Similar"
            : r.match_type === "name_match"
              ? "Name"
              : "Match",
        ]),
        styles: { fontSize: 8, cellPadding: 4, textColor: NAVY },
        headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 160 },
          2: { cellWidth: 240, textColor: CRIMSON },
          3: { cellWidth: 60 },
        },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 24;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("No results found for this scan.", margin, y + 16);
      y += 36;
    }
  });

  // ===== FOOTER on every page =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Confidential — generated by ClaimMyFace.com",
      margin,
      pageHeight - 20,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, {
      align: "right",
    });
  }

  const safeName = (stageName || "performer").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`ClaimMyFace-Scan-Report-${safeName}-${today}.pdf`);
};
