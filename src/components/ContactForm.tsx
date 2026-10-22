"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  User,
} from "lucide-react";

const TOPICS = ["General question", "Support", "Billing", "Teams and coaching", "Feedback"];

const inputClass =
  "w-full rounded-xl border border-line bg-white py-3 pl-11 pr-3.5 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-forest-400 focus:ring-4 focus:ring-forest-100";
const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your message.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[28px] border border-forest-200 bg-forest-50 p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest-900 text-white shadow-pop">
          <Send className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          Thanks for writing. We read every message and reply to the email address you gave us,
          usually within two business days.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setName("");
            setEmail("");
            setMessage("");
            setTopic(TOPICS[0]);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-forest-900 shadow-sm transition hover:border-forest-300"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-semibold text-ink">
            Your name
          </label>
          <div className="relative mt-2">
            <User className={iconClass} />
            <input
              id="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <div className="relative mt-2">
            <Mail className={iconClass} />
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-topic" className="text-sm font-semibold text-ink">
          Topic
        </label>
        <div className="relative mt-2">
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full appearance-none rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="text-sm font-semibold text-ink">
          Message
        </label>
        <div className="relative mt-2">
          <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <textarea
            id="contact-message"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you need. Interview coming up, a question about your pack, or an idea for the product."
            className="w-full resize-y rounded-xl border border-line bg-white py-3 pl-11 pr-3.5 text-[15px] leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
          />
        </div>
      </div>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-[15px] font-semibold text-white shadow-pop transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
        {busy ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
