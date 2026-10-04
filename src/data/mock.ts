/**
 * Realistic seed data. Used directly in mock mode, and pushed to Supabase by
 * `npm run seed` so a freshly connected project looks identical.
 * Dates are relative to "now" so the dashboard always looks current.
 */
import type {
  AppUser, BusinessSettings, Customer, Feedback, GalleryItem, Lead, MaintenanceTicket,
  Message, Project, ProjectStatus, ProjectUpdate, Quote, QuoteItem, TableMap, EnquiryType, LeadStatus,
} from '@/types'
import { pool } from './images'

// Deterministic UUIDs so relationships survive seeding into Postgres.
const id = (prefix: number, n: number) =>
  `00000000-0000-4000-8${String(prefix).padStart(3, '0')}-${String(n).padStart(12, '0')}`

const DAY = 86_400_000
const now = Date.now()
const daysAgo = (d: number, hour = 10) => {
  const t = new Date(now - d * DAY)
  t.setHours(hour, (d * 17) % 60, 0, 0)
  return t.toISOString()
}
const dateOnly = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString().slice(0, 10)

// Small seeded PRNG so generated data is stable between reloads.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(42)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!

// ---------------------------------------------------------------- customers
const C = (n: number) => id(1, n)
const customerRows: Array<[string, string, string, string, Customer['status'], number]> = [
  ['John Smith', '07700 900123', '14 Fairmile Lane, Cobham', 'KT11 2DH', 'active', 210],
  ['Sarah Johnson', '07700 900456', '3 Oak Ridge, Weybridge', 'KT13 9QP', 'prospect', 2],
  ['Emma Clarke', '07700 900789', 'The Old Rectory, Esher', 'KT10 8AN', 'completed', 400],
  ['Oliver Bennett', '07700 900234', '22 Wentworth Drive, Virginia Water', 'GU25 4NY', 'active', 150],
  ['Charlotte Hughes', '07700 900567', 'Birchwood House, Sunningdale', 'SL5 0LP', 'active', 120],
  ['James Whitfield', '07700 900890', '8 Marlow Road, Henley-on-Thames', 'RG9 2HU', 'completed', 520],
  ['Priya Sharma', '07700 900345', '41 Downside Road, Guildford', 'GU4 8PH', 'active', 95],
  ["Michael O'Connor", '07700 900678', 'Larch Cottage, Sevenoaks', 'TN13 1JB', 'active', 60],
  ['Sophie Turner', '07700 900901', '17 Heath Rise, Ascot', 'SL5 7DQ', 'completed', 330],
  ['Richard Ashworth', '07700 900112', 'Ashworth Manor, Oxshott', 'KT22 0SL', 'active', 40],
  ['Hannah Patel', '07700 900223', '5 The Spinney, Tunbridge Wells', 'TN2 5RU', 'prospect', 12],
  ['Thomas Reid', '07700 900334', '29 Riverside Walk, Marlow', 'SL7 1QA', 'completed', 610],
]
export const customers: Customer[] = customerRows.map(([name, phone, address, postcode, status, age], i) => ({
  id: C(i + 1),
  name,
  phone,
  email: `${name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').join('.')}@example.co.uk`,
  address,
  postcode,
  status,
  created_at: daysAgo(age),
}))

// ---------------------------------------------------------------- projects
export const PROJECT_STAGES = [
  'Consultation', 'Design', 'Quote Approved', 'Excavation', 'Plumbing', 'Tiling', 'Finishing', 'Handover',
] as const

