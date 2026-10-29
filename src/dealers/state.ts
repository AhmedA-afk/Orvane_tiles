import { store } from '../lib/store'
import type { Order, OrderLine, Stage } from './data'

// What a dealer builds up in the portal on this device: the order being put
// together, the orders sent, and where each prospect stands. A real portal
// keeps these on the manufacturer's server.

export const cart = store<OrderLine[]>('orvane-dealer-cart', [])
export const placed = store<Order[]>('orvane-dealer-orders', [])
export const stages = store<Record<string, Stage>>('orvane-dealer-stages', {})
/** the enquiries the assistant has answered and routed, newest first */
export const routed = store<{ at: string; text: string; to: string; why: string }[]>('orvane-dealer-routed', [])

/** the dealer's own details, with a stand-in until they type theirs */
export const shopOf = (d: { showroom: string; city: string; phone: string }) => ({
  name: d.showroom.trim() || 'Your Tile Showroom',
  city: d.city.trim() || 'Pune',
  phone: d.phone.trim() || '+91 00000 00000',
})
