import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeProfile } from "@/lib/resume";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-line pb-2 text-xs font-bold uppercase tracking-[0.16em] text-forest-700">
      {children}
    </h3>
  );
}

export default function ResumeView({ parsed }: { parsed: ResumeProfile }) {
  const contact = [
    parsed.email ? { icon: Mail, text: parsed.email } : null,
    parsed.phone ? { icon: Phone, text: parsed.phone } : null,
    parsed.location ? { icon: MapPin, text: parsed.location } : null,
    ...parsed.links.map((l) => ({ icon: Globe, text: l })),
  ].filter(Boolean) as { icon: typeof Mail; text: string }[];

  return (
    <div className="rounded-[28px] border border-line bg-white p-7 shadow-card sm:p-9">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-ink">
          {parsed.fullName || "Your resume"}
        </h2>
        {parsed.headline && (
          <p className="mt-1.5 text-[15px] font-semibold text-forest-700">{parsed.headline}</p>
        )}
        {contact.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
            {contact.map((c) => (
              <span key={c.text} className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                <c.icon className="h-4 w-4 text-forest-600" />
                {c.text}
              </span>
            ))}
          </div>
        )}
      </header>

      {parsed.summary && (
        <section className="mt-8">
          <SectionTitle>Summary</SectionTitle>
          <p className="mt-3.5 text-[15px] leading-relaxed text-ink-soft">{parsed.summary}</p>
        </section>
      )}

      {parsed.skills.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Skills</SectionTitle>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {parsed.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-forest-50 px-3 py-1 text-[13px] font-medium text-forest-800 ring-1 ring-forest-100"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {parsed.experience.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Experience</SectionTitle>
          <div className="mt-4 space-y-6">
            {parsed.experience.map((job, i) => (
              <article key={`${job.company}-${job.title}-${i}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-[15px] font-bold text-ink">
                    {job.title}
                    {job.company && <span className="font-semibold text-forest-800"> · {job.company}</span>}
                  </h4>
                  <p className="text-[13px] font-medium text-slate-500">
                    {[job.start, job.end].filter(Boolean).join(" to ")}
                    {job.location && <span> · {job.location}</span>}
                  </p>
                </div>
                {job.bullets.length > 0 && (
                  <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft marker:text-forest-400">
                    {job.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {parsed.education.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Education</SectionTitle>
          <ul className="mt-3.5 space-y-2">
            {parsed.education.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 text-[15px]">
                <span className="text-ink">
                  <span className="font-semibold">{e.degree}</span>
                  {e.school && <span className="text-ink-soft"> · {e.school}</span>}
                </span>
                {e.year && <span className="text-[13px] font-medium text-slate-500">{e.year}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {parsed.publications.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Publications</SectionTitle>
          <ul className="mt-3.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft marker:text-forest-400">
            {parsed.publications.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {parsed.languages.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Languages</SectionTitle>
          <p className="mt-3 text-[15px] text-ink-soft">{parsed.languages.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