const P = (n: number) => id(2, n)
interface ProjectSeed { name: string; customer: number; location: string; pool_type: string; value: number; start: number; end: number; status: ProjectStatus; stagesDone: number; img: number[]; description: string }
const projectSeeds: ProjectSeed[] = [
  { name: 'Smith Residence', customer: 1, location: 'Cobham, Surrey', pool_type: 'Rectangular concrete pool, 10m × 4m', value: 86500, start: -48, end: 34, status: 'construction', stagesDone: 4, img: [0, 3], description: 'Contemporary family pool with Porcelanosa tiling, automatic slatted cover and LED lighting.' },
  { name: 'Clarke Garden Pool', customer: 3, location: 'Esher, Surrey', pool_type: 'Natural stone freeform pool', value: 112000, start: -380, end: -290, status: 'completed', stagesDone: 8, img: [5, 2], description: 'Freeform pool set into a walled kitchen garden with a sandstone surround.' },
  { name: 'Wentworth Infinity Pool', customer: 4, location: 'Virginia Water, Surrey', pool_type: 'Infinity edge, 14m × 5m', value: 248000, start: -60, end: 75, status: 'construction', stagesDone: 3, img: [1, 11], description: 'Vanishing-edge pool overlooking the golf course, with a glass-fronted plant room.' },
  { name: 'Birchwood House Pool', customer: 5, location: 'Sunningdale, Berkshire', pool_type: 'Indoor pool with spa', value: 174000, start: -20, end: 140, status: 'approved', stagesDone: 3, img: [6, 4], description: 'Indoor pool hall with integrated spa, counter-current swim jet and dehumidification.' },
  { name: 'Whitfield Riverside Pool', customer: 6, location: 'Henley-on-Thames, Oxfordshire', pool_type: 'Rectangular with sun ledge', value: 96000, start: -500, end: -410, status: 'completed', stagesDone: 8, img: [8, 9], description: 'Lap pool with sun ledge and travertine terrace stepping down to the river.' },
  { name: 'Sharma Family Pool', customer: 7, location: 'Guildford, Surrey', pool_type: 'L-shaped pool with shallow area', value: 72000, start: 14, end: 110, status: 'design', stagesDone: 1, img: [3, 0], description: 'Child-friendly L-shaped pool with a wide shallow entry and safety cover.' },
  { name: "O'Connor Pool Renovation", customer: 8, location: 'Sevenoaks, Kent', pool_type: 'Renovation — 1980s liner pool', value: 38500, start: -12, end: 30, status: 'construction', stagesDone: 5, img: [7, 10], description: 'Full renovation: new mosaic finish, coping, heat pump and LED lighting.' },
  { name: 'Turner Garden Retreat', customer: 9, location: 'Ascot, Berkshire', pool_type: 'Plunge pool & outdoor kitchen', value: 58000, start: -300, end: -240, status: 'completed', stagesDone: 8, img: [2, 6], description: 'Heated plunge pool with porcelain terrace and pergola-covered outdoor kitchen.' },
  { name: 'Ashworth Manor Pool', customer: 10, location: 'Oxshott, Surrey', pool_type: 'Luxury infinity pool & pool house', value: 315000, start: 30, end: 210, status: 'planning', stagesDone: 1, img: [11, 1], description: 'Statement infinity pool with stone pool house, sauna and landscaped lawns.' },
  { name: 'Reid Lap Pool', customer: 12, location: 'Marlow, Buckinghamshire', pool_type: 'Lap pool, 20m × 3m', value: 104000, start: -620, end: -540, status: 'completed', stagesDone: 8, img: [9, 4], description: 'Minimalist 20m lap pool with flush coping and concealed automatic cover.' },
]
export const projects: Project[] = projectSeeds.map((p, i) => ({
  id: P(i + 1),
  customer_id: C(p.customer),
  name: p.name,
  location: p.location,
  pool_type: p.pool_type,
  description: p.description,
  value: p.value,
  start_date: dateOnly(p.start),
  expected_completion: dateOnly(p.end),
  status: p.status,
  progress: Math.round((p.stagesDone / PROJECT_STAGES.length) * 100),
  images: p.img.map((n) => pool(n)),
  created_at: daysAgo(Math.max(5, -p.start + 30)),
}))

export const project_updates: ProjectUpdate[] = projectSeeds.flatMap((p, pi) =>
  PROJECT_STAGES.map((stage, si) => {
    const completed = si < p.stagesDone
    return {
      id: id(3, pi * 10 + si + 1),
      project_id: P(pi + 1),
      stage,
      note: completed ? `${stage} signed off.` : si === p.stagesDone ? 'In progress.' : '',
      sort_order: si,
      completed,
      completed_at: completed ? daysAgo(Math.max(1, -p.start - si * 6 + 40)) : null,
      created_at: daysAgo(Math.max(1, -p.start + 30)),
    }
  }),
)

