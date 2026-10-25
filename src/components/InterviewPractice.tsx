"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  LoaderCircle,
  Mic,
  Play,
  Send,
  Square,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Clock,
  ShieldCheck,
  Users,
  Maximize2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useInterviewFeedback } from "./InterviewFeedbackProvider";
import { STAGES } from "@/lib/types";
import type { InterviewView } from "@/lib/interview/contracts";
import "./interview-practice.css";

type SavedResume = {
  id: string;
  label: string;
  sourceFilename: string;
  isPrimary: boolean;
};
type VoiceStatus = "idle" | "loading" | "speaking" | "unavailable";

export default function InterviewPractice() {
  const router = useRouter();
  const { setResult } = useInterviewFeedback();
  const [duration, setDuration] = useState(10);
  const [remaining, setRemaining] = useState(600);
  const [startedAt, setStartedAt] = useState(0);
  const [ending, setEnding] = useState(false);
  const [endReason, setEndReason] = useState<"time" | "manual" | null>(null);
  const room = useRef<HTMLElement>(null);
  const endingRef = useRef(false);
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
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<MediaStream | null>(null);
  const mediaGeneration = useRef(0);
  const microphone = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const finishRecording = useRef<((blob: Blob | null) => void) | null>(null);
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
    if (!session || !voiceEnabled || session.questionsComplete || ending)
      return;
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
  }, [session, voiceEnabled, replay, ending]);

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
      form.set("durationMinutes", String(duration));
      if (resumeMode === "saved") form.set("resumeId", resumeId);
      if (resumeMode === "paste") form.set("resumeText", resumeText);
      if (resumeMode === "upload" && file) form.set("resumeFile", file);
      const data = await api("/api/interview/start", form);
      if (mounted.current) {
        setSession(data);
        setResult(null);
        setStartedAt(Date.now());
        setRemaining(duration * 60);
        setEnding(false);
        setEndReason(null);
        endingRef.current = false;
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
  async function send(
    action: "answer" | "skip" | "finish",
    reason: "time" | "manual" = "manual",
  ) {
    if (!session || busy || endingRef.current) return;
    if (action === "finish") {
      endingRef.current = true;
      setEnding(true);
      setEndReason(reason);
    }
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
      let finalAnswer = draft;
      if (action === "finish") {
        // Flush an active recording before closing the devices so the last answer is included.
        if (recorder.current?.state === "recording") {
          const rec = recorder.current;
          const blob = await new Promise<Blob | null>((resolve) => {
            const timeout = setTimeout(() => {
              finishRecording.current = null;
              resolve(null);
            }, 5000);
            finishRecording.current = (value) => {
              clearTimeout(timeout);
              finishRecording.current = null;
              resolve(value);
            };
            rec.stop();
          });
          stopMedia();
          if (blob?.size) {
            const form = new FormData();
            form.set("token", session.token);
            const mime = blob.type.split(";")[0];
            const extension =
              mime === "audio/mp4"
                ? "mp4"
                : mime === "audio/ogg"
                  ? "ogg"
                  : "webm";
            form.set("audio", blob, `answer.${extension}`);
            const transcript = await api("/api/interview/transcribe", form);
            finalAnswer = transcript.text;
            setDraft(finalAnswer);
          }
        } else stopMedia();
      }
      const data = await api("/api/interview/turn", {
        token: session.token,
        action,
        answer: action === "skip" ? "" : finalAnswer,
      });
      if (!mounted.current) return;
      if (data.report) {
        setResult({
          report: data.report,
          role,
          reason:
            session.endsAt && Date.now() >= session.endsAt
              ? "time"
              : action === "finish"
                ? reason
                : "completed",
          elapsed: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
        });
        setEnding(true);
        endingRef.current = true;
        stopMedia();
        router.replace("/app/interview/feedback");
      } else {
        setSession(data);
        setVoice(data.questionsComplete ? "idle" : "loading");
      }
      setDraft("");
      clearClip();
      setSeconds(0);
    } catch (e) {
      endingRef.current = false;
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Could not continue. Please retry.",
        );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  const expireInterview = useEffectEvent(() => {
    if (ending || endingRef.current) return;
    if (busy) {
      stopMedia();
      return;
    }
    void send("finish", "time");
  });
  useEffect(() => {
    if (!session?.endsAt) return;
    const deadline = session.endsAt;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) expireInterview();
    };
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [session?.endsAt]);

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
      const generation = mediaGeneration.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (!mounted.current || generation !== mediaGeneration.current) {
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
        const blob = new Blob(chunks, { type: mime });
        if (finishRecording.current) {
          finishRecording.current(blob);
          return;
        }
        if (!mounted.current || generation !== mediaGeneration.current) return;
        setRecording(false);
        recordedBlob.current = blob;
        currentClip.current = URL.createObjectURL(blob);
        setClipUrl(currentClip.current);
        void transcribe(blob);
      };
      rec.onerror = () => {
        finishRecording.current?.(null);
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
                Questions
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  <option value={3}>3 main questions</option>
                  <option value={5}>5 main questions</option>
                </select>
              </label>
            </div>
            <label className="iv-duration-label">
              Interview duration
              <select
                aria-label="Interview duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {[5, 10, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
              <small>
                The interview ends when the timer reaches zero, or when you end
                the call.
              </small>
            </label>
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
              answers are capped at 90 seconds. Your timed session stays in this
              tab. Feedback opens on a separate page after the call ends.
            </p>
          </aside>
        </div>
      </main>
    );

  return (
    <main ref={room} className="interview-studio iv-conference">
      <header className="iv-call-header">
        <div>
          <span className="iv-call-brand">
            TOPFIT <span>MEET</span>
          </span>
          <h1>{role}</h1>
          <p>
            <ShieldCheck size={12} /> Private AI practice · {session.mainTotal}{" "}
            questions
          </p>
        </div>
        <div
          className={`iv-call-clock ${remaining <= 60 ? "iv-clock-warning" : ""}`}
          role="timer"
          aria-label="Time remaining"
        >
          <Clock size={16} />
          <strong>
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </strong>
          <span>remaining</span>
        </div>
      </header>
      <div className="iv-meeting-body">
        <div className="iv-meeting-stage">
          <div className="iv-participant-grid">
            <section
              className={`iv-host-tile ${voice === "speaking" ? "iv-host-speaking" : ""}`}
              aria-label="AI interviewer"
            >
              <div className="iv-tile-top">
                <span className="iv-live-pill">
                  <i /> {voice === "speaking" ? "Speaking" : "Connected"}
                </span>
                <button
                  aria-label="Toggle fullscreen"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else void room.current?.requestFullscreen?.();
                  }}
                >
                  <Maximize2 size={15} />
                </button>
              </div>
              <div className="iv-host-backdrop" />
              <InterviewerPortrait speaking={voice === "speaking"} />
              <div className="iv-host-identity">
                <span className="iv-host-name">
                  Morgan <span>AI INTERVIEWER</span>
                </span>
                <p>
                  {!voiceEnabled
                    ? "Voice muted"
                    : voice === "speaking"
                      ? "Asking your next question…"
                      : session.questionsComplete
                        ? "Round complete"
                        : voice === "loading"
                          ? "Preparing question audio…"
                          : voice === "unavailable"
                            ? "Voice unavailable · read the question below"
                            : "Listening to your story"}
                </p>
              </div>
              <div className="iv-sound-bars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.13}s` }} />
                ))}
              </div>
            </section>
            <div className="iv-self-tile">
              {cameraPanel}
              <span className="iv-you-status">
                {recording ? "Your microphone is recording" : "Microphone off"}
              </span>
            </div>
          </div>
          <section className="iv-live-question">
            <div>
              <span>
                {session.questionsComplete
                  ? "ROUND WRAPPED"
                  : session.isFollowup
                    ? "FOLLOW-UP QUESTION"
                    : `QUESTION ${session.mainNumber} OF ${session.mainTotal}`}
              </span>
              <button
                disabled={
                  recording || !!busy || ending || session.questionsComplete
                }
                onClick={() => {
                  setVoiceEnabled(true);
                  setVoice("loading");
                  setReplay((n) => n + 1);
                }}
              >
                <Play size={13} /> Replay
              </button>
            </div>
            <h2>
              {session.questionsComplete
                ? "That’s all my questions. Thank you for sharing your experience."
                : session.question.question}
            </h2>
            <p>
              {session.questionsComplete
                ? "End the call whenever you’re ready to see your feedback, or stay until the timer ends."
                : "Take your time. Your next question will build on what you share."}
            </p>
          </section>
          <div className="iv-call-toolbar">
            <div>
              <button
                className={recording ? "iv-control-active" : ""}
                disabled={!!busy || ending || session.questionsComplete}
                onClick={() =>
                  recording
                    ? recorder.current?.state === "recording" &&
                      recorder.current.stop()
                    : void startRecording()
                }
              >
                {recording ? <Square size={19} /> : <Mic size={19} />}
                <span>{recording ? "Stop recording" : "Microphone"}</span>
              </button>
              <button
                disabled={cameraBusy || !!busy || ending}
                onClick={toggleCamera}
              >
                {cameraOn ? <Video size={19} /> : <VideoOff size={19} />}
                <span>Camera</span>
              </button>
              <button
                disabled={ending}
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  setVoice("idle");
                }}
              >
                {voiceEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
                <span>Speaker</span>
              </button>
            </div>
            <button
              className="iv-end-call"
              disabled={!!busy || ending}
              onClick={() => void send("finish")}
            >
              <PhoneOff size={19} />
              <span>End interview</span>
            </button>
          </div>
          <p className="iv-call-privacy">
            <ShieldCheck size={12} /> Video stays on your device. Morgan is a
            voiced AI with a profile photo, not a live person.
          </p>
        </div>
        <aside className="iv-meeting-notes">
          <h2>
            <Users size={15} /> In this room <span>2</span>
          </h2>
          <div className="iv-roster">
            <span>M</span>
            <div>
              Morgan<small>AI interviewer · Host</small>
            </div>
            <i />
          </div>
          <div className="iv-roster">
            <span>Y</span>
            <div>
              You<small>Interview candidate</small>
            </div>
            <i />
          </div>
          <h3>Conversation</h3>
          <p className="iv-notes-help">
            Your transcript stays here during the call. Scores and feedback are
            revealed after you leave the room.
          </p>
          <div className="iv-call-transcript">
            {session.turns.length ? (
              session.turns.map((t, i) => (
                <details key={i}>
                  <summary>
                    {t.followup ? "Follow-up" : `Question ${t.mainIndex + 1}`}
                    <ChevronDown size={13} />
                  </summary>
                  <strong>{t.question}</strong>
                  <p>{t.answer}</p>
                </details>
              ))
            ) : (
              <div className="iv-transcript-empty">
                <Mic size={23} />
                <p>Your conversation starts with your first answer.</p>
              </div>
            )}
          </div>
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
          disabled={
            recording ||
            !!busy ||
            ending ||
            !!session.questionsComplete ||
            remaining === 0
          }
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
              disabled={
                !!busy ||
                recording ||
                ending ||
                !!session.questionsComplete ||
                remaining === 0
              }
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
                disabled={
                  !!busy ||
                  ending ||
                  !!session.questionsComplete ||
                  remaining === 0
                }
              >
                <Mic size={16} /> Record answer
              </button>
            )}
            <button
              className="iv-text-button"
              onClick={() => send("skip")}
              disabled={
                !!busy ||
                recording ||
                ending ||
                !!session.questionsComplete ||
                remaining === 0
              }
            >
              Skip question
            </button>
          </div>
          <button
            className="iv-primary-button"
            onClick={() => send("answer")}
            disabled={
              !!busy ||
              recording ||
              ending ||
              !!session.questionsComplete ||
              remaining === 0 ||
              draft.trim().length < 2
            }
          >
            <Send size={15} /> Send answer
          </button>
        </div>
      </section>
      {ending && (
        <div className="iv-ending-overlay" role="status">
          <div>
            <LoaderCircle className="animate-spin" size={32} />
            <h2>
              {endReason === "time" ? "Your time is up." : "Interview ended."}
            </h2>
            <p>Putting together your scoreboard and feedback…</p>
            {error && (
              <>
                <p role="alert">{error}</p>
                <button
                  className="iv-primary-button"
                  disabled={!!busy}
                  onClick={() => void send("finish", endReason || "manual")}
                >
                  Retry feedback
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function InterviewerPortrait({ speaking }: { speaking: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`iv-portrait iv-photo-portrait ${speaking ? "is-speaking" : ""}`}
    >
      {failed ? (
        <span
          className="iv-portrait-fallback"
          role="img"
          aria-label="Morgan, AI interviewer"
        >
          M
        </span>
      ) : (
        <Image
          src="https://randomuser.me/api/portraits/women/44.jpg"
          alt="Morgan’s AI interviewer profile"
          width={256}
          height={256}
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
      <span className="iv-ai-badge">AI</span>
    </div>
  );
}
