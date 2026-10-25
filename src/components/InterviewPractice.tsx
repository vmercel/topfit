"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  Play,
  Send,
  Sparkles,
  Square,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { STAGES } from "@/lib/types";
import type { InterviewReport, InterviewView } from "@/lib/interview/contracts";
import "./interview-practice.css";

type SavedResume = {
  id: string;
  label: string;
  sourceFilename: string;
  isPrimary: boolean;
};
type VoiceStatus = "idle" | "loading" | "speaking" | "unavailable";
const labels: Record<string, string> = {
  relevance: "Relevance",
  depth: "Depth & reasoning",
  evidence: "Evidence & ownership",
  clarity: "Clarity & structure",
};

export default function InterviewPractice() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [resumeStatus, setResumeStatus] = useState(
    "Loading your saved resumes…",
  );
  const [resumeMode, setResumeMode] = useState<"saved" | "paste" | "upload">(
    "paste",
  );
  const [resumeId, setResumeId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [job, setJob] = useState("");
  const [stage, setStage] = useState("technical");
  const [count, setCount] = useState(3);
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<InterviewView | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voice, setVoice] = useState<VoiceStatus>("idle");
  const [replay, setReplay] = useState(0);
  const [clipUrl, setClipUrl] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy feedback");
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<MediaStream | null>(null);
  const mediaGeneration = useRef(0);
  const microphone = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedBlob = useRef<Blob | null>(null);
  const currentClip = useRef("");
  const speech = useRef<HTMLAudioElement | null>(null);
  const speechAbort = useRef<AbortController | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch("/api/resumes", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!mounted.current) return;
        const items = data.resumes as SavedResume[];
        setResumes(items);
        setResumeStatus(
          items.length
            ? ""
            : "No saved resumes yet. Paste or upload one below.",
        );
        if (items.length) {
          setResumeMode("saved");
          setResumeId((items.find((r) => r.isPrimary) || items[0]).id);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResumeStatus(
            "Saved resumes could not load. You can paste or upload a resume.",
          );
      });
    return () => {
      mounted.current = false;
      mediaGeneration.current += 1;
      controller.abort();
      requestController.current?.abort();
      speech.current?.pause();
      if (recorder.current?.state === "recording") recorder.current.stop();
      camera.current?.getTracks().forEach((t) => t.stop());
      microphone.current?.getTracks().forEach((t) => t.stop());
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (currentClip.current) URL.revokeObjectURL(currentClip.current);
    };
  }, []);

  useEffect(() => {
    if (video.current) video.current.srcObject = camera.current;
  }, [session, cameraOn]);

  useEffect(() => {
    if (!session || !voiceEnabled) return;
    const controller = new AbortController();
    speechAbort.current = controller;
    let url = "";
    const audio = new Audio();
    speech.current = audio;
    const speak = async () => {
      try {
        const res = await fetch("/api/interview/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: session.token }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Voice unavailable");
        url = URL.createObjectURL(await res.blob());
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          return;
        }
        audio.src = url;
        audio.onended = () => {
          if (!controller.signal.aborted) setVoice("idle");
        };
        audio.onerror = () => {
          if (!controller.signal.aborted) setVoice("unavailable");
        };
        try {
          await audio.play();
          if (!controller.signal.aborted) setVoice("speaking");
        } catch {
          if (!controller.signal.aborted) {
            setVoice("idle");
            setNotice(
              "Select Play question to hear the interviewer. You can also read the question below.",
            );
          }
        }
      } catch {
        if (!controller.signal.aborted) setVoice("unavailable");
      }
    };
    void speak();
    return () => {
      controller.abort();
      audio.pause();
      if (url) URL.revokeObjectURL(url);
    };
  }, [session, voiceEnabled, replay]);

  useEffect(() => {
    if (!session) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session]);

  async function api(path: string, body: FormData | object) {
    const controller = new AbortController();
    requestController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 115000);
    try {
      const multipart = body instanceof FormData;
      const res = await fetch(path, {
        method: "POST",
        ...(multipart
          ? {}
          : { headers: { "Content-Type": "application/json" } }),
        body: multipart ? body : JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "The interviewer could not respond. Please retry.",
        );
      return data;
    } catch (e) {
      if (controller.signal.aborted)
        throw new Error(
          "The request timed out. Your answer is still here; please retry.",
        );
      throw e;
    } finally {
      clearTimeout(timeout);
      if (requestController.current === controller)
        requestController.current = null;
    }
  }
  function clearClip() {
    recordedBlob.current = null;
    if (currentClip.current) URL.revokeObjectURL(currentClip.current);
    currentClip.current = "";
    setClipUrl("");
  }
  function stopMedia() {
    mediaGeneration.current += 1;
    speechAbort.current?.abort();
    speech.current?.pause();
    if (recorder.current?.state === "recording") recorder.current.stop();
    camera.current?.getTracks().forEach((t) => t.stop());
    camera.current = null;
    setCameraOn(false);
    microphone.current?.getTracks().forEach((t) => t.stop());
    microphone.current = null;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    clearClip();
    setRecording(false);
    setVoice("idle");
  }
  async function toggleCamera() {
    setError("");
    if (cameraOn) {
      camera.current?.getTracks().forEach((t) => t.stop());
      camera.current = null;
      setCameraOn(false);
      return;
    }
    setCameraBusy(true);
    const generation = mediaGeneration.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access is unavailable in this browser. You can still practice with voice or text.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!mounted.current || generation !== mediaGeneration.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      camera.current = stream;
      setCameraOn(true);
    } catch {
      setError(
        "Camera unavailable or permission denied. You can continue with voice or text, and enable the camera later.",
      );
    } finally {
      if (mounted.current) setCameraBusy(false);
    }
  }
  async function start() {
    setBusy("Preparing your interview");
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("role", role);
      form.set("job", job);
      form.set("stage", stage);
      form.set("count", String(count));
      if (resumeMode === "saved") form.set("resumeId", resumeId);
      if (resumeMode === "paste") form.set("resumeText", resumeText);
      if (resumeMode === "upload" && file) form.set("resumeFile", file);
      const data = await api("/api/interview/start", form);
      if (mounted.current) {
        setSession(data);
        setReport(null);
        setVoice("loading");
        setDraft("");
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Could not start the interview.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function send(action: "answer" | "skip" | "finish") {
    if (!session) return;
    if (
      action === "finish" &&
      !window.confirm(
        "Finish this practice and get feedback now? Your current typed or reviewed answer will be included.",
      )
    )
      return;
    speechAbort.current?.abort();
    speech.current?.pause();
    setVoice("idle");
    setError("");
    setNotice("");
    setBusy(
      action === "finish"
        ? "Evaluating your interview"
        : "Preparing the next question",
    );
    try {
      const data = await api("/api/interview/turn", {
        token: session.token,
        action,
        answer: action === "skip" ? "" : draft,
      });
      if (!mounted.current) return;
      if (data.report) {
        setReport(data.report);
        setSession(null);
        stopMedia();
      } else {
        setSession(data);
        setVoice("loading");
      }
      setDraft("");
      clearClip();
      setSeconds(0);
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Could not continue. Please retry.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function transcribe(blob: Blob) {
    if (!session) return;
    setBusy("Transcribing your answer");
    setError("");
    try {
      const form = new FormData();
      form.set("token", session.token);
      const mime = blob.type.split(";")[0];
      const extension =
        mime === "audio/mp4" ? "mp4" : mime === "audio/ogg" ? "ogg" : "webm";
      form.set("audio", blob, `answer.${extension}`);
      const data = await api("/api/interview/transcribe", form);
      if (mounted.current) {
        setDraft(data.text);
        setNotice("Review and correct the transcript, then send your answer.");
      }
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Could not transcribe. Retry or type your answer.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function startRecording() {
    if (busy || !session) return;
    speechAbort.current?.abort();
    speech.current?.pause();
    setVoice("idle");
    setError("");
    setNotice("");
    if (
      draft.trim() &&
      !window.confirm(
        "Recording a new answer will replace the current draft transcript. Continue?",
      )
    )
      return;
    setBusy("Connecting microphone");
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error();
      }
      microphone.current = stream;
      clearClip();
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: 96000,
      });
      recorder.current = rec;
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        microphone.current = null;
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        if (!mounted.current) return;
        setRecording(false);
        const blob = new Blob(chunks, { type: mime });
        recordedBlob.current = blob;
        currentClip.current = URL.createObjectURL(blob);
        setClipUrl(currentClip.current);
        void transcribe(blob);
      };
      rec.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        if (mounted.current) {
          setRecording(false);
          setError(
            "Recording failed. Type your answer or try the microphone again.",
          );
        }
      };
      rec.start(1000);
      setRecording(true);
      setSeconds(0);
      const began = Date.now();
      recordingTimer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - began) / 1000);
        setSeconds(elapsed);
        if (elapsed >= 90 && rec.state === "recording") rec.stop();
      }, 250);
    } catch {
      if (mounted.current)
        setError(
          "Microphone unavailable or permission denied. Type your answer below, or allow microphone access and try again.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  function reset() {
    stopMedia();
    setReport(null);
    setSession(null);
    setDraft("");
    setNotice("");
    setError("");
    setCopyLabel("Copy feedback");
  }
  async function copyFeedback() {
    if (!report) return;
    const text = `TopFit interview practice — ${role}\nScore: ${report.score}/100\n${report.completed ? "Completed" : "Partial"} interview: ${report.answeredMain}/${report.plannedMain} main questions answered\n\n${report.summary}\n\nNext steps:\n${report.nextSteps.map((s) => "- " + s).join("\n")}\n\n${report.evaluations.map((e, i) => `Question: ${report.turns[i].question}\nAnswer: ${report.turns[i].answer}\nStrength: ${e.strength}\nImprove: ${e.improve}\nBetter outline:\n${e.betterOutline.map((s) => "- " + s).join("\n")}`).join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied");
    } catch {
      setError(
        "Clipboard unavailable. You can select and copy the feedback on this page.",
      );
    }
  }
  const validResume =
    resumeMode === "saved"
      ? !!resumeId
      : resumeMode === "paste"
        ? resumeText.trim().length >= 200
        : !!file;
  const cameraPanel = (
    <section className="iv-camera">
      <div className="iv-camera-screen">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          aria-label="Your live camera preview"
          className={cameraOn ? "" : "iv-hidden"}
        />
        {!cameraOn && (
          <div className="iv-camera-off">
            <VideoOff size={28} />
            <span>Your camera preview</span>
            <small>Optional · stays on your device</small>
          </div>
        )}
        <span className="iv-camera-label">YOU {cameraOn && <i />}</span>
      </div>
      <button
        className="iv-subtle-button"
        onClick={toggleCamera}
        disabled={cameraBusy || !!busy}
      >
        {cameraBusy ? (
          <LoaderCircle className="animate-spin" size={15} />
        ) : cameraOn ? (
          <VideoOff size={15} />
        ) : (
          <Video size={15} />
        )}{" "}
        {cameraOn ? "Turn camera off" : "Enable camera"}
      </button>
    </section>
  );

  if (report)
    return (
      <main className="interview-studio">
        <header className="iv-page-heading">
          <p className="iv-eyebrow">THE DEBRIEF</p>
          <h1>
            A stronger answer <em>starts here.</em>
          </h1>
          <p>
            Your performance, the evidence behind it, and a concrete plan for
            next time.
          </p>
        </header>
        <div className="iv-report-top">
          <div className="iv-score">
            <span>COACHING SCORE</span>
            <strong>
              {report.score}
              <small>/100</small>
            </strong>
            <p>
              {report.completed ? "Interview completed" : "Partial interview"}
            </p>
            <small>
              {report.answeredMain} / {report.plannedMain} main questions
              answered
            </small>
          </div>
          <section className="iv-report-summary">
            <h2>{role}</h2>
            <p>{report.summary}</p>
            <div className="iv-dimensions">
              {report.dimensions.map((d) => (
                <div key={d.name}>
                  <label htmlFor={`score-${d.name}`}>
                    {labels[d.name]}
                    <span>{d.score}/100</span>
                  </label>
                  <progress id={`score-${d.name}`} value={d.score} max={100} />
                </div>
              ))}
            </div>
          </section>
        </div>
        <p className="iv-rubric">
          Each submitted answer is rated 0–5 on relevance, depth, evidence and
          clarity, with equal weight. The overall score averages these ratings
          across all submitted main and follow-up answers; skipped answers
          receive zero. Feedback uses the submitted transcript, not appearance,
          voice or accent. This is AI coaching, not a hiring prediction.
        </p>
        <div className="iv-feedback-grid">
          <section>
            <h2>
              <Check size={18} /> Keep doing this
            </h2>
            <ul>
              {report.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>
              <Sparkles size={18} /> Your next practice plan
            </h2>
            <ol>
              {report.nextSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        </div>
        <section className="iv-answer-feedback">
          <div className="iv-section-heading">
            <h2>Question-by-question feedback</h2>
            <span>{report.turns.length} submitted answers</span>
          </div>
          {report.evaluations.map((evaluation, i) => (
            <details key={i} open={i === 0}>
              <summary>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  {report.turns[i].question}
                  <small>
                    {report.turns[i].followup ? "Follow-up" : "Main question"}
                  </small>
                </div>
                <strong>
                  {Math.round(
                    ((evaluation.relevance +
                      evaluation.depth +
                      evaluation.evidence +
                      evaluation.clarity) /
                      20) *
                      100,
                  )}
                  <small>/100</small>
                </strong>
                <ChevronDown size={16} />
              </summary>
              <div className="iv-evaluation-body">
                <p className="iv-label">YOUR ANSWER</p>
                <p className="iv-original-answer">{report.turns[i].answer}</p>
                {evaluation.evidenceQuote && (
                  <blockquote>“{evaluation.evidenceQuote}”</blockquote>
                )}
                <div className="iv-turn-scores">
                  {(["relevance", "depth", "evidence", "clarity"] as const).map(
                    (k) => (
                      <span key={k}>
                        {labels[k]} <b>{evaluation[k]}/5</b>
                      </span>
                    ),
                  )}
                </div>
                <h3>What worked</h3>
                <p>{evaluation.strength}</p>
                <h3>What to improve</h3>
                <p>{evaluation.improve}</p>
                <h3>A stronger answer outline</h3>
                <ol>
                  {evaluation.betterOutline.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              </div>
            </details>
          ))}
        </section>
        <div className="iv-report-actions">
          <button className="iv-primary-button" onClick={reset}>
            Practice again <ArrowRight size={16} />
          </button>
          <button className="iv-secondary-button" onClick={copyFeedback}>
            {copyLabel}
          </button>
        </div>
        {error && (
          <p role="alert" className="iv-error">
            {error}
          </p>
        )}
        <p className="iv-footnote">
          Keep this tab open or copy your feedback. Interview transcripts and
          feedback are not saved to your account.
        </p>
      </main>
    );

  if (!session)
    return (
      <main className="interview-studio">
        <header className="iv-page-heading">
          <p className="iv-eyebrow">
            <span /> THE INTERVIEW ROOM
          </p>
          <h1>
            Don’t just prepare. <em>Rehearse the room.</em>
          </h1>
          <p>
            A conversation shaped by your resume. Questions that go deeper.
            Feedback you can use.
          </p>
        </header>
        <div className="iv-setup-grid">
          <section className="iv-setup-form">
            <div className="iv-section-heading">
              <h2>Build your practice round</h2>
              <span>01 / SETUP</span>
            </div>
            <label className="iv-label" htmlFor="iv-role">
              Target role
            </label>
            <input
              id="iv-role"
              placeholder="e.g. Senior Machine Learning Engineer"
              maxLength={500}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <div className="iv-form-row">
              <label>
                Interview stage
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Round length
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  <option value={3}>3 main questions · ~10 min</option>
                  <option value={5}>5 main questions · ~15–20 min</option>
                </select>
              </label>
            </div>
            <div className="iv-resume-heading">
              <label className="iv-label">Your resume</label>
              <div role="group" aria-label="Resume source">
                {(["saved", "paste", "upload"] as const).map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={resumeMode === mode}
                    onClick={() => setResumeMode(mode)}
                    disabled={mode === "saved" && !resumes.length}
                  >
                    {mode === "saved"
                      ? "Saved"
                      : mode === "paste"
                        ? "Paste text"
                        : "Upload"}
                  </button>
                ))}
              </div>
            </div>
            {resumeMode === "saved" ? (
              <label>
                Choose a saved resume
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                >
                  {resumes.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.label || r.sourceFilename || "Resume"}
                      {r.isPrimary ? " · Primary" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : resumeMode === "paste" ? (
              <>
                <textarea
                  aria-label="Resume text"
                  rows={7}
                  placeholder="Paste your resume. Include your roles, projects, skills, and achievements (at least 200 characters)."
                  maxLength={26000}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <small>
                  {resumeText.length.toLocaleString()} / 26,000 characters
                </small>
              </>
            ) : (
              <label className="iv-upload">
                <FileText size={22} />
                <span>
                  {file ? file.name : "Choose a PDF, DOCX or text resume"}
                </span>
                <small>Maximum 3 MB</small>
                <input
                  aria-label="Upload resume"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > 3 * 1024 * 1024) {
                      setError("Resume file is too large (max 3 MB).");
                      setFile(null);
                    } else {
                      setError("");
                      setFile(f);
                    }
                  }}
                />
              </label>
            )}
            {resumeStatus && <p className="iv-help">{resumeStatus}</p>}
            <details className="iv-job-details">
              <summary>
                Add a job description <span>optional</span>
              </summary>
              <textarea
                aria-label="Job description"
                rows={5}
                maxLength={14000}
                placeholder="Add the job description to make questions more specific to this opportunity."
                value={job}
                onChange={(e) => setJob(e.target.value)}
              />
            </details>
            <label className="iv-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I understand this is an AI interviewer. My resume, submitted
                answers and recorded audio answers are processed by TopFit and
                OpenAI to run this practice. My camera video stays on my device.
              </span>
            </label>
            {error && (
              <p className="iv-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="iv-primary-button iv-start"
              onClick={start}
              disabled={
                !!busy || !validResume || role.trim().length < 3 || !consent
              }
            >
              {busy ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  {busy}…
                </>
              ) : (
                <>
                  Enter the interview room <ArrowRight size={17} />
                </>
              )}
            </button>
          </section>
          <aside className="iv-setup-aside">
            <div className="iv-preview-interviewer">
              <InterviewerPortrait speaking={false} />
              <span>MEET YOUR INTERVIEWER</span>
              <h2>
                Morgan <small>AI</small>
              </h2>
              <p>
                A calm voice. Thoughtful questions.
                <br />
                One focused conversation.
              </p>
            </div>
            {cameraPanel}
            <div className="iv-how-it-works">
              <h3>Your round, in three moves</h3>
              <ol>
                <li>
                  <span>01</span>
                  <div>
                    <strong>Start with your story</strong>
                    <p>{count} main questions grounded in your resume.</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Go one level deeper</strong>
                    <p>
                      Up to one follow-up per question, based on what you say.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Leave with a clear next step</strong>
                    <p>
                      A score, evidence-backed feedback, and better answer
                      outlines.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <p className="iv-footnote">
              Camera is optional. Answer with your microphone or keyboard. Audio
              answers are capped at 90 seconds. This session lasts up to one
              hour and stays in this tab.
            </p>
          </aside>
        </div>
      </main>
    );

  return (
    <main className="interview-studio">
      <header className="iv-room-heading">
        <div>
          <p className="iv-eyebrow">
            <span /> PRACTICE IN PROGRESS
          </p>
          <h1>{role}</h1>
        </div>
        <div className="iv-round-progress">
          <span>{session.isFollowup ? "FOLLOW-UP" : "MAIN QUESTION"}</span>
          <strong>
            {session.mainNumber}
            <small> / {session.mainTotal}</small>
          </strong>
        </div>
      </header>
      <div className="iv-room-grid">
        <section
          className={`iv-interviewer-stage ${voice === "speaking" ? "iv-speaking" : ""}`}
          aria-label="AI interviewer"
        >
          <div className="iv-stage-top">
            <span>
              <i /> Morgan · AI interviewer
            </span>
            <button
              aria-label={
                voiceEnabled ? "Mute interviewer" : "Unmute interviewer"
              }
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                setVoice("idle");
              }}
            >
              {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
          </div>
          <InterviewerPortrait speaking={voice === "speaking"} />
          <div className="iv-wave" aria-hidden="true">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <p className="iv-voice-status">
            {!voiceEnabled
              ? "Interviewer voice muted"
              : voice === "speaking"
                ? "Speaking…"
                : voice === "loading"
                  ? "Preparing the interviewer’s voice…"
                  : voice === "unavailable"
                    ? "Voice unavailable. Read the question to continue."
                    : "Your turn. Take a breath, then answer."}
          </p>
          <div className="iv-question-card">
            <p>
              {session.isFollowup ? "LET’S GO DEEPER" : "YOUR NEXT QUESTION"}
            </p>
            <h2>{session.question.question}</h2>
            <div>
              <span>{session.question.focus}</span>
              <button
                onClick={() => {
                  setVoiceEnabled(true);
                  setVoice("loading");
                  setReplay((n) => n + 1);
                }}
                disabled={recording || !!busy || voice === "loading"}
              >
                <Play size={13} /> Play question
              </button>
            </div>
          </div>
        </section>
        <aside className="iv-room-aside">
          {cameraPanel}
          <section className="iv-conversation">
            <h2>
              Conversation so far <span>{session.turns.length} answers</span>
            </h2>
            {session.turns.length === 0 ? (
              <p>
                Your submitted answers will appear here. The next question will
                respond to what you share.
              </p>
            ) : (
              session.turns.map((turn, i) => (
                <details key={i}>
                  <summary>
                    {turn.followup ? "Follow-up" : "Question"}{" "}
                    {turn.mainIndex + 1}
                    <ChevronDown size={13} />
                  </summary>
                  <strong>{turn.question}</strong>
                  <p>{turn.answer}</p>
                </details>
              ))
            )}
          </section>
          <p className="iv-footnote">
            A private rehearsal. Video stays local; only submitted text and
            recorded audio answers are sent for AI processing. Camera and
            microphone turn off when the interview ends.
          </p>
        </aside>
      </div>
      <section
        className="iv-answer-composer"
        aria-label="Your interview answer"
      >
        <div className="iv-composer-heading">
          <div>
            <h2>Your answer</h2>
            <p>
              {recording
                ? "Microphone is recording. Finish when you are ready."
                : "Speak naturally, review the transcript, then send. Typing works too."}
            </p>
          </div>
          {recording ? (
            <span className="iv-recording-badge">
              <i /> {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")} / 01:30
            </span>
          ) : (
            <span className="iv-answer-length">{draft.length} / 5,000</span>
          )}
        </div>
        <textarea
          aria-label="Your answer"
          rows={5}
          maxLength={5000}
          value={draft}
          disabled={recording || !!busy}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Start recording, or type your answer here. Describe what you did, why you chose that approach, and what happened."
        />
        {clipUrl && (
          <div className="iv-audio-review">
            <audio
              controls
              src={clipUrl}
              aria-label="Listen to your recorded answer"
            />
            <button
              onClick={() =>
                recordedBlob.current && transcribe(recordedBlob.current)
              }
              disabled={!!busy || recording}
            >
              Retry transcription
            </button>
          </div>
        )}
        {notice && (
          <p className="iv-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="iv-error" role="alert">
            {error}
          </p>
        )}
        {busy && (
          <p className="iv-loading" role="status">
            <LoaderCircle size={15} className="animate-spin" />
            {busy}…
          </p>
        )}
        <div className="iv-answer-actions">
          <div>
            {recording ? (
              <button
                className="iv-record-button iv-recording"
                onClick={() =>
                  recorder.current?.state === "recording" &&
                  recorder.current.stop()
                }
              >
                <Square size={15} /> Finish recording
              </button>
            ) : (
              <button
                className="iv-record-button"
                onClick={startRecording}
                disabled={!!busy}
              >
                <Mic size={16} /> Record answer
              </button>
            )}
            <button
              className="iv-text-button"
              onClick={() => send("skip")}
              disabled={!!busy || recording}
            >
              Skip question
            </button>
          </div>
          <button
            className="iv-primary-button"
            onClick={() => send("answer")}
            disabled={!!busy || recording || draft.trim().length < 2}
          >
            <Send size={15} /> Send answer
          </button>
        </div>
      </section>
      <div className="iv-room-footer">
        <span>
          <MicOff size={13} /> Microphone records only when you choose Record
          answer
        </span>
        <button
          disabled={!!busy || recording}
          onClick={() => {
            if (
              window.confirm(
                "Leave this practice without feedback? Your interview transcript will be lost.",
              )
            )
              reset();
          }}
        >
          Leave room
        </button>
        <button
          onClick={() => send("finish")}
          disabled={
            !!busy ||
            recording ||
            (!session.turns.length && draft.trim().length < 2)
          }
        >
          Finish & get feedback <ArrowRight size={14} />
        </button>
      </div>
    </main>
  );
}

function InterviewerPortrait({ speaking }: { speaking: boolean }) {
  return (
    <div
      className={`iv-portrait ${speaking ? "is-speaking" : ""}`}
      role="img"
      aria-label="Morgan, illustrated AI interviewer"
    >
      <svg viewBox="0 0 180 180" fill="none" aria-hidden="true">
        <circle cx="90" cy="90" r="88" fill="#305849" />
        <circle
          cx="90"
          cy="90"
          r="69"
          stroke="#72947c"
          strokeOpacity=".35"
          strokeDasharray="2 9"
        />
        <path
          d="M32 170C33 131 52 119 90 119C128 119 147 131 148 170"
          fill="#d6dfc5"
        />
        <path d="M64 121L90 157L116 121" fill="#f3efde" />
        <path d="M81 139L90 133L99 139L95 169H85L81 139Z" fill="#bf8c65" />
        <path d="M74 102H106V126C97 138 83 138 74 126V102Z" fill="#c99877" />
        <path
          d="M54 68C54 41 71 31 92 31C119 31 128 51 126 73L120 98C114 115 102 122 90 122C75 122 62 113 58 96L54 68Z"
          fill="#dfb38f"
        />
        <path
          d="M53 76C42 44 63 25 91 25C119 25 134 47 126 78L117 59C99 66 80 60 68 52L62 80L53 76Z"
          fill="#243c32"
        />
        <path
          d="M73 82H79M103 82H109"
          stroke="#354b3b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M90 83L86 96H94"
          stroke="#bf8b6c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          className="iv-mouth"
          d="M80 106Q90 113 100 106"
          stroke="#8a604d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="64"
          y="74"
          width="22"
          height="17"
          rx="6"
          stroke="#526151"
          strokeWidth="2"
        />
        <rect
          x="96"
          y="74"
          width="22"
          height="17"
          rx="6"
          stroke="#526151"
          strokeWidth="2"
        />
        <path d="M86 79H96" stroke="#526151" strokeWidth="2" />
      </svg>
      <span className="iv-ai-badge">
        <Sparkles size={10} /> AI
      </span>
    </div>
  );
}