// ---------------------------------------------------------------- leads
const L = (n: number) => id(4, n)
const ENQUIRY_TYPES: EnquiryType[] = ['New Pool Construction', 'Pool Renovation', 'Landscaping & Surrounds', 'Pool Maintenance', 'Pool Design']
const BUDGETS = ['£30k – £50k', '£50k – £80k', '£80k – £120k', '£120k – £200k', '£200k+']
const BUDGET_VALUE: Record<string, number> = { '£30k – £50k': 42000, '£50k – £80k': 65000, '£80k – £120k': 98000, '£120k – £200k': 155000, '£200k+': 240000 }
const FIRST = ['Lucy', 'George', 'Amelia', 'Harry', 'Isla', 'Jack', 'Grace', 'Noah', 'Freya', 'William', 'Ella', 'Henry', 'Poppy', 'Arthur', 'Daisy', 'Edward', 'Alice', 'Leo', 'Florence', 'Max']
const LAST = ['Walker', 'Wright', 'Robinson', 'Thompson', 'White', 'Hall', 'Green', 'Wood', 'Harris', 'Martin', 'Cooper', 'King', 'Baker', 'Morgan', 'Fletcher', 'Lloyd', 'Shaw', 'Holmes', 'Grant', 'Pearce']
const TOWNS = [['Cobham', 'KT11'], ['Weybridge', 'KT13'], ['Esher', 'KT10'], ['Guildford', 'GU1'], ['Sevenoaks', 'TN13'], ['Ascot', 'SL5'], ['Reigate', 'RH2'], ['Farnham', 'GU9'], ['Beaconsfield', 'HP9'], ['Haslemere', 'GU27']] as const

const handLeads: Array<Partial<Lead> & { name: string; d: number }> = [
  { name: 'Sarah Johnson', customer_id: C(2), d: 0.1, enquiry_type: 'New Pool Construction', budget: '£80k – £120k', status: 'new', postcode: 'KT13 9QP', phone: '07700 900456', message: 'We have recently moved and would love a pool for the family — ideally ready for next summer. Garden is south-facing, roughly 30m deep.' },
  { name: 'Hannah Patel', customer_id: C(11), d: 1, enquiry_type: 'Pool Design', budget: '£50k – £80k', status: 'contacted', postcode: 'TN2 5RU', phone: '07700 900223', message: 'Looking for design ideas for a compact plunge pool with a hot tub.' },
  { name: 'Mark Ellison', customer_id: null, d: 2, enquiry_type: 'Pool Renovation', budget: '£30k – £50k', status: 'new', postcode: 'GU7 1AA', phone: '07700 900445', message: 'Our pool is 25 years old and the liner is failing. Interested in a full refurbishment.' },
  { name: 'Natalie Brooks', customer_id: null, d: 3, enquiry_type: 'New Pool Construction', budget: '£120k – £200k', status: 'site_visit', postcode: 'KT22 9BQ', phone: '07700 900556', message: 'Infinity pool overlooking the valley — can we arrange a site visit?' },
  { name: 'Daniel Foster', customer_id: null, d: 5, enquiry_type: 'Landscaping & Surrounds', budget: '£30k – £50k', status: 'quote_sent', postcode: 'RH2 0PQ', phone: '07700 900667', message: 'New porcelain terrace and lighting around an existing pool.' },
]

