"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { PageHeader } from "../../components/ui";
import { useStore } from "../../lib/store";
import {
  applyParsedDocument,
  parseResumeToProfileBits,
  parseTranscriptText,
} from "../../lib/document-parse";

async function readFileText(file: File): Promise<string> {
  if (file.type.startsWith("text/") || /\.(txt|csv|md)$/i.test(file.name)) {
    return file.text();
  }
  const raw = await file.text().catch(() => "");
  if (raw && !raw.includes("\u0000")) return raw;
  throw new Error("For PDF/DOCX, paste the text from the document (OCR export or copy/paste). Plain .txt uploads work directly.");
}

export default function UploadPage() {
  const { state, setState } = useStore();
  const [transcriptPaste, setTranscriptPaste] = useState("");
  const [resumePaste, setResumePaste] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState("");

  const applyTranscript = (text: string) => {
    const parsed = parseTranscriptText(text);
    setState((s) => applyParsedDocument(s, parsed, "transcript"));
    setNotes(parsed.notes);
    setError("");
  };

  const applyResume = (text: string) => {
    const parsed = parseResumeToProfileBits(text);
    setState((s) => applyParsedDocument(s, parsed, "resume"));
    setNotes(parsed.notes);
    setError("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Smart intake"
        title="Upload transcript & resume"
        subtitle="Paste or upload text from your unofficial transcript and resume. We extract GPA, AP/IB courses, activities, and work — then merge into your profile without wiping prior data."
      />

      {!state.accountEmail ? (
        <p className="mb-4 text-sm text-(--accent-2)">
          <Link href="/account" className="font-semibold underline">Create an account</Link> so updates persist across sessions on this device.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="serif text-xl">Unofficial transcript</h2>
          <p className="mt-1 text-sm text-(--muted)">Looks for GPA, SAT/ACT, and official AP/IB course titles.</p>
          <textarea
            className="field mt-3 min-h-40"
            value={transcriptPaste}
            onChange={(e) => setTranscriptPaste(e.target.value)}
            placeholder={"Weighted GPA: 4.42\nUnweighted GPA: 3.91\nAP Calculus BC A\nAP Chemistry B+\nAP United States History A-"}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => applyTranscript(transcriptPaste)} disabled={!transcriptPaste.trim()}>
              Parse & merge transcript
            </button>
            <label className="btn btn-ghost cursor-pointer">
              <Upload size={16} className="mr-1 inline" />
              Upload .txt
              <input
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await readFileText(file);
                    setTranscriptPaste(text);
                    applyTranscript(text);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not read file");
                  }
                }}
              />
            </label>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="serif text-xl">Resume</h2>
          <p className="mt-1 text-sm text-(--muted)">Maps Experience and Activities sections into your profile.</p>
          <textarea
            className="field mt-3 min-h-40"
            value={resumePaste}
            onChange={(e) => setResumePaste(e.target.value)}
            placeholder={"Experience\nSoftware Intern — Local Studio\n- Built dashboard features\n\nActivities\nCS Club President\n- Led weekly meetings"}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => applyResume(resumePaste)} disabled={!resumePaste.trim()}>
              Parse & merge resume
            </button>
            <label className="btn btn-ghost cursor-pointer">
              <Upload size={16} className="mr-1 inline" />
              Upload .txt
              <input
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await readFileText(file);
                    setResumePaste(text);
                    applyResume(text);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not read file");
                  }
                }}
              />
            </label>
          </div>
        </section>
      </div>

      {error ? <p className="mt-4 text-sm text-(--danger)">{error}</p> : null}
      {notes.length ? (
        <div className="card mt-4 p-4 text-sm">
          <div className="font-semibold">Extraction notes</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-(--muted)">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/profile?tab=academics" className="btn btn-primary">Review academics & AP/IB courses</Link>
        <Link href="/colleges/matches" className="btn btn-ghost">See admission-weighted matches</Link>
        <Link href="/odds" className="btn btn-ghost">Check odds</Link>
      </div>
    </div>
  );
}
