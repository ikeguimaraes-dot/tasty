import type { BillData, Restaurant } from './types'

export const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export function timeAgo(date: string) {
  const hours = Math.max(0, (Date.now() - new Date(date).getTime()) / 3600000)
  return hours < 1 ? 'agora' : hours < 24 ? `${Math.floor(hours)}h` : `${Math.floor(hours / 24)}d`
}
export function errorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Não foi possível concluir. Tente novamente.'
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Confira e tente novamente.'
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Confira também a caixa de spam.'
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado. Entre na sua conta.'
  if (message.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.'
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'Sem conexão no momento. Confira sua internet e tente novamente.'
  if (message.includes('profiles_username_key')) return 'Este nome de usuário já está em uso. Escolha outro.'
  if (message.includes('Password')) return 'Use uma senha com pelo menos 8 caracteres.'
  return message
}
export function distanceKm(lat: number, lng: number, r: Pick<Restaurant, 'latitude' | 'longitude'>) {
  const rad = Math.PI / 180
  const a = Math.sin((r.latitude-lat)*rad/2)**2 + Math.cos(lat*rad)*Math.cos(r.latitude*rad)*Math.sin((r.longitude-lng)*rad/2)**2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
export const distanceText = (km: number) => km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1).replace('.', ',')} km`

// Allocate integer cents, including the service fee, so shares always add up exactly.
export function splitBill(data: BillData) {
  const totals: Record<string, number> = Object.fromEntries(data.people.map(p => [p, 0]))
  let unassigned = 0
  for (const item of data.items) {
    const amount = Math.round(item.amount * 100)
    const consumers = item.people.filter(p => data.people.includes(p))
    if (!consumers.length) { unassigned += amount; continue }
    const base = Math.floor(amount / consumers.length)
    consumers.forEach((p, i) => { totals[p] += base + (i < amount % consumers.length ? 1 : 0) })
  }
  const subtotal = data.items.reduce((n,i) => n + Math.round(i.amount*100), 0)
  const service = Math.round(subtotal * data.service / 100)
  const assigned = subtotal - unassigned
  const assignedService = subtotal ? Math.round(service * assigned / subtotal) : 0
  let allocated = 0
  const fractions: { name: string; fraction: number }[] = []
  for (const person of data.people) {
    const share = assigned ? assignedService * totals[person] / assigned : 0
    fractions.push({ name: person, fraction: share % 1 })
    totals[person] += Math.floor(share)
    allocated += Math.floor(share)
  }
  fractions.sort((a,b) => b.fraction-a.fraction)
  for (let i=0; i < assignedService-allocated; i++) totals[fractions[i].name]++
  return { totals, subtotal, service, total: subtotal+service, unassigned: unassigned+service-assignedService }
}

export function parseReceipt(text: string) {
  return text.split('\n').flatMap(line => {
    const match = line.trim().match(/^(.{2,}?)\s+(?:R\$\s*)?(\d+[.,]\d{2})\s*$/)
    if (!match || /total|troco|dinheiro|cart[aã]o|cnpj|tribut|servi[cç]o|desconto|subtotal/i.test(match[1])) return []
    return [{ id: crypto.randomUUID(), name: match[1].trim(), amount: Number(match[2].replace(',','.')), people: [] }]
  })
}
