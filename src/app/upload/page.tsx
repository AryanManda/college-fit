"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { FilePickButton } from "../../components/FilePickButton";
import { PageHeader } from "../../components/ui";
import { useStore } from "../../lib/store";
import { extractDocumentText } from "../../lib/extract-document";
import {
  applyParsedDocument,
  parseResumeToProfileBits,
  parseTranscriptText,
} from "../../lib/document-parse";
import { parseResumeText, resumeFromProfile, scoreResume } from "../../lib/resume";
import { uid } from "../../lib/id";

export default function UploadPage() {
  const { state, setState } = useStore();
  const [transcriptPaste, setTranscriptPaste] = useState("");
  const [resumePaste, setResumePaste] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumeRating, setResumeRating] = useState<string | null>(null);

  const applyTranscript = (text: string) => {
    const parsed = parseTranscriptText(text);
    setState((s) => applyParsedDocument(s, parsed, "transcript"));
    setNotes(parsed.notes);
    setError("");
    setResumeRating(null);
  };

  const applyResume = (text: string) => {
    const parsed = parseResumeToProfileBits(text);
    const sections = parseResumeText(text);
    const draft = {
      ...resumeFromProfile(state),
      id: uid(),
      name: "Uploaded resume",
      updatedAt: new Date().toISOString(),
      sections,
    };
    const rated = scoreResume(draft, state);
    setState((s) => {
      const merged = applyParsedDocument(s, parsed, "resume");
      return {
        ...merged,
        activeResumeId: draft.id,
        resumes: [...merged.resumes.filter((r) => r.id !== draft.id), draft],
      };
    });
    setNotes([
      ...parsed.notes,
      `Resume builder rating: ${rated.rating} (${rated.overall}/100). Open Resume to see where to improve.`,
    ]);
    setResumeRating(`${rated.rating} · ${rated.overall}/100`);
    setError("");
  };

  const onFile = async (file: File, kind: "transcript" | "resume") => {
    setBusy(true);
    setError("");
    try {
      const { text } = await extractDocumentText(file);
      if (kind === "transcript") {
        setTranscriptPaste(text);
        applyTranscript(text);
      } else {
        setResumePaste(text);
        applyResume(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Smart intake"
        title="Upload transcript & resume"
        subtitle="Upload PDF, Word (.docx), or paste text. We extract GPA, AP/IB, activities, and work — and rate resumes with improvement tips."
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
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => applyTranscript(transcriptPaste)} disabled={!transcriptPaste.trim()}>
              Parse & merge transcript
            </button>
            <FilePickButton busy={busy} onFile={(file) => onFile(file, "transcript")} className="btn btn-ghost w-full sm:w-auto">
              <Upload size={16} />
              {busy ? "Reading…" : "Upload PDF / DOCX / txt"}
            </FilePickButton>
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
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => applyResume(resumePaste)} disabled={!resumePaste.trim()}>
              Parse & merge resume
            </button>
            <FilePickButton busy={busy} onFile={(file) => onFile(file, "resume")} className="btn btn-ghost w-full sm:w-auto">
              <Upload size={16} />
              {busy ? "Reading…" : "Upload PDF / DOCX / txt"}
            </FilePickButton>
          </div>
        </section>
      </div>

      {error ? <p className="mt-4 text-sm text-(--danger)">{error}</p> : null}
      {resumeRating ? (
        <div className="card mt-4 border-(--accent)/30 bg-(--accent-soft) p-4 text-sm">
          <div className="font-semibold text-(--accent)">Resume rating: {resumeRating}</div>
          <Link href="/resume" className="mt-2 inline-block font-semibold text-(--accent) hover:underline">
            Open Resume Builder for full score &amp; where to improve →
          </Link>
        </div>
      ) : null}
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

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href="/resume" className="btn btn-primary w-full sm:w-auto">Open Resume Builder</Link>
        <Link href="/profile?tab=academics" className="btn btn-ghost w-full sm:w-auto">Review academics & AP/IB courses</Link>
        <Link href="/colleges/matches" className="btn btn-ghost w-full sm:w-auto">See admission-weighted matches</Link>
        <Link href="/odds" className="btn btn-ghost w-full sm:w-auto">Check odds</Link>
      </div>
    </div>
  );
}