export const leads: Lead[] = [
  ...handLeads.map((h, i) => ({
    id: L(i + 1),
    customer_id: h.customer_id ?? null,
    name: h.name,
    email: `${h.name.toLowerCase().replace(' ', '.')}@example.co.uk`,
    phone: h.phone!,
    postcode: h.postcode!,
    enquiry_type: h.enquiry_type!,
    budget: h.budget!,
    message: h.message!,
    status: h.status!,
    estimated_value: BUDGET_VALUE[h.budget!]!,
    source: 'Website',
    created_at: new Date(now - h.d * DAY).toISOString(),
  })),
  // ~12 months of history for the charts, trending upwards into summer.
  ...Array.from({ length: 64 }, (_, i): Lead => {
    const d = 7 + Math.floor(rand() * 355)
    const name = `${pick(FIRST)} ${pick(LAST)}`
    const [town, pc] = pick(TOWNS)
    const budget = pick(BUDGETS)
    const status: LeadStatus = d > 60 ? pick(['won', 'lost', 'lost', 'won', 'quote_sent'] as const) : pick(['contacted', 'site_visit', 'quote_sent', 'won', 'new'] as const)
    const enquiry_type = pick(ENQUIRY_TYPES)
    return {
      id: L(100 + i),
      customer_id: null,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.co.uk`,
      phone: `07700 9${String(10000 + Math.floor(rand() * 89999)).slice(0, 5)}`,
      postcode: `${pc} ${1 + Math.floor(rand() * 9)}${pick(['AB', 'DH', 'LP', 'QR', 'NX'])}`,
      enquiry_type,
      budget,
      message: `Enquiry about ${enquiry_type.toLowerCase()} at our home in ${town}.`,
      status,
      estimated_value: BUDGET_VALUE[budget]!,
      source: pick(['Website', 'Website', 'WhatsApp', 'Referral', 'Instagram']),
      created_at: daysAgo(d, 9 + Math.floor(rand() * 9)),
    }
  }),
]

// ---------------------------------------------------------------- quotes
const Q = (n: number) => id(5, n)
const quoteSeeds: Array<{ customer: number; project: number | null; status: Quote['status']; d: number; items: [string, string, number][] }> = [
  { customer: 1, project: 1, status: 'approved', d: 70, items: [['Pool construction', 'Reinforced concrete shell 10m × 4m × 1.5m', 52000], ['Filtration', 'Variable-speed pump, glass media filter, UV', 8400], ['Lighting', '6 × colour LED lights with app control', 3600], ['Landscaping', 'Porcelain terrace 80m², planting', 16500], ['Other costs', 'Automatic slatted cover', 6000]] },
  { customer: 2, project: null, status: 'draft', d: 0.05, items: [['Pool construction', 'Concrete shell 9m × 4m with Roman steps', 48000], ['Filtration', 'Variable-speed pump & sand filter', 6200], ['Lighting', '4 × white LED lights', 2200], ['Landscaping', 'Natural stone coping & 60m² patio', 14000], ['Other costs', 'Heat pump', 7400]] },
  { customer: 4, project: 3, status: 'approved', d: 90, items: [['Pool construction', 'Infinity edge shell with catch basin', 168000], ['Filtration', 'Commercial-grade balance tank system', 22000], ['Lighting', '10 × RGB LED + edge lighting', 9800], ['Landscaping', 'Terrace, retaining walls, planting', 38200], ['Other costs', 'Glass-fronted plant room', 10000]] },
  { customer: 7, project: 6, status: 'sent', d: 6, items: [['Pool construction', 'L-shaped pool with shallow beach entry', 46000], ['Filtration', 'Variable-speed pump & cartridge filter', 6800], ['Lighting', '5 × colour LED lights', 3200], ['Landscaping', 'Sandstone surround 70m²', 11500], ['Other costs', 'Safety cover', 4500]] },
  { customer: 10, project: 9, status: 'sent', d: 3, items: [['Pool construction', 'Infinity pool 16m × 5m', 198000], ['Filtration', 'Balance tank & ozone system', 26000], ['Lighting', 'Architectural lighting scheme', 14000], ['Landscaping', 'Formal lawns, stone pool house surround', 52000], ['Other costs', 'Pool house sauna fit-out', 25000]] },
  { customer: 11, project: null, status: 'draft', d: 1, items: [['Pool construction', 'Plunge pool 4m × 3m', 28000], ['Filtration', 'Compact filtration & heat pump', 7200], ['Lighting', '2 × LED lights', 1100], ['Landscaping', 'Composite decking', 9500], ['Other costs', 'Integrated hot tub', 12000]] },
  { customer: 8, project: 7, status: 'approved', d: 30, items: [['Pool construction', 'Strip-out & re-render shell, glass mosaic', 21000], ['Filtration', 'Heat pump & new pump', 7800], ['Lighting', '4 × LED retrofit', 2400], ['Landscaping', 'New coping stones', 5300], ['Other costs', 'Skip hire & disposal', 2000]] },
]
export const quote_items: QuoteItem[] = []
export const quotes: Quote[] = quoteSeeds.map((q, i) => {
  q.items.forEach(([category, description, amount], j) =>
    quote_items.push({ id: id(6, i * 10 + j + 1), quote_id: Q(i + 1), category, description, amount, sort_order: j }),
  )
  return {
    id: Q(i + 1),
    quote_number: `Q-2026-${String(81 + i).padStart(4, '0')}`,
    customer_id: C(q.customer),
    project_id: q.project ? P(q.project) : null,
    status: q.status,
    notes: 'Price includes VAT. 30% deposit on approval, staged payments thereafter.',
    valid_until: dateOnly(30 - q.d),
    total: q.items.reduce((s, it) => s + it[2], 0),
    created_at: new Date(now - q.d * DAY).toISOString(),
  }
})

// ---------------------------------------------------------------- tickets
const ticketSeeds: Array<[number, number | null, string, string, MaintenanceTicket['priority'], MaintenanceTicket['status'], string, number]> = [
  [1, 1, 'Pool pump not working', 'Pump stopped overnight and is making a humming noise. Water is starting to look cloudy.', 'high', 'open', '', 0.2],
  [3, 2, 'Green tinge to water', 'Water turned slightly green after the heatwave despite regular dosing.', 'medium', 'assigned', 'Ben Carter', 1],
  [6, 5, 'Heat pump error code E3', 'Heat pump showing E3 and not heating.', 'high', 'in_progress', 'Ben Carter', 2],
  [9, 8, 'Cover not retracting fully', 'Automatic cover stops about 1m short when opening.', 'medium', 'open', '', 3],
  [12, 10, 'Annual service', 'Booking the annual service and filter change.', 'low', 'resolved', 'Liam Ford', 9],
  [3, 2, 'Loose coping stone', 'One coping stone near the steps has come loose.', 'medium', 'closed', 'Liam Ford', 21],
  [6, 5, 'LED light flickering', 'One underwater light flickers on the blue setting.', 'low', 'resolved', 'Ben Carter', 14],
  [9, 8, 'Winterisation', 'Please winterise the pool at the end of the season.', 'low', 'assigned', 'Liam Ford', 4],
]
export const maintenance_tickets: MaintenanceTicket[] = ticketSeeds.map(([c, p, issue, description, priority, status, assigned_to, d], i) => ({
  id: id(7, i + 1),
  ticket_number: 1042 - i,
  customer_id: C(c),
  project_id: p ? P(p) : null,
  issue,
  description,
  priority,
  status,
  assigned_to,
  created_at: new Date(now - d * DAY).toISOString(),
}))

// ---------------------------------------------------------------- feedback
const feedbackSeeds: Array<[number, number, string, number, string, boolean, number]> = [
  [3, 2, 'Esher, Surrey', 5, 'From the first sketch to the final handover, BlueStone were exceptional. The pool sits in our garden as if it had always been there.', true, 0.4],
  [6, 5, 'Henley-on-Thames', 5, 'Meticulous workmanship and a site team who treated our home with real respect. The travertine terrace is stunning.', true, 30],
  [9, 8, 'Ascot, Berkshire', 5, 'They turned a sloping, awkward corner of the garden into our favourite place to be. Communication was superb throughout.', true, 60],
  [12, 10, 'Marlow, Buckinghamshire', 4, 'A beautifully finished lap pool. Minor delay with the cover delivery, but handled honestly and professionally.', true, 90],
  [8, 7, 'Sevenoaks, Kent', 5, 'Our tired old pool looks brand new. Weekly WhatsApp photo updates meant we always knew exactly where things stood.', false, 5],
  [1, 1, 'Cobham, Surrey', 5, 'Halfway through and hugely impressed by the tidiness of the site and the quality of the shell work.', false, 8],
  [4, 3, 'Virginia Water, Surrey', 4, 'Design process was brilliant — the 3D visuals sold it to the whole family.', false, 40],
]
export const feedback: Feedback[] = feedbackSeeds.map(([c, p, loc, rating, comment, published, d], i) => {
  const name = customers[c - 1]!.name
  return {
    id: id(8, i + 1),
    customer_id: C(c),
    project_id: P(p),
    author_name: `${name.split(' ')[0]} ${name.split(' ').slice(-1)[0]![0]}.`,
    author_location: loc,
    rating,
    comment,
    published,
    created_at: new Date(now - d * DAY).toISOString(),
  }
})

// ---------------------------------------------------------------- messages
const threads: Array<[number, number | null, Array<[Message['direction'], string, number]>]> = [
  [1, 1, [['outbound', 'Morning John — plumbing crew are on site today, photos to follow this afternoon.', 0.6], ['inbound', 'Great, thanks. Also — the pump on the old water feature has stopped, I\'ve logged a ticket.', 0.25], ['inbound', 'Will the pool lights be wired this week too?', 0.1]]],
  [2, null, [['inbound', "Hi, I'm interested in having a swimming pool built and would like to discuss my requirements.", 0.15]]],
  [4, 3, [['outbound', 'Oliver, the excavation is complete and the steel fixers start Monday.', 3], ['inbound', 'Brilliant progress. Can we discuss moving the plant room door?', 2.5], ['outbound', 'Of course — I\'ll bring revised drawings on Thursday.', 2.4]]],
  [7, 6, [['outbound', 'Hi Priya, your quote Q-2026-0084 has been sent over — any questions just shout.', 6], ['inbound', 'Thanks! Could we add a safety cover option to compare?', 1.2]]],
  [8, 7, [['inbound', 'The new mosaic looks incredible 😍', 1], ['outbound', 'So glad you like it! Tiling will be finished by Friday.', 0.9]]],
  [11, null, [['inbound', 'Do you have availability for a design consultation next week?', 1.1]]],
  [5, 4, [['outbound', 'Charlotte, building control approval came through today 🎉', 4], ['inbound', 'Fantastic news, thank you!', 3.9]]],
]
let msgN = 0
export const messages: Message[] = threads.flatMap(([c, p, msgs]) =>
  msgs.map(([direction, body, d], i) => ({
    id: id(9, ++msgN),
    customer_id: C(c),
    project_id: p ? P(p) : null,
    direction,
    body,
    status: direction === 'outbound' ? 'replied' : i === msgs.length - 1 && d < 2 ? 'unread' : 'read',
    channel: 'whatsapp' as const,
    created_at: new Date(now - d * DAY).toISOString(),
  })),
)

// ---------------------------------------------------------------- gallery
const gallerySeeds: Array<[string, GalleryItem['category'], string, string, string, number]> = [
  ['The Wentworth', 'Luxury Pools', 'Virginia Water, Surrey', 'Infinity edge', 'A 14-metre vanishing-edge pool that dissolves into the fairway beyond.', 1],
  ['Clarke Walled Garden', 'New Pools', 'Esher, Surrey', 'Freeform natural stone', 'A sculpted freeform pool set within a restored Victorian walled garden.', 5],
  ['Riverside Lap Pool', 'Residential', 'Henley-on-Thames', 'Lap pool with sun ledge', 'Travertine terraces step gently down from the house to the water and river.', 8],
  ['Turner Retreat', 'New Pools', 'Ascot, Berkshire', 'Heated plunge pool', 'A compact heated plunge pool paired with an outdoor kitchen and pergola.', 2],
  ['Sevenoaks Revival', 'Renovations', 'Sevenoaks, Kent', 'Full renovation', 'A 1980s liner pool reborn with glass mosaic, new coping and LED lighting.', 7],
  ['Marlow Minimal', 'Luxury Pools', 'Marlow, Buckinghamshire', '20m lap pool', 'Flush coping and a concealed cover keep this lap pool impossibly clean-lined.', 9],
  ['Cobham Contemporary', 'Residential', 'Cobham, Surrey', 'Rectangular concrete', 'A crisp family pool framed by large-format porcelain and soft planting.', 0],
  ['Oxshott Pavilion', 'Luxury Pools', 'Oxshott, Surrey', 'Infinity pool & pool house', 'Statement pool with a stone pavilion, sauna and lawns rolling to the woodland.', 11],
  ['Guildford Family Pool', 'Residential', 'Guildford, Surrey', 'L-shaped with beach entry', 'Wide shallow beach entry makes this a pool the whole family can enjoy.', 3],
  ['Reigate Refurbishment', 'Renovations', 'Reigate, Surrey', 'Tile & surround upgrade', 'New porcelain surround, tiling and heat pump transformed a tired pool.', 10],
]
export const gallery_items: GalleryItem[] = gallerySeeds.map(([title, category, location, pool_type, description, img], i) => ({
  id: id(10, i + 1),
  title,
  category,
  location,
  pool_type,
  description,
  image_url: pool(img),
  published: i !== 9,
  sort_order: i,
  created_at: daysAgo(200 - i * 10),
}))

export const users: AppUser[] = [
  { id: id(11, 1), full_name: 'Alex Morgan', email: 'admin@bluestonepools.co.uk', role: 'admin', created_at: daysAgo(700) },
]

export const settings: BusinessSettings = {
  id: 1,
  company_name: 'BlueStone Pools',
  phone: '01932 555 010',
  email: 'hello@bluestonepools.co.uk',
  whatsapp_number: '+44 7700 900000',
  address: 'Unit 4, Brooklands Business Park, Weybridge, Surrey KT13 0YU',
  business_hours: 'Mon–Fri 8:00–18:00 · Sat 9:00–13:00',
  instagram_url: 'https://instagram.com/',
  facebook_url: 'https://facebook.com/',
  linkedin_url: 'https://linkedin.com/',
  youtube_url: 'https://youtube.com/',
}

export const seed: { [K in keyof TableMap]: TableMap[K][] } = {
  users, customers, leads, projects, project_updates, quotes, quote_items, maintenance_tickets, feedback, messages, gallery_items,
}
