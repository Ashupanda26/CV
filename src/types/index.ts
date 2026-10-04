// Domain types — these mirror the tables in supabase/schema.sql one-to-one.

export type ID = string

export type LeadStatus = 'new' | 'contacted' | 'site_visit' | 'quote_sent' | 'won' | 'lost'
export type CustomerStatus = 'prospect' | 'active' | 'completed'
export type ProjectStatus = 'planning' | 'design' | 'approved' | 'construction' | 'completed'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'declined'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MessageStatus = 'unread' | 'read' | 'replied'
export type MessageDirection = 'inbound' | 'outbound'
export type GalleryCategory = 'New Pools' | 'Luxury Pools' | 'Renovations' | 'Residential'
export type EnquiryType =
  | 'New Pool Construction'
  | 'Pool Design'
  | 'Pool Renovation'
  | 'Landscaping & Surrounds'
  | 'Pool Maintenance'

export interface AppUser {
  id: ID
  full_name: string
  email: string
  role: 'admin' | 'staff'
  created_at: string
}

export interface Customer {
  id: ID
  name: string
  email: string
  phone: string
  address: string
  postcode: string
  status: CustomerStatus
  created_at: string
}

export interface Lead {
  id: ID
  customer_id: ID | null
  name: string
  email: string
  phone: string
  postcode: string
  enquiry_type: EnquiryType
  budget: string
  message: string
  status: LeadStatus
  estimated_value: number
  source: string
  created_at: string
}

export interface Project {
  id: ID
  customer_id: ID
  name: string
  location: string
  pool_type: string
  description: string
  value: number
  start_date: string
  expected_completion: string
  status: ProjectStatus
  progress: number
  images: string[]
  created_at: string
}

export interface ProjectUpdate {
  id: ID
  project_id: ID
  stage: string
  note: string
  sort_order: number
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface Quote {
  id: ID
  quote_number: string
  customer_id: ID
  project_id: ID | null
  status: QuoteStatus
  notes: string
  valid_until: string
  total: number
  created_at: string
}

export interface QuoteItem {
  id: ID
  quote_id: ID
  category: string
  description: string
  amount: number
  sort_order: number
}

export interface MaintenanceTicket {
  id: ID
  ticket_number: number
  customer_id: ID
  project_id: ID | null
  issue: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assigned_to: string
  created_at: string
}

export interface Feedback {
  id: ID
  customer_id: ID
  project_id: ID | null
  author_name: string
  author_location: string
  rating: number
  comment: string
  published: boolean
  created_at: string
}

export interface Message {
  id: ID
  customer_id: ID
  project_id: ID | null
  direction: MessageDirection
  body: string
  status: MessageStatus
  channel: 'whatsapp' | 'email' | 'sms'
  created_at: string
}

export interface GalleryItem {
  id: ID
  title: string
  category: GalleryCategory
  location: string
  pool_type: string
  description: string
  image_url: string
  published: boolean
  sort_order: number
  created_at: string
}

export interface BusinessSettings {
  id: number
  company_name: string
  phone: string
  email: string
  whatsapp_number: string
  address: string
  business_hours: string
  instagram_url: string
  facebook_url: string
  linkedin_url: string
  youtube_url: string
}

export interface TableMap {
  users: AppUser
  customers: Customer
  leads: Lead
  projects: Project
  project_updates: ProjectUpdate
  quotes: Quote
  quote_items: QuoteItem
  maintenance_tickets: MaintenanceTicket
  feedback: Feedback
  messages: Message
  gallery_items: GalleryItem
}

export type TableName = keyof TableMap
