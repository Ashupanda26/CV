import type { EnquiryType, GalleryCategory, LeadStatus, ProjectStatus, QuoteStatus, TicketPriority, TicketStatus } from '@/types'

const opts = <T extends string>(pairs: Array<[T, string]>) => pairs.map(([value, label]) => ({ value, label }))

export const LEAD_STATUSES = opts<LeadStatus>([['new', 'New'], ['contacted', 'Contacted'], ['site_visit', 'Site Visit'], ['quote_sent', 'Quote Sent'], ['won', 'Won'], ['lost', 'Lost']])
export const PROJECT_STATUSES = opts<ProjectStatus>([['planning', 'Planning'], ['design', 'Design'], ['approved', 'Approved'], ['construction', 'Construction'], ['completed', 'Completed']])
export const QUOTE_STATUSES = opts<QuoteStatus>([['draft', 'Draft'], ['sent', 'Sent'], ['approved', 'Approved'], ['declined', 'Declined']])
export const TICKET_STATUSES = opts<TicketStatus>([['open', 'Open'], ['assigned', 'Assigned'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']])
export const TICKET_PRIORITIES = opts<TicketPriority>([['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']])

export const labelOf = (list: Array<{ value: string; label: string }>, v: string) => list.find((o) => o.value === v)?.label ?? v

export const ENQUIRY_TYPES: EnquiryType[] = ['New Pool Construction', 'Pool Design', 'Pool Renovation', 'Landscaping & Surrounds', 'Pool Maintenance']
export const BUDGET_OPTIONS = ['Under £30k', '£30k – £50k', '£50k – £80k', '£80k – £120k', '£120k – £200k', '£200k+', 'Not sure yet']
export const BUDGET_VALUE: Record<string, number> = {
  'Under £30k': 25000, '£30k – £50k': 42000, '£50k – £80k': 65000, '£80k – £120k': 98000, '£120k – £200k': 155000, '£200k+': 240000, 'Not sure yet': 60000,
}
export const GALLERY_CATEGORIES: GalleryCategory[] = ['New Pools', 'Luxury Pools', 'Renovations', 'Residential']
export const QUOTE_LINE_CATEGORIES = ['Pool construction', 'Filtration', 'Lighting', 'Landscaping', 'Other costs']
