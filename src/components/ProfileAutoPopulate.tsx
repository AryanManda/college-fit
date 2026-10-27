"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { FilePickButton } from "./FilePickButton";
import { extractDocumentText } from "../lib/extract-document";
import {
  applyParsedDocument,
  parseResumeToProfileBits,
  parseTranscriptText,
} from "../lib/document-parse";
import { parseResumeText, resumeFromProfile, scoreResume } from "../lib/resume";
import { uid } from "../lib/id";
import { useStore } from "../lib/store";

export function FillTip() {
  return (
    <p className="text-xs leading-snug text-(--muted)">
      <span className="font-semibold text-(--accent)">Best to fill this out</span>
      {" — improves college matches and resume help."}
    </p>
  );
}

/** Small tip above a main profile card/box. */
export function TipCard({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <FillTip />
      {children}
    </div>
  );
}

export function ProfileAutoPopulate() {
  const { state, setState } = useStore();
  const [busy, setBusy] = useState<"transcript" | "resume" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const applyTranscript = (text: string) => {
    const parsed = parseTranscriptText(text);
    setState((s) => applyParsedDocument(s, parsed, "transcript"));
    setNotes(parsed.notes);
    setMsg("Transcript applied — GPA, courses, and testing fields were updated where we found them.");
    setErr(null);
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
      `Resume rating: ${rated.rating} (${rated.overall}/100).`,
    ]);
    setMsg(
      `Resume applied — activities and work were merged into your profile. Rating: ${rated.rating} (${rated.overall}/100).`,
    );
    setErr(null);
  };

  const onFile = async (file: File, kind: "transcript" | "resume") => {
    setBusy(kind);
    setErr(null);
    setMsg(null);
    try {
      const { text } = await extractDocumentText(file);
      if (kind === "transcript") applyTranscript(text);
      else applyResume(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card mb-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">
            Auto-populate
          </div>
          <h2 className="serif mt-1 text-2xl text-(--ink)">Fill your profile from documents</h2>
          <p className="mt-1 max-w-2xl text-sm text-(--muted)">
            Upload a transcript and/or resume (PDF, Word, or text). We extract what we can and merge it into
            your profile — you can still edit everything below.
          </p>
        </div>
        <Link href="/upload" className="text-sm font-semibold text-(--accent) hover:underline">
          Full upload page →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col items-start gap-2 rounded-[var(--radius)] border border-(--line) bg-(--surface) p-4">
          <span className="inline-flex items-center gap-2 font-semibold text-(--ink)">
            <FileText size={18} /> Unofficial transcript
          </span>
          <span className="text-sm text-(--muted)">
            Pulls GPA, SAT/ACT, and AP/IB course titles into Academics.
          </span>
          <FilePickButton
            busy={busy === "transcript"}
            disabled={busy !== null}
            onFile={(file) => onFile(file, "transcript")}
            className="btn btn-primary mt-1 w-full sm:w-auto"
          >
            <Upload size={16} /> {busy === "transcript" ? "Reading…" : "Upload transcript"}
          </FilePickButton>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-[var(--radius)] border border-(--line) bg-(--surface) p-4">
          <span className="inline-flex items-center gap-2 font-semibold text-(--ink)">
            <FileText size={18} /> Resume
          </span>
          <span className="text-sm text-(--muted)">
            Maps experience and activities into Work / Activities and opens Resume Builder.
          </span>
          <FilePickButton
            busy={busy === "resume"}
            disabled={busy !== null}
            onFile={(file) => onFile(file, "resume")}
            className="btn btn-primary mt-1 w-full sm:w-auto"
          >
            <Upload size={16} /> {busy === "resume" ? "Reading…" : "Upload resume"}
          </FilePickButton>
        </div>
      </div>

      {msg ? (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-(--accent)/25 bg-(--accent-soft) px-3 py-2 text-sm font-semibold text-(--accent)">
          {msg}{" "}
          <Link href="/resume" className="underline underline-offset-2">
            Open resume
          </Link>
        </div>
      ) : null}
      {err ? <p className="mt-3 text-sm text-(--danger)">{err}</p> : null}
      {notes.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-(--muted)">
          {notes.slice(0, 6).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
