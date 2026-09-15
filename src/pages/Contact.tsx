import { useRef, useState, type FC, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Send, TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Accordion } from '@/components/ui/Accordion'
import { AnimatedText } from '@/components/ui/AnimatedText'
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

type FieldName = 'name' | 'company' | 'email' | 'phone' | 'message'
type FormValues = Record<FieldName, string>
type FormErrors = Partial<Record<FieldName, string>>
type TouchedFields = Partial<Record<FieldName, boolean>>

const EMPTY_VALUES: FormValues = { name: '', company: '', email: '', phone: '', message: '' }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
// Permissive on formatting (spaces, dashes, brackets, country code) — the digit
// count below is what actually decides whether a number is plausible.
const PHONE_PATTERN = /^\+?[\d\s()-]+$/

const MESSAGE_MIN = 20
const MESSAGE_MAX = 2000

// Submit validates in visual order so the first error we focus is the topmost one.
const FIELD_ORDER: FieldName[] = ['name', 'company', 'email', 'phone', 'message']

function validateField(field: FieldName, rawValue: string): string | undefined {
  const value = rawValue.trim()

  switch (field) {
    case 'name':
      if (!value) return 'Please enter your name.'
      if (value.length < 2) return 'Name must be at least 2 characters.'
      if (value.length > 80) return 'Name must be under 80 characters.'
      return undefined

    case 'company':
      if (value.length > 100) return 'Company name must be under 100 characters.'
      return undefined

    case 'email':
      if (!value) return 'Please enter your email address.'
      if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email, like you@company.com.'
      return undefined

    case 'phone': {
      if (!value) return undefined
      if (!PHONE_PATTERN.test(value)) return 'Phone can only contain digits, spaces, +, - and ().'
      const digits = value.replace(/\D/g, '')
      if (digits.length < 7) return 'Phone number is too short.'
      if (digits.length > 15) return 'Phone number is too long.'
      return undefined
    }

    case 'message':
      if (!value) return 'Please tell us what you need.'
      if (value.length < MESSAGE_MIN) return `Please add a little more detail (${MESSAGE_MIN}+ characters).`
      if (value.length > MESSAGE_MAX) return `Message must be under ${MESSAGE_MAX} characters.`
      return undefined
  }
}

const inputClass = (hasError: boolean) =>
  `mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? 'border-red-300 bg-red-50/40 focus:border-red-500'
      : 'border-ink-200 focus:border-brand-500'
  }`

const FieldLabel: FC<{ htmlFor: string; children: string; required?: boolean }> = ({
  htmlFor,
  children,
  required,
}) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
    {children}
    {required && (
      <>
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
        <span className="sr-only">(required)</span>
      </>
    )}
  </label>
)

const FieldError: FC<{ id: string; message?: string }> = ({ id, message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        id={id}
        role="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 overflow-hidden text-xs font-medium text-red-600"
      >
        <TriangleAlert className="mt-1.5 h-3.5 w-3.5 shrink-0" />
        <span className="mt-1.5">{message}</span>
      </motion.p>
    )}
  </AnimatePresence>
)

