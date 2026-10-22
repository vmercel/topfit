import { Clock, Mail, MessageSquare } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:pb-24 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest-800">
              <span className="h-1.5 w-1.5 rounded-full bg-copper-500" />
              Contact
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Talk to a human about your prep
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Questions about a pack, a plan, or a team rollout. Send a message and we will get
              back to you.
            </p>

            <div className="mt-9 space-y-4">
              <a
                href="mailto:support@topfit.app"
                className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-900 text-white shadow-pop">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold tracking-tight text-ink">
                    Email us directly
                  </span>
                  <span className="block text-sm text-forest-700">support@topfit.app</span>
                </span>
              </a>
              <div className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
                  <Clock className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold tracking-tight text-ink">
                    Response time
                  </span>
                  <span className="block text-sm text-ink-soft">
                    Usually within two business days
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700 ring-1 ring-forest-100">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold tracking-tight text-ink">
                    Interview this week?
                  </span>
                  <span className="block text-sm text-ink-soft">
                    Say so in your message and we will move it to the front.
                  </span>
                </span>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
