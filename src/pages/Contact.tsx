import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Send, TriangleAlert } from 'lucide-react'
import { Accordion } from '@/components/ui/Accordion'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { COMPANY, FAQS } from '@/data/site'

const CONTACT_CARDS = [
  { icon: MapPin, label: 'Address', value: COMPANY.address },
  { icon: Phone, label: 'Phone', value: COMPANY.phone },
  { icon: Mail, label: 'Email', value: COMPANY.email },
]

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Contact() {
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!WEB3FORMS_ACCESS_KEY) {
      // No access key configured — nothing to send to. Fail loudly instead of
      // pretending the message went somewhere.
      setStatus('error')
      return
    }

    setStatus('sending')
    const formData = new FormData(event.currentTarget)
    formData.append('access_key', WEB3FORMS_ACCESS_KEY)
    formData.append('subject', `New enquiry from ${COMPANY.name} website`)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      setStatus(result.success ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Contact
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                Let's talk about your project
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-lg leading-relaxed text-ink-500">
                Whether it's an ERP rollout or a new website, tell us where you're starting from.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <div className="space-y-4">
                {CONTACT_CARDS.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-6"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                        {label}
                      </div>
                      <div className="mt-1 text-sm font-medium text-ink-900">{value}</div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500">
                  We typically respond within one business day.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card sm:p-10">
                {status === 'sent' ? (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Send className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">
                      Message sent
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-ink-500">
                      Thanks for reaching out — we'll get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-ink-700">Name</label>
                        <input
                          required
                          name="name"
                          type="text"
                          className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-ink-700">Company</label>
                        <input
                          name="company"
                          type="text"
                          className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500"
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-ink-700">Email</label>
                        <input
                          required
                          name="email"
                          type="email"
                          className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500"
                          placeholder="you@company.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-ink-700">Phone</label>
                        <input
                          name="phone"
                          type="tel"
                          className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500"
                          placeholder="+91 00000 00000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink-700">
                        What are you looking to build?
                      </label>
                      <textarea
                        required
                        name="message"
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500"
                        placeholder="Tell us a bit about your ERP or web project..."
                      />
                    </div>

                    {status === 'error' && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {WEB3FORMS_ACCESS_KEY
                            ? "Something went wrong sending your message. Please try again, or email us directly at " +
                              COMPANY.email +
                              '.'
                            : 'The contact form is not connected yet — please email us directly at ' +
                              COMPANY.email +
                              ' for now.'}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'sending' ? 'Sending…' : 'Send message'}
                      {status !== 'sending' && (
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-ink-50/60 py-24">
        <Container>
          <SectionHeading eyebrow="FAQ" title="Common questions" align="left" />
          <div className="mt-10 max-w-3xl">
            <Accordion items={FAQS} />
          </div>
        </Container>
      </section>
    </div>
  )
}
