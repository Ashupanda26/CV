export const DEFAULT_WHATSAPP_MESSAGE =
  "Hi, I'm interested in having a swimming pool built and would like to discuss my requirements."

/** Builds a click-to-chat link. Number may contain spaces/+; wa.me needs digits only in international format. */
export function whatsappLink(number: string, message = DEFAULT_WHATSAPP_MESSAGE) {
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `44${digits.slice(1)}` // UK local -> international
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(number: string, message?: string) {
  window.open(whatsappLink(number, message), '_blank', 'noopener,noreferrer')
}
