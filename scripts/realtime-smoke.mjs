import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
process.loadEnvFile('.env.local')
const users = JSON.parse(await readFile('/tmp/tasty-qa-users.json', 'utf8'))
const make = () =>
  createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
const a = make(),
  b = make()
for (const [i, c] of [a, b].entries()) {
  const { error } = await c.auth.signInWithPassword(users[i])
  assert.equal(error, null)
}
const { data: rooms, error } = await a
  .from('game_rooms')
  .select('*')
  .eq('kind', 'roulette')
  .limit(1)
assert.equal(error, null)
assert.ok(rooms.length)
const room = rooms[0]
console.log('Room found; checking authenticated realtime.')
await b.realtime.setAuth((await b.auth.getSession()).data.session.access_token)
let resolveEvent, rejectEvent
const received = new Promise((resolve, reject) => {
  resolveEvent = resolve
  rejectEvent = reject
})
received.catch(() => {})
const timer = setTimeout(() => rejectEvent(new Error('Realtime event timed out')), 25000)
const channel = b
  .channel('tasty-qa-realtime')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` },
    (payload) => resolveEvent(payload.new),
  )
try {
  await new Promise((resolve, reject) =>
    channel.subscribe((status, err) => {
      console.log('Subscription:', status, err?.message || '')
      if (status === 'SUBSCRIBED') resolve()
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status))
    }),
  )
  const { data: expected, error } = await a.rpc('spin_game', { room: room.id })
  assert.equal(error, null)
  const actual = await received
  assert.equal(actual.result_dish_id, expected)
  console.log('PASS: result broadcast to the second authenticated player over Supabase Realtime.')
} finally {
  clearTimeout(timer)
  await b.removeChannel(channel)
  await a.auth.signOut()
  await b.auth.signOut()
}
