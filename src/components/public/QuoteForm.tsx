import { useState, type FormEvent } from 'react'
import { CheckCircle2, Clock, Phone, ShieldCheck } from 'lucide-react'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'
import { BUDGET_OPTIONS, BUDGET_VALUE, ENQUIRY_TYPES } from '@/lib/constants'
import { whatsappLink } from '@/lib/whatsapp'
import { IMAGES } from '@/data/images'
import { Button, buttonClass } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import type { EnquiryType } from '@/types'

const EMPTY = { name: '', phone: '', email: '', postcode: '', enquiry_type: '', budget: '', message: '' }
type Form = typeof EMPTY
type Errors = Partial<Record<keyof Form, string>>

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

function validate(f: Form): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name'
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Please enter a valid phone number'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Please enter a valid email address'
  if (!UK_POSTCODE.test(f.postcode.trim())) e.postcode = 'Please enter a valid UK postcode'
  if (!f.enquiry_type) e.enquiry_type = 'Please choose an enquiry type'
  if (!f.budget) e.budget = 'Please choose an approximate budget'
  return e
}

export function QuoteForm() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const toast = useToast()
  const s = useSettings()

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please check the form', 'A few fields need your attention.')
      return
    }
    setSubmitting(true)
    try {
      await db.insertAnonymous('leads', {
        customer_id: null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        postcode: form.postcode.trim().toUpperCase(),
        enquiry_type: form.enquiry_type as EnquiryType,
        budget: form.budget,
        message: form.message.trim(),
        status: 'new',
        estimated_value: BUDGET_VALUE[form.budget] ?? 0,
        source: 'Website',
      })
      setDone(form.name.split(' ')[0] ?? '')
      setForm(EMPTY)
      toast.success('Quote request sent', "Thank you — we'll be in touch within one working day.")
    } catch (err) {
      toast.error('Sorry, something went wrong', err instanceof Error ? err.message : 'Please try again or call us.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="quote" className="relative isolate scroll-mt-20 overflow-hidden bg-navy-900 py-24 lg:py-36">
      <img src={IMAGES.quoteBg} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-25" loading="lazy" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900/95 to-navy-900/70" />
      <div className="container-x grid gap-14 lg:grid-cols-5 lg:gap-20">
        <div className="text-white lg:col-span-2">
          <p className="eyebrow reveal !text-aqua-300">Free quote</p>
          <h2 className="reveal mt-4 font-display text-4xl leading-[1.05] font-medium sm:text-5xl lg:text-6xl">Let's talk about your pool.</h2>
          <p className="reveal mt-6 text-lg leading-relaxed text-slate-300">
            Tell us a little about your project and one of our designers will call you to arrange a free, no-obligation consultation.
          </p>
          <ul className="reveal mt-10 space-y-5">
            {[
              { icon: Clock, t: 'Reply within one working day' },
              { icon: ShieldCheck, t: 'Fixed-price, itemised quotes' },
              { icon: Phone, t: `Prefer to talk? Call ${s.phone}` },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-4 text-slate-200">
                <span className="flex size-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15"><Icon className="size-5 text-aqua-300" /></span>
                {t}
              </li>
            ))}
          </ul>
          <a href={whatsappLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'lg', 'reveal mt-10')}>
            <WhatsAppIcon className="size-5" /> Chat on WhatsApp
          </a>
        </div>

        <div className="reveal lg:col-span-3">
          <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
            {done !== null ? (
              <div className="flex animate-scale-in flex-col items-center py-14 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
                <h3 className="mt-6 font-display text-4xl text-navy-900">Thank you{done ? `, ${done}` : ''}.</h3>
                <p className="mt-3 max-w-md text-slate-600">Your request has been received. A member of our design team will contact you within one working day to arrange your consultation.</p>
                <Button variant="outline" className="mt-8" onClick={() => setDone(null)}>Send another enquiry</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
                <Input label="Full name" required autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Jane Smith" />
                <Input label="Phone" required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="07700 900000" />
                <Input label="Email" required type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="jane@example.com" />
                <Input label="Postcode" required autoComplete="postal-code" value={form.postcode} onChange={set('postcode')} error={errors.postcode} placeholder="KT11 2DH" />
                <Select label="Enquiry type" required value={form.enquiry_type} onChange={set('enquiry_type')} error={errors.enquiry_type} placeholder="Select an option" options={ENQUIRY_TYPES} />
                <Select label="Approximate budget" required value={form.budget} onChange={set('budget')} error={errors.budget} placeholder="Select a range" options={BUDGET_OPTIONS} />
                <Textarea label="Message" className="sm:col-span-2" value={form.message} onChange={set('message')} placeholder="Tell us about your garden, ideas and timescales…" rows={5} />
                <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">By submitting you agree to our privacy policy. We never share your details.</p>
                  <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">Request a Free Quote</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
