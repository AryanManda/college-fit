"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { FilePickButton } from "../../components/FilePickButton";
import { useStore } from "../../lib/store";
import { uid } from "../../lib/id";
import { extractDocumentText } from "../../lib/extract-document";
import { improveBullet, parseResumeText, resumeFromProfile, scoreResume, type ImproveResult } from "../../lib/resume";
import type { ResumeLength, ResumeSection, ResumeTone, ResumeVersion } from "../../lib/types";
import { PageHeader, Ring, ScoreBar } from "../../components/ui";
import { CollegesTopTabs } from "../../components/CollegesTopTabs";

const FONTS = ["Arial", "Calibri", "Times New Roman", "Garamond", "Georgia", "Helvetica"];
const TONES: ResumeTone[] = ["Professional", "Finance", "Consulting", "Government", "Academic", "Technical", "Entrepreneurial"];
const LENGTHS: ResumeLength[] = ["Concise", "Balanced", "Detailed"];

export default function ResumePage() {
  const { state, setState } = useStore();
  const [tone, setTone] = useState<ResumeTone>("Professional");
  const [length, setLength] = useState<ResumeLength>("Balanced");
  const [improve, setImprove] = useState<{ sectionId: string; itemId: string; bulletId: string; result: ImproveResult } | null>(null);
  const [paste, setPaste] = useState("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resume = state.resumes.find((r) => r.id === state.activeResumeId) ?? state.resumes[0] ?? null;
  const score = useMemo(() => (resume ? scoreResume(resume, state) : null), [resume, state]);

  const save = (next: ResumeVersion) =>
    setState((s) => ({
      ...s,
      activeResumeId: next.id,
      resumes: s.resumes.some((r) => r.id === next.id)
        ? s.resumes.map((r) => (r.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : r))
        : [...s.resumes, { ...next, updatedAt: new Date().toISOString() }],
    }));

  const createFromProfile = () => save(resumeFromProfile(state));
  const createBlank = (name: string) =>
    save({
      id: uid(),
      name,
      updatedAt: new Date().toISOString(),
      font: "Arial",
      fontSize: 11,
      alignment: "left",
      margin: 0.7,
      lineSpacing: 1.15,
      bulletStyle: "disc",
      headerName: `${state.student.firstName} ${state.student.lastName}`.trim() || "Your Name",
      headerContact: state.student.email,
      sections: [
        {
          id: uid(),
          type: "experience",
          heading: "Experience",
          items: [{ id: uid(), title: "Role", subtitle: "Organization", location: "", dates: "", bullets: [{ id: uid(), text: "Led a project with a result you can verify." }] }],
        },
      ],
    });

  const applyParsedText = (text: string, name: string, sourceLabel: string) => {
    const sections = parseResumeText(text);
    const next: ResumeVersion = {
      id: uid(),
      name,
      updatedAt: new Date().toISOString(),
      font: "Arial",
      fontSize: 11,
      alignment: "left",
      margin: 0.7,
      lineSpacing: 1.15,
      bulletStyle: "disc",
      headerName: `${state.student.firstName} ${state.student.lastName}`.trim() || "Your Name",
      headerContact: state.student.email,
      sections,
    };
    save(next);
    const rated = scoreResume(next, state);
    setUploadMsg(`Parsed ${sourceLabel}. Rating: ${rated.rating} (${rated.overall}/100). See Where to improve →`);
    setUploadErr(null);
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    setUploadErr(null);
    setUploadMsg(null);
    try {
      const { text, source, pages } = await extractDocumentText(file);
      const label =
        source === "pdf"
          ? `PDF${pages ? ` (${pages} page${pages === 1 ? "" : "s"})` : ""}`
          : source === "docx"
            ? "Word document"
            : "text file";
      applyParsedText(text, file.name.replace(/\.[^.]+$/, "") || "Uploaded Resume", label);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Student Resume Builder"
        subtitle="Upload a PDF or Word resume, get a strength rating, and see exactly where to improve — without inventing stats."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={createFromProfile}>Generate from profile</button>
            <FilePickButton busy={uploading} onFile={onUpload} className="btn btn-ghost w-full sm:w-auto">
              <Upload size={16} /> {uploading ? "Parsing…" : "Upload PDF / DOCX"}
            </FilePickButton>
          </div>
        }
      />

      <CollegesTopTabs />

      {uploadMsg ? (
        <div className="card mb-4 border-(--accent)/30 bg-(--accent-soft) p-4 text-sm font-semibold text-(--accent)">
          {uploadMsg}
        </div>
      ) : null}
      {uploadErr ? (
        <div className="card mb-4 border-(--danger)/30 bg-(--banner) p-4 text-sm text-(--danger)">{uploadErr}</div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {state.resumes.map((r) => (
          <button key={r.id} className={`btn ${resume?.id === r.id ? "btn-primary" : "btn-ghost"}`} onClick={() => setState((s) => ({ ...s, activeResumeId: r.id }))}>
            {r.name}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={() => createBlank("Finance Resume")}>Finance Resume</button>
        <button className="btn btn-ghost" onClick={() => createBlank("Internship Resume")}>Internship Resume</button>
        <button className="btn btn-ghost" onClick={() => createBlank("College Resume")}>College Resume</button>
        <button className="btn btn-ghost" onClick={() => createBlank("Government Resume")}>Government Resume</button>
      </div>

      <details className="card mb-4 p-4">
        <summary className="cursor-pointer font-semibold">Paste resume text to parse</summary>
        <textarea className="field mt-3 min-h-32" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Education\nWestlake High School\n- GPA 3.91\nExperience\nIntern\n- Managed social media for organization."} />
        <button className="btn btn-primary mt-3" onClick={() => { if (paste.trim()) { applyParsedText(paste, "Parsed Resume", "pasted text"); setPaste(""); } }}>Parse</button>
      </details>

      {!resume ? (
        <div className="card p-6 text-(--muted)">Create a version to start editing.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
              <label className="text-sm">Font
                <select className="field mt-1" value={resume.font} onChange={(e) => save({ ...resume, font: e.target.value })}>
                  {FONTS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
              <label className="text-sm">Size
                <input className="field mt-1" type="number" value={resume.fontSize} onChange={(e) => save({ ...resume, fontSize: Number(e.target.value) })} />
              </label>
              <label className="text-sm">Alignment
                <select className="field mt-1" value={resume.alignment} onChange={(e) => save({ ...resume, alignment: e.target.value as ResumeVersion["alignment"] })}>
                  <option value="left">Left</option><option value="center">Center</option>
                </select>
              </label>
              <label className="text-sm">Margins (in)
                <input className="field mt-1" type="number" step="0.1" value={resume.margin} onChange={(e) => save({ ...resume, margin: Number(e.target.value) })} />
              </label>
              <label className="text-sm">Line spacing
                <input className="field mt-1" type="number" step="0.05" value={resume.lineSpacing} onChange={(e) => save({ ...resume, lineSpacing: Number(e.target.value) })} />
              </label>
              <label className="text-sm">Bullets
                <select className="field mt-1" value={resume.bulletStyle} onChange={(e) => save({ ...resume, bulletStyle: e.target.value as ResumeVersion["bulletStyle"] })}>
                  <option value="disc">Disc</option><option value="dash">Dash</option><option value="none">None</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">Version name
                <input className="field mt-1" value={resume.name} onChange={(e) => save({ ...resume, name: e.target.value })} />
              </label>
            </div>

            <div
              className="card min-w-0 overflow-x-auto"
              style={{
                fontFamily: resume.font,
                fontSize: resume.fontSize,
                lineHeight: resume.lineSpacing,
                padding: `min(${resume.margin}in, 1rem)`,
                textAlign: resume.alignment,
              }}
            >
              <input className="w-full border-none bg-transparent text-2xl font-semibold outline-none" value={resume.headerName} onChange={(e) => save({ ...resume, headerName: e.target.value })} />
              <input className="mb-4 w-full border-none bg-transparent text-sm text-(--muted) outline-none" value={resume.headerContact} onChange={(e) => save({ ...resume, headerContact: e.target.value })} />
              {resume.sections.map((section, idx) => (
                <div key={section.id} className="mb-4 rounded-xl border border-(--line)/70 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost px-2"
                      aria-label="Move section up"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const sections = [...resume.sections];
                        const [moved] = sections.splice(idx, 1);
                        sections.splice(idx - 1, 0, moved);
                        save({ ...resume, sections });
                      }}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost px-2"
                      aria-label="Move section down"
                      disabled={idx === resume.sections.length - 1}
                      onClick={() => {
                        if (idx === resume.sections.length - 1) return;
                        const sections = [...resume.sections];
                        const [moved] = sections.splice(idx, 1);
                        sections.splice(idx + 1, 0, moved);
                        save({ ...resume, sections });
                      }}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <input className="field min-w-0 flex-1 font-semibold uppercase tracking-wide" value={section.heading} onChange={(e) => save({ ...resume, sections: resume.sections.map((s) => (s.id === section.id ? { ...s, heading: e.target.value } : s)) })} />
                    <button type="button" className="btn btn-ghost px-3" aria-label="Delete section" onClick={() => save({ ...resume, sections: resume.sections.filter((s) => s.id !== section.id) })}><Trash2 size={16} /></button>
                  </div>
                  {section.items.map((item) => (
                    <div key={item.id} className="mt-2">
                      <div className="grid gap-1 md:grid-cols-2">
                        <input className="field" value={item.title} onChange={(e) => updateItem(resume, save, section.id, item.id, { title: e.target.value })} />
                        <input className="field" value={item.subtitle} onChange={(e) => updateItem(resume, save, section.id, item.id, { subtitle: e.target.value })} />
                        <input className="field" placeholder="Location" value={item.location} onChange={(e) => updateItem(resume, save, section.id, item.id, { location: e.target.value })} />
                        <input className="field" placeholder="Dates" value={item.dates} onChange={(e) => updateItem(resume, save, section.id, item.id, { dates: e.target.value })} />
                      </div>
                      {item.bullets.map((b) => (
                        <div key={b.id} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                          <div className="flex min-w-0 flex-1 gap-2">
                            <span className="pt-3 text-(--muted)">{resume.bulletStyle === "dash" ? "–" : resume.bulletStyle === "none" ? "" : "•"}</span>
                            <textarea className="field min-h-16 flex-1" value={b.text} onChange={(e) => updateBullet(resume, save, section.id, item.id, b.id, e.target.value)} />
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost w-full sm:w-auto"
                            onClick={() => setImprove({ sectionId: section.id, itemId: item.id, bulletId: b.id, result: improveBullet(b.text, tone, length) })}
                          >
                            <Sparkles size={14} /> Improve
                          </button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-ghost mt-2 w-full sm:w-auto" onClick={() => addBullet(resume, save, section.id, item.id)}><Plus size={14} /> Bullet</button>
                    </div>
                  ))}
                </div>
              ))}
              <button className="btn btn-ghost" onClick={() => save({ ...resume, sections: [...resume.sections, { id: uid(), type: "custom", heading: "New Section", items: [{ id: uid(), title: "Title", subtitle: "", location: "", dates: "", bullets: [{ id: uid(), text: "" }] }] } as ResumeSection] })}>
                Add section
              </button>
            </div>
          </div>
          <aside className="grid h-fit gap-4">
            <div className="card p-4">
              <div className="text-sm font-semibold">Voice</div>
              <select className="field mt-2" value={tone} onChange={(e) => setTone(e.target.value as ResumeTone)}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
              <select className="field mt-2" value={length} onChange={(e) => setLength(e.target.value as ResumeLength)}>{LENGTHS.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            {score ? (
              <div className="card p-4">
                <div className="flex items-center gap-4">
                  <Ring value={score.overall} size={96} />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">Resume rating</div>
                    <div className="serif text-2xl text-(--ink)">{score.rating}</div>
                    <div className="text-sm font-semibold text-(--accent)">{score.overall}/100</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <ScoreBar label="Formatting" value={score.formatting} />
                  <ScoreBar label="Readability" value={score.readability} />
                  <ScoreBar label="Action verbs" value={score.actionVerbs} />
                  <ScoreBar label="Quantification" value={score.quantification} />
                  <ScoreBar label="Conciseness" value={score.conciseness} />
                  <ScoreBar label="Consistency" value={score.consistency} />
                  <ScoreBar label="Impact" value={score.impact} />
                  <ScoreBar label="Relevant experience" value={score.relevantExperience} />
                </div>
                {score.improvements.length ? (
                  <div className="mt-4 border-t border-(--line) pt-3">
                    <div className="text-sm font-semibold text-(--ink)">Where to improve</div>
                    <ul className="mt-2 space-y-2">
                      {score.improvements.map((item) => (
                        <li key={item.area} className="rounded-[var(--radius-sm)] border border-(--line) bg-(--bg)/50 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{item.area}</span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide ${
                                item.priority === "high"
                                  ? "text-(--danger)"
                                  : item.priority === "medium"
                                    ? "text-(--accent-2)"
                                    : "text-(--muted)"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-(--muted)">{item.tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-(--accent)">No major gaps — polish bullets with Improve if you want.</p>
                )}
                {score.strengths.length ? (
                  <div className="mt-3">
                    <div className="text-sm font-semibold">Strengths</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-(--muted)">
                      {score.strengths.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {improve && resume ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          onClick={() => setImprove(null)}
        >
          <div className="card max-h-[min(85dvh,40rem)] w-full max-w-xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif text-3xl">Improve bullet</h3>
            <div className="mt-3 text-sm">
              <div className="font-semibold">Original</div>
              <p className="text-(--muted)">{improve.result.original}</p>
              <div className="mt-3 font-semibold">Impact-focused</div>
              <p>{improve.result.impact}</p>
              {improve.result.quantified ? (
                <>
                  <div className="mt-3 font-semibold">Quantified (only numbers already present)</div>
                  <p>{improve.result.quantified}</p>
                </>
              ) : (
                <>
                  <div className="mt-3 font-semibold">Missing metrics — answer these instead of inventing numbers</div>
                  <ul className="list-disc pl-5 text-(--muted)">{improve.result.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                </>
              )}
              <p className="mt-3 text-xs text-(--muted)">{improve.result.explanation}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => { updateBullet(resume, save, improve.sectionId, improve.itemId, improve.bulletId, improve.result.impact); setImprove(null); }}>Use impact version</button>
              {improve.result.quantified ? (
                <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => { updateBullet(resume, save, improve.sectionId, improve.itemId, improve.bulletId, improve.result.quantified!); setImprove(null); }}>Use quantified</button>
              ) : null}
              <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => setImprove(null)}>Keep original</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function updateItem(resume: ResumeVersion, save: (r: ResumeVersion) => void, sectionId: string, itemId: string, patch: Partial<ResumeVersion["sections"][0]["items"][0]>) {
  save({
    ...resume,
    sections: resume.sections.map((s) =>
      s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : s,
    ),
  });
}

function updateBullet(resume: ResumeVersion, save: (r: ResumeVersion) => void, sectionId: string, itemId: string, bulletId: string, text: string) {
  save({
    ...resume,
    sections: resume.sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, bullets: i.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)) } : i)) }
        : s,
    ),
  });
}

function addBullet(resume: ResumeVersion, save: (r: ResumeVersion) => void, sectionId: string, itemId: string) {
  save({
    ...resume,
    sections: resume.sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, bullets: [...i.bullets, { id: uid(), text: "" }] } : i)) }
        : s,
    ),
  });
}
