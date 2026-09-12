import { createClient } from '@supabase/supabase-js'
import assert from 'node:assert/strict'
import { writeFile, readFile, unlink, access } from 'node:fs/promises'
process.loadEnvFile('.env.local')
if (process.env.TASTY_TEST_ENV) process.loadEnvFile(process.env.TASTY_TEST_ENV)
const url = process.env.VITE_SUPABASE_URL,
  key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!process.env.TASTY_TEST_SERVICE_KEY)
  throw new Error('Provide TASTY_TEST_SERVICE_KEY only to this server-side test process.')
const admin = createClient(url, process.env.TASTY_TEST_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const client = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const fixturePath = '/tmp/tasty-qa-users.json'
if (process.argv.includes('--cleanup')) {
  const users = JSON.parse(await readFile(fixturePath, 'utf8'))
  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  }
  await unlink(fixturePath)
  console.log('Temporary QA users and their associated records removed.')
  process.exit(0)
}
try {
  await access(fixturePath)
  throw new Error('Run with --cleanup before creating another set of QA fixtures.')
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const users = []
await writeFile(fixturePath, '[]', { mode: 0o600 })
for (let i = 0; i < 3; i++) {
  const email = `tasty-qa-${crypto.randomUUID()}@example.com`,
    password = `Tasty-QA-${crypto.randomUUID()}!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Teste Tasty ${i + 1}` },
  })
  if (error) throw error
  const c = client()
  const { error: loginError } = await c.auth.signInWithPassword({ email, password })
  assert.equal(loginError, null, 'email/password sign-in')
  const { error: profileError } = await c
    .from('profiles')
    .insert({
      id: data.user.id,
      auth_user_id: data.user.id,
      username: `qa_${data.user.id.replaceAll('-', '').slice(0, 16)}`,
      full_name: `Teste Tasty ${i + 1}`,
    })
  assert.equal(profileError, null, 'create own profile')
  users.push({ id: data.user.id, email, password })
  await writeFile(fixturePath, JSON.stringify(users), { mode: 0o600 })
}
const [a, b, c] = [client(), client(), client()]
for (const [i, cl] of [a, b, c].entries()) {
  const { error } = await cl.auth.signInWithPassword(users[i])
  assert.equal(error, null)
}
const anon = client()
const { data: dishes, error: catalogError } = await anon.from('dishes').select('*')
assert.equal(catalogError, null)
assert.ok(dishes.length >= 10, 'public catalog')
const dish = dishes[0]
const { error: anonInsert } = await anon
  .from('reviews')
  .insert({
    user_id: users[0].id,
    restaurant_id: dish.restaurant_id,
    dish_id: dish.id,
    rating: 5,
    content: 'unauthorized',
  })
assert.ok(anonInsert, 'anonymous writes denied')
const { data: review, error: reviewError } = await a
  .from('reviews')
  .insert({
    user_id: users[0].id,
    restaurant_id: dish.restaurant_id,
    dish_id: dish.id,
    rating: 4.5,
    service_rating: 4,
    ambience_rating: 5,
    content: 'Teste automatizado temporário de integração.',
  })
  .select()
  .single()
assert.equal(reviewError, null, 'create review')
const otherDish = dishes.find((d) => d.restaurant_id !== dish.restaurant_id)
const { error: mismatch } = await a
  .from('reviews')
  .insert({
    user_id: users[0].id,
    restaurant_id: otherDish.restaurant_id,
    dish_id: dish.id,
    rating: 5,
    content: 'invalid restaurant/dish',
  })
assert.ok(mismatch, 'dish must belong to restaurant')
const { data: foreignUpdate, error: foreignError } = await b
  .from('reviews')
  .update({ content: 'forbidden' })
  .eq('id', review.id)
  .select()
assert.equal(foreignError, null)
assert.equal(foreignUpdate.length, 0, 'cannot update another user review')
assert.equal(
  (await a.from('bookmarks').insert({ user_id: users[0].id, dish_id: dish.id })).error,
  null,
)
const { data: privateBookmarks } = await b.from('bookmarks').select('*').eq('user_id', users[0].id)
assert.equal(privateBookmarks.length, 0, 'bookmarks private')
const { error: likeError } = await b
  .from('likes')
  .insert({ user_id: users[1].id, review_id: review.id })
