import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Bookmark, ArrowUpRight, Utensils } from 'lucide-react'
import { useApp, useRequireAuth } from '../lib/context'
import { supabase, reviewSelect } from '../lib/supabase'
import { errorMessage, money } from '../lib/utils'
import type { Review } from '../lib/types'
import { TastyStar, Loading, EmptyState, IconButton, Button } from '../components/ui'
import { ReviewCard, DishCard } from '../components/Social'
export function Detail({ kind }: { kind: 'dish' | 'restaurant' }) {
  const { id } = useParams()
  const {
    dishes,
    restaurants,
    loading,
    bookmarks,
    toggleBookmark,
    notify,
    setReviews: saveFeed,
  } = useApp()
  const requireAuth = useRequireAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const dish = kind === 'dish' ? dishes.find((d) => d.id === id) : undefined
  const restaurant = restaurants.find((r) => r.id === (dish?.restaurant_id || id))
  const item = kind === 'dish' ? dish : restaurant
  useEffect(() => {
    if (!id) return
    supabase
      .from('reviews')
      .select(reviewSelect)
      .eq(kind === 'dish' ? 'dish_id' : 'restaurant_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) notify(errorMessage(error), 'error')
        else {
          setReviews(data as unknown as Review[])
          saveFeed((list) => [
            ...list,
            ...(data as unknown as Review[]).filter((r) => !list.some((x) => x.id === r.id)),
          ])
        }
      })
  }, [id, kind, notify, saveFeed])
  if (loading) return <Loading />
  if (!item)
    return (
      <EmptyState
        title="Essa descoberta não está por aqui"
        text="Volte para explorar outros pratos e lugares."
        action="Descobrir"
        to="/discover"
      />
    )
  return (
    <div className="detail-page">
      <Link to="/discover" className="back-link">
        <ArrowLeft size={20} />
        Descobrir
      </Link>
      <div className="detail-hero">
        <img src={item.image_url} alt={item.name} />
        <TastyStar className="detail-score" value={item.review_count ? item.rating : '–'} />
        {dish && (
          <IconButton
            label={bookmarks.includes(dish.id) ? 'Remover dos salvos' : 'Salvar prato'}
            onClick={async () => {
              if (!requireAuth()) return
              try {
                await toggleBookmark(dish.id)
              } catch (e) {
                notify(errorMessage(e), 'error')
              }
            }}
          >
            <Bookmark fill={bookmarks.includes(dish.id) ? 'currentColor' : 'none'} />
          </IconButton>
        )}
      </div>
      <div className="detail-copy">
        <span className="eyebrow">{item.category}</span>
        <h1>{item.name}</h1>
        {dish && (
          <Link className="detail-restaurant" to={`/restaurant/${dish.restaurant_id}`}>
            <MapPin size={17} />
            {restaurant?.name}
            <ArrowUpRight size={16} />
          </Link>
        )}
        <p>{item.description}</p>
        <div className="detail-facts">
          {dish ? <strong>{money(dish.price)}</strong> : <strong>{restaurant?.price_range}</strong>}
          <span>
            {item.review_count} {item.review_count === 1 ? 'avaliação' : 'avaliações'}
          </span>
          {dish?.tags.map((t) => (
            <span className="detail-tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        <Link
          to={`/write?restaurant=${restaurant?.id}${dish ? `&dish=${dish.id}` : ''}`}
          className="btn"
        >
          <TastyStar />
          Já provei! Quero avaliar
        </Link>
        {restaurant && (
          <div className="detail-address">
            <MapPin size={19} />
            <span>
              {restaurant.address}
              <small>{restaurant.city}</small>
            </span>
            <Link to={`/discover?view=map&restaurant=${restaurant.id}`}>
              Ver no mapa
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        {restaurant?.is_demo && (
          <p className="demo-notice">
            Catálogo de demonstração. Fotos, preços e informações são ilustrativos.
          </p>
        )}
      </div>
      {kind === 'restaurant' && (
        <section className="detail-dishes">
          <h2>
            <Utensils size={22} />
            As estrelas da mesa
          </h2>
          <div className="dish-grid">
            {dishes
              .filter((d) => d.restaurant_id === id)
              .map((d) => (
                <DishCard key={d.id} dish={d} restaurant={restaurant} />
              ))}
          </div>
        </section>
      )}
      <section className="detail-reviews">
        <h2>Quem provou, contou.</h2>
        {reviews.length ? (
          reviews.map((r) => <DetailReview key={r.id} review={r} />)
        ) : (
          <EmptyState
            title="Esse prato espera sua opinião"
            text="Seja a primeira pessoa a contar como foi."
          />
        )}
      </section>
    </div>
  )
}
// Reuse the live feed object when available so likes and comments update immediately.
function DetailReview({ review }: { review: Review }) {
  const { reviews } = useApp()
  return <ReviewCard review={reviews.find((r) => r.id === review.id) || review} />
}
export function SingleReview() {
  const { id } = useParams()
  const { reviews, notify, setReviews } = useApp()
  const [item, setItem] = useState<Review | null>(null),
    [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('reviews')
      .select(reviewSelect)
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) notify(errorMessage(error), 'error')
        else if (data) {
          setItem(data as unknown as Review)
          setReviews((list) =>
            list.some((r) => r.id === data.id) ? list : [...list, data as unknown as Review],
          )
        }
        setLoading(false)
      })
  }, [id, notify, setReviews])
  return loading ? (
    <Loading />
  ) : item ? (
    <div className="single-review">
      <Link className="back-link" to="/">
        <ArrowLeft size={20} />
        Voltar ao feed
      </Link>
      <ReviewCard review={reviews.find((r) => r.id === item.id) || item} />
    </div>
  ) : (
    <EmptyState
      title="Avaliação não encontrada"
      text="Ela pode ter sido removida pelo autor."
      action="Ir para o feed"
      to="/"
    />
  )
}
export function Saved() {
  const { user, bookmarks, dishes, restaurants } = useApp()
  return (
    <div className="saved-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PARA A PRÓXIMA FOME</span>
          <h1>Quero provar.</h1>
          <p>Sua coleção de boas descobertas.</p>
        </div>
        <Bookmark size={34} />
      </div>
      {!user ? (
        <EmptyState
          title="Guarde um lugar para seus favoritos"
          text="Entre na sua conta para salvar pratos e encontrar todos eles por aqui."
          action="Entrar no Tasty"
          to="/welcome?next=%2Fsaved"
        />
      ) : bookmarks.length ? (
        <div className="dish-grid">
          {dishes
            .filter((d) => bookmarks.includes(d.id))
            .map((d) => (
              <DishCard
                key={d.id}
                dish={d}
                restaurant={restaurants.find((r) => r.id === d.restaurant_id)}
              />
            ))}
        </div>
      ) : (
        <EmptyState
          title="Sua lista está só começando"
          text="Toque no marcador de um prato para guardar a vontade de experimentar."
          action="Encontrar pratos"
          to="/discover"
        />
      )}
    </div>
  )
}
