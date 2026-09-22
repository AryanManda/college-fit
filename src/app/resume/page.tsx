"use client";

import { useMemo, useState } from "react";
import { GripVertical, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useStore } from "../../lib/store";
import { uid } from "../../lib/id";
import { improveBullet, parseResumeText, resumeFromProfile, scoreResume, type ImproveResult } from "../../lib/resume";
import type { ResumeLength, ResumeSection, ResumeTone, ResumeVersion } from "../../lib/types";
import { PageHeader, ScoreBar } from "../../components/ui";

const FONTS = ["Arial", "Calibri", "Times New Roman", "Garamond", "Georgia", "Helvetica"];
const TONES: ResumeTone[] = ["Professional", "Finance", "Consulting", "Government", "Academic", "Technical", "Entrepreneurial"];
const LENGTHS: ResumeLength[] = ["Concise", "Balanced", "Detailed"];

export default function ResumePage() {
  const { state, setState } = useStore();
  const [tone, setTone] = useState<ResumeTone>("Professional");
  const [length, setLength] = useState<ResumeLength>("Balanced");
  const [improve, setImprove] = useState<{ sectionId: string; itemId: string; bulletId: string; result: ImproveResult } | null>(null);
  const [paste, setPaste] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

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

  const onUpload = async (file: File) => {
    let text = "";
    if (file.name.endsWith(".txt") || file.type.startsWith("text/")) text = await file.text();
    else text = await file.text().catch(() => "");
    if (!text || text.includes("\u0000")) {
      alert("This MVP parses .txt and pasted text most reliably. For PDF/DOCX, paste the text, then edit.");
      return;
    }
    const sections = parseResumeText(text);
    save({
      id: uid(),
      name: file.name.replace(/\.[^.]+$/, ""),
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
    });
  };

  return (
    <div>
      <PageHeader
        title="Student Resume Builder"
        subtitle="Build a standout resume for college applications, scholarships, and internships. Fill in the sections below to generate your professional document."
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={createFromProfile}>Generate &amp; Export Resume</button>
            <label className="btn btn-ghost cursor-pointer">
              <Upload size={16} /> Upload
              <input type="file" className="hidden" accept=".txt,.pdf,.docx,.doc" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          </div>
        }
      />

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
        <button className="btn btn-primary mt-3" onClick={() => { if (paste.trim()) { const sections = parseResumeText(paste); save({ ...(resume ?? resumeFromProfile(state)), id: uid(), name: "Parsed Resume", sections }); setPaste(""); } }}>Parse</button>
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
              className="card p-6"
              style={{
                fontFamily: resume.font,
                fontSize: resume.fontSize,
                lineHeight: resume.lineSpacing,
                padding: `${resume.margin}in`,
                textAlign: resume.alignment,
              }}
            >
              <input className="w-full border-none bg-transparent text-2xl font-semibold outline-none" value={resume.headerName} onChange={(e) => save({ ...resume, headerName: e.target.value })} />
              <input className="mb-4 w-full border-none bg-transparent text-sm text-(--muted) outline-none" value={resume.headerContact} onChange={(e) => save({ ...resume, headerContact: e.target.value })} />
              {resume.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className="mb-4 rounded-xl border border-transparent hover:border-(--line)"
                  draggable
                  onDragStart={() => setDragId(section.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === section.id) return;
                    const from = resume.sections.findIndex((s) => s.id === dragId);
                    const next = [...resume.sections];
                    const [moved] = next.splice(from, 1);
                    next.splice(idx, 0, moved);
                    save({ ...resume, sections: next });
                    setDragId(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-(--muted)" />
                    <input className="w-full border-none bg-transparent font-semibold uppercase tracking-wide outline-none" value={section.heading} onChange={(e) => save({ ...resume, sections: resume.sections.map((s) => (s.id === section.id ? { ...s, heading: e.target.value } : s)) })} />
                    <button className="btn btn-ghost px-2" onClick={() => save({ ...resume, sections: resume.sections.filter((s) => s.id !== section.id) })}><Trash2 size={14} /></button>
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
                        <div key={b.id} className="mt-2 flex gap-2">
                          <span className="pt-3 text-(--muted)">{resume.bulletStyle === "dash" ? "–" : resume.bulletStyle === "none" ? "" : "•"}</span>
                          <textarea className="field min-h-16 flex-1" value={b.text} onChange={(e) => updateBullet(resume, save, section.id, item.id, b.id, e.target.value)} />
                          <button
                            className="btn btn-ghost h-10"
                            onClick={() => setImprove({ sectionId: section.id, itemId: item.id, bulletId: b.id, result: improveBullet(b.text, tone, length) })}
                          >
                            <Sparkles size={14} /> Improve
                          </button>
                        </div>
                      ))}
                      <button className="btn btn-ghost mt-2" onClick={() => addBullet(resume, save, section.id, item.id)}><Plus size={14} /> Bullet</button>
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
                <div className="text-sm text-(--muted)">Resume Strength</div>
                <div className="serif text-4xl">{score.overall}/100</div>
                <div className="mt-3 grid gap-2">
                  <ScoreBar label="Formatting" value={score.formatting} />
                  <ScoreBar label="Readability" value={score.readability} />
                  <ScoreBar label="Action verbs" value={score.actionVerbs} />
                  <ScoreBar label="Quantification" value={score.quantification} />
                  <ScoreBar label="Conciseness" value={score.conciseness} />
                  <ScoreBar label="Consistency" value={score.consistency} />
                  <ScoreBar label="Impact" value={score.impact} />
                  <ScoreBar label="Relevant experience" value={score.relevantExperience} />
                </div>
                <ul className="mt-3 list-disc pl-5 text-sm text-(--muted)">
                  {score.recommendations.map((r) => <li key={r}>{r}</li>)}
                  {score.strengths.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {improve && resume ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={() => setImprove(null)}>
          <div className="card max-h-[90vh] max-w-xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
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
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary" onClick={() => { updateBullet(resume, save, improve.sectionId, improve.itemId, improve.bulletId, improve.result.impact); setImprove(null); }}>Use impact version</button>
              {improve.result.quantified ? (
                <button className="btn btn-ghost" onClick={() => { updateBullet(resume, save, improve.sectionId, improve.itemId, improve.bulletId, improve.result.quantified!); setImprove(null); }}>Use quantified</button>
              ) : null}
              <button className="btn btn-ghost" onClick={() => setImprove(null)}>Keep original</button>
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
