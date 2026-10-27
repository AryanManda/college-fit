/**
 * Client-side text extraction for resume / transcript uploads.
 * Supports PDF (pdf.js), DOCX (mammoth), and plain text.
 */

export type ExtractResult = {
  text: string;
  source: "pdf" | "docx" | "text";
  pages?: number;
};

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isDocx(file: File) {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(file.name)
  );
}

function isPlainText(file: File) {
  return (
    file.type.startsWith("text/") ||
    /\.(txt|csv|md|rtf)$/i.test(file.name)
  );
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist");
  // Use CDN worker matching installed pdf.js version (reliable on Vercel/Turbopack)
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ");
    parts.push(line);
  }
  const text = parts.join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) {
    throw new Error(
      "Could not read text from this PDF (it may be a scanned image). Try pasting the text or using a text-based PDF.",
    );
  }
  return { text, source: "pdf", pages: doc.numPages };
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const text = (result.value || "").trim();
  if (!text) {
    throw new Error("Could not extract text from this Word document.");
  }
  return { text, source: "docx" };
}

async function extractText(file: File): Promise<ExtractResult> {
  const text = (await file.text()).trim();
  if (!text || text.includes("\u0000")) {
    throw new Error("This file does not look like readable text.");
  }
  return { text, source: "text" };
}

export async function extractDocumentText(file: File): Promise<ExtractResult> {
  if (isPdf(file)) return extractPdf(file);
  if (isDocx(file)) return extractDocx(file);
  if (isPlainText(file) || file.type === "" || file.type === "application/octet-stream") {
    // Some browsers omit MIME — try text first, then PDF magic
    const buf = await file.arrayBuffer();
    const head = new Uint8Array(buf.slice(0, 5));
    const magic = String.fromCharCode(...head);
    if (magic.startsWith("%PDF")) {
      return extractPdf(new File([buf], file.name, { type: "application/pdf" }));
    }
    try {
      return await extractText(new File([buf], file.name, { type: "text/plain" }));
    } catch {
      if (/\.docx$/i.test(file.name)) {
        return extractDocx(new File([buf], file.name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
      }
      throw new Error("Unsupported file. Upload a PDF, DOCX, or .txt file.");
    }
  }
  if (/\.doc$/i.test(file.name) && !/\.docx$/i.test(file.name)) {
    throw new Error("Legacy .doc files are not supported. Save as PDF or .docx, or paste the text.");
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or .txt file.");
}