export function Contact() {
  const [status, setStatus] = useState<Status>('idle')
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({})

  const setField = (field: FieldName, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
    // Only re-validate mid-typing once the field has already been flagged, so
    // we're correcting an error rather than nagging during a first attempt.
    if (touched[field] || errors[field]) {
      setErrors(current => ({ ...current, [field]: validateField(field, value) }))
    }
  }

  const handleBlur = (field: FieldName) => {
    setTouched(current => ({ ...current, [field]: true }))
    setErrors(current => ({ ...current, [field]: validateField(field, values[field]) }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    for (const field of FIELD_ORDER) {
      const error = validateField(field, values[field])
      if (error) nextErrors[field] = error
    }

    setErrors(nextErrors)
    setTouched(Object.fromEntries(FIELD_ORDER.map(field => [field, true])))

    const firstInvalid = FIELD_ORDER.find(field => nextErrors[field])
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus()
      return
    }

    if (!WEB3FORMS_ACCESS_KEY) {
      // No access key configured — nothing to send to. Fail loudly instead of
      // pretending the message went somewhere.
      setStatus('error')
      return
    }

    setStatus('sending')
    const formData = new FormData()
    for (const field of FIELD_ORDER) {
      formData.append(field, values[field].trim())
    }
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

  const resetForm = () => {
    setValues(EMPTY_VALUES)
    setErrors({})
    setTouched({})
    setStatus('idle')
  }

  const messageLength = values.message.trim().length

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
            <AnimatedText
              as="h1"
              text="Let's talk about your project"
              highlight="your project"
              delay={0.1}
              className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl"
            />
            <Reveal delay={0.25} blur>
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
                {CONTACT_CARDS.map(({ icon: Icon, label, value }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4 }}
                    className="group flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-6 transition-colors hover:border-brand-200"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                        {label}
                      </div>
                      <div className="mt-1 text-sm font-medium text-ink-900">{value}</div>
                    </div>
                  </motion.div>
                ))}
                <div className="rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500">
                  We typically respond within one business day.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card sm:p-10">
                {status === 'sent' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex h-full min-h-[320px] flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"
                    >
                      <Send className="h-6 w-6" />
                    </motion.div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">
                      Message sent
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-ink-500">
                      Thanks for reaching out — we'll get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="link-underline mt-6 text-sm font-semibold text-brand-600"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <p className="text-xs text-ink-400">
                      Fields marked <span className="text-red-500">*</span> are required.
                    </p>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="name" required>
                          Name
                        </FieldLabel>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          ref={element => {
                            fieldRefs.current.name = element
                          }}
                          value={values.name}
                          onChange={event => setField('name', event.target.value)}
                          onBlur={() => handleBlur('name')}
                          aria-required="true"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? 'name-error' : undefined}
                          className={inputClass(Boolean(errors.name))}
                          placeholder="Your name"
                        />
                        <FieldError id="name-error" message={errors.name} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="company">Company</FieldLabel>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          autoComplete="organization"
                          ref={element => {
                            fieldRefs.current.company = element
                          }}
                          value={values.company}
                          onChange={event => setField('company', event.target.value)}
                          onBlur={() => handleBlur('company')}
                          aria-invalid={Boolean(errors.company)}
                          aria-describedby={errors.company ? 'company-error' : undefined}
                          className={inputClass(Boolean(errors.company))}
                          placeholder="Company name"
                        />
                        <FieldError id="company-error" message={errors.company} />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="email" required>
                          Email
                        </FieldLabel>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          ref={element => {
                            fieldRefs.current.email = element
                          }}
                          value={values.email}
                          onChange={event => setField('email', event.target.value)}
                          onBlur={() => handleBlur('email')}
                          aria-required="true"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          className={inputClass(Boolean(errors.email))}
                          placeholder="you@company.com"
                        />
                        <FieldError id="email-error" message={errors.email} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          ref={element => {
                            fieldRefs.current.phone = element
                          }}
                          value={values.phone}
                          onChange={event => setField('phone', event.target.value)}
                          onBlur={() => handleBlur('phone')}
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                          className={inputClass(Boolean(errors.phone))}
                          placeholder="+91 00000 00000"
                        />
                        <FieldError id="phone-error" message={errors.phone} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-4">
                        <FieldLabel htmlFor="message" required>
                          What are you looking to build?
                        </FieldLabel>
                        <span
                          className={`text-xs tabular-nums ${
                            messageLength > MESSAGE_MAX ? 'text-red-600' : 'text-ink-400'
                          }`}
                        >
                          {messageLength}/{MESSAGE_MAX}
                        </span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        ref={element => {
                          fieldRefs.current.message = element
                        }}
                        value={values.message}
                        onChange={event => setField('message', event.target.value)}
                        onBlur={() => handleBlur('message')}
                        aria-required="true"
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                        className={inputClass(Boolean(errors.message))}
                        placeholder="Tell us a bit about your ERP or web project..."
                      />
                      <FieldError id="message-error" message={errors.message} />
                    </div>

                    {status === 'error' && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {WEB3FORMS_ACCESS_KEY
                            ? 'Something went wrong sending your message. Please try again, or email us directly at ' +
                              COMPANY.email +
                              '.'
                            : 'The contact form is not connected yet — please email us directly at ' +
                              COMPANY.email +
                              ' for now.'}
                        </span>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={status === 'sending'}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'sending' ? 'Sending…' : 'Send message'}
                      {status !== 'sending' && (
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </motion.button>
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
