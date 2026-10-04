import { useSettings } from '@/context/SettingsContext'

export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const s = useSettings()
  const privacy = kind === 'privacy'
  const sections = privacy
    ? [
        ['What we collect', 'When you request a quote we collect your name, phone number, email address, postcode and any details you share about your project.'],
        ['How we use it', 'We use your details only to respond to your enquiry, prepare quotes, deliver your project and provide aftercare. We never sell your data.'],
        ['Storage & security', 'Your information is stored securely with our data processors in the UK/EU and access is restricted to BlueStone staff.'],
        ['Your rights', `You can ask to see, correct or delete your data at any time by emailing ${s.email}.`],
      ]
    : [
        ['Quotations', 'Quotes are valid for 30 days and are itemised. Any variation is agreed in writing before work proceeds.'],
        ['Payments', 'A deposit is due on acceptance, with staged payments at agreed milestones and the balance on handover.'],
        ['Guarantees', 'Concrete pool shells carry a 10-year structural guarantee. Equipment is covered by the manufacturers’ warranties.'],
        ['Website', 'Content on this website is for general information and does not form part of any contract.'],
      ]
  return (
    <div className="bg-white pt-32 pb-24">
      <div className="container-x max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="section-title mt-4">{privacy ? 'Privacy Policy' : 'Terms & Conditions'}</h1>
        <p className="mt-4 text-sm text-slate-500">Placeholder text for demonstration purposes — replace with the client’s reviewed legal copy.</p>
        <div className="mt-12 space-y-10">
          {sections.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-xl font-semibold text-navy-900">{h}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
