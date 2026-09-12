import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.')
export const supabase = createClient(url, key)
export const reviewSelect = '*, profiles!reviews_user_id_fkey(*), dishes!reviews_dish_id_restaurant_id_fkey(*), restaurants!reviews_restaurant_id_fkey(*), likes(user_id), comments(id)'

export async function uploadPhoto(file: File, userId: string) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP.')
  if (file.size > 8 * 1024 * 1024) throw new Error('A foto pode ter até 8 MB.')
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('tasty-photos').upload(path, file)
  if (error) throw error
  return supabase.storage.from('tasty-photos').getPublicUrl(path).data.publicUrl
}