assert.equal(likeError, null, 'like')
assert.equal(
  (
    await b
      .from('comments')
      .insert({
        user_id: users[1].id,
        review_id: review.id,
        content: 'Comentário de teste temporário.',
      })
  ).error,
  null,
  'comment',
)
assert.equal(
  (await b.from('follows').insert({ follower_id: users[1].id, following_id: users[0].id })).error,
  null,
  'follow',
)
const { error: selfFollow } = await a
  .from('follows')
  .insert({ follower_id: users[0].id, following_id: users[0].id })
assert.ok(selfFollow, 'self follow rejected')
assert.equal(
  (
    await a
      .from('checkins')
      .insert({ user_id: users[0].id, restaurant_id: dish.restaurant_id, rating: 4 })
  ).error,
  null,
  'check-in',
)
const { data: bill, error: billError } = await a
  .from('bills')
  .insert({ user_id: users[0].id, data: { people: ['Você'], items: [], service: 10 } })
  .select()
  .single()
assert.equal(billError, null)
assert.equal((await b.from('bills').select('*').eq('id', bill.id)).data.length, 0, 'bill privacy')
const { data: roomId, error: roomError } = await a.rpc('create_game', {
  kind: 'roulette',
  capacity: 2,
})
assert.equal(roomError, null, 'create room')
const { data: room } = await a.from('game_rooms').select('*').eq('id', roomId).single()
assert.ok(room.code)
assert.equal(
  (await b.from('game_rooms').select('*').eq('id', roomId)).data.length,
  0,
  'room private before joining',
)
assert.equal((await b.rpc('join_game', { room_code: room.code })).error, null, 'join room')
assert.ok((await c.rpc('join_game', { room_code: room.code })).error, 'capacity enforced')
assert.ok((await b.rpc('spin_game', { room: roomId })).error, 'only host can spin')
const { data: winner, error: spinError } = await a.rpc('spin_game', { room: roomId })
assert.equal(spinError, null)
assert.equal(
  (await b.from('game_rooms').select('result_dish_id').eq('id', roomId).single()).data
    .result_dish_id,
  winner,
  'shared result',
)
const { data: matchId, error: matchError } = await a.rpc('create_game', {
  kind: 'match',
  capacity: 2,
})
assert.equal(matchError, null)
const match = (await a.from('game_rooms').select('*').eq('id', matchId).single()).data
assert.equal((await b.rpc('join_game', { room_code: match.code })).error, null)
for (const [i, cl] of [a, b].entries())
  assert.equal(
    (
      await cl
        .from('game_votes')
        .insert({ room_id: matchId, user_id: users[i].id, dish_id: dish.id, liked: true })
    ).error,
    null,
    'match voting',
  )
assert.equal(
  (await a.from('game_votes').select('*').eq('room_id', matchId)).data.length,
  2,
  'shared match votes',
)
assert.ok(
  (
    await c
      .from('game_votes')
      .insert({ room_id: matchId, user_id: users[2].id, dish_id: dish.id, liked: true })
  ).error,
  'outsider vote rejected',
)
const photoName = `${users[0].id}/integration.png`
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=',
  'base64',
)
assert.equal(
  (await a.storage.from('tasty-photos').upload(photoName, png, { contentType: 'image/png' })).error,
  null,
  'photo upload',
)
assert.ok(
  (
    await b.storage
      .from('tasty-photos')
      .upload(`${users[0].id}/forbidden.png`, png, { contentType: 'image/png' })
  ).error,
  'cannot upload into another user folder',
)
assert.equal(
  (await a.storage.from('tasty-photos').remove([photoName])).error,
  null,
  'remove test photo',
)
console.log(
  JSON.stringify({
    status: 'passed',
    checks: 23,
    fixtures: fixturePath,
    reviewId: review.id,
    roomId,
    matchId,
  }),
)
for (const cl of [a, b, c, admin]) await cl.auth.signOut()
