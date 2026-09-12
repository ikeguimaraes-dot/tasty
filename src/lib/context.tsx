import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, reviewSelect } from './supabase'
import { errorMessage } from './utils'
import type { Profile, Dish, Restaurant, Review } from './types'

type Toast = { text: string; tone: 'success' | 'error' }
type AppState = {
  user: User | null
  profile: Profile | null
  authReady: boolean
  restaurants: Restaurant[]
  dishes: Dish[]
  people: Profile[]
  reviews: Review[]
  loading: boolean
  dataError: string
  bookmarks: string[]
  following: string[]
  toast: Toast | null
  notify: (text: string, tone?: 'success' | 'error') => void
  refresh: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSocial: () => Promise<void>
  toggleBookmark: (id: string) => Promise<void>
  toggleFollow: (id: string) => Promise<void>
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>
  location: { lat: number; lng: number } | null
  requestLocation: () => Promise<boolean>
}
const AppContext = createContext<AppState>(null!)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [people, setPeople] = useState<Profile[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const notify = useCallback(
    (text: string, tone: 'success' | 'error' = 'success') => setToast({ text, tone }),
    [],
  )
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const refresh = useCallback(async () => {
    setDataError('')
    try {
      const results = await Promise.all([
        supabase.from('restaurants').select('*').order('name'),
        supabase.from('dishes').select('*').order('name'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
        supabase
          .from('reviews')
          .select(reviewSelect)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('dish_ratings').select('*'),
        supabase.from('restaurant_ratings').select('*'),
      ])
      for (const result of results) if (result.error) throw result.error
      const [rs, ds, ps, revs, dr, rr] = results
      setRestaurants(
        (rs.data || []).map((r) => ({
          ...r,
          ...rr.data?.find((x) => x.id === r.id),
        })) as Restaurant[],
      )
      setDishes(
        (ds.data || []).map((d) => ({ ...d, ...dr.data?.find((x) => x.id === d.id) })) as Dish[],
      )
      setPeople(ps.data as Profile[])
      setReviews(revs.data as unknown as Review[])
    } catch (e) {
      setDataError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setAuthReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      notify(errorMessage(error), 'error')
      return
    }
    if (data) {
      setProfile(data)
      return
    }
    const username = `foodie_${user.id.replaceAll('-', '').slice(0, 12)}`
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          auth_user_id: user.id,
          username,
          full_name: user.user_metadata.full_name || 'Foodie',
        },
        { onConflict: 'id' },
      )
      .select()
      .single()
    if (createError) notify(errorMessage(createError), 'error')
    else setProfile(created)
  }, [user, notify])
  const refreshSocial = useCallback(async () => {
    if (!user) {
      setBookmarks([])
      setFollowing([])
      return
    }
    const [b, f] = await Promise.all([
      supabase.from('bookmarks').select('dish_id').eq('user_id', user.id),
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
    ])
    if (b.error || f.error) {
      notify(errorMessage(b.error || f.error), 'error')
      return
    }
    setBookmarks(b.data.map((x) => x.dish_id))
    setFollowing(f.data.map((x) => x.following_id))
  }, [user, notify])
  useEffect(() => {
    void refreshProfile()
    void refreshSocial()
  }, [refreshProfile, refreshSocial])
  async function toggleBookmark(id: string) {
    if (!user) return
    const exists = bookmarks.includes(id)
    const { error } = exists
      ? await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('dish_id', id)
      : await supabase.from('bookmarks').insert({ user_id: user.id, dish_id: id })
    if (error) throw error
    setBookmarks((list) => (exists ? list.filter((x) => x !== id) : [...list, id]))
    notify(
      exists ? 'Prato removido dos salvos.' : 'Prato salvo. Sua próxima descoberta está guardada!',
    )
  }
  async function toggleFollow(id: string) {
    if (!user || id === user.id) return
    const exists = following.includes(id)
    const { error } = exists
      ? await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)
      : await supabase.from('follows').insert({ follower_id: user.id, following_id: id })
    if (error) throw error
    setFollowing((list) => (exists ? list.filter((x) => x !== id) : [...list, id]))
  }
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      notify('Seu navegador não oferece localização. Explore pelo mapa.', 'error')
      return false
    }
    return new Promise<boolean>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLocation({ lat: p.coords.latitude, lng: p.coords.longitude })
          notify('Localização ativada!')
          resolve(true)
        },
        () => {
          notify(
            'Não foi possível acessar sua localização. Você pode explorar São Paulo pelo mapa.',
            'error',
          )
          resolve(false)
        },
        { timeout: 10000, maximumAge: 300000 },
      ),
    )
  }, [notify])
  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        authReady,
        restaurants,
        dishes,
        people,
        reviews,
        loading,
        dataError,
        bookmarks,
        following,
        toast,
        notify,
        refresh,
        refreshProfile,
        refreshSocial,
        toggleBookmark,
        toggleFollow,
        setReviews,
        location,
        requestLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useRequireAuth() {
  const { user, notify } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (user) return true
    notify('Entre na sua conta para participar.')
    navigate(`/welcome?next=${encodeURIComponent(location.pathname + location.search)}`)
    return false
  }
}
