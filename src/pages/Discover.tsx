import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  MapPin,
  Navigation,
  Trophy,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowUpRight,
} from 'lucide-react'
import { useApp } from '../lib/context'
import { distanceKm, distanceText, normalize } from '../lib/utils'
import { TastyStar, Avatar, Loading, EmptyState, Modal, Button, IconButton } from '../components/ui'
import { DishCard, FollowButton } from '../components/Social'
const FoodMap = lazy(() => import('../components/FoodMap'))
const categories = [
  ['Todos', '✦'],
  ['Hambúrguer', '🍔'],
  ['Massas', '🍝'],
  ['Japonesa', '🍜'],
  ['Café', '☕'],
  ['Pizza', '🍕'],
  ['Sobremesa', '🍰'],
]
export function Discover() {
  const {
    dishes,
    restaurants,
    people,
    user,
    location,
    requestLocation,
    loading,
    dataError,
    refresh,
  } = useApp()
  const [params, setParams] = useSearchParams()
  const map = params.get('view') === 'map'
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState('Todos')
  const [ranking, setRanking] = useState('rating')
  const [nearIndex, setNearIndex] = useState(0)
  const [filters, setFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [section, setSection] = useState(params.get('section') || 'dishes')
  const [allWeekly, setAllWeekly] = useState(false)
  useEffect(() => {
    const s = params.get('section')
    if (s) setSection(s)
  }, [params])
  const search = normalize(query)
  const filteredDishes = dishes.filter(
    (d) =>
      (category === 'Todos' || d.category === category) &&
      d.rating >= minRating &&
      normalize(
        `${d.name} ${d.description} ${d.category} ${d.tags.join(' ')} ${restaurants.find((r) => r.id === d.restaurant_id)?.name}`,
      ).includes(search),
  )
  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.rating >= minRating && normalize(`${r.name} ${r.category} ${r.address}`).includes(search),
  )
  const filteredPeople = people.filter(
    (p) => p.id !== user?.id && normalize(`${p.username} ${p.full_name} ${p.bio}`).includes(search),
  )
  const nearby = [...restaurants].sort((a, b) =>
    location
      ? distanceKm(location.lat, location.lng, a) - distanceKm(location.lat, location.lng, b)
      : b.rating - a.rating,
  )
  const nearbyR = nearby[nearIndex % Math.max(nearby.length, 1)]
  const rank = [...restaurants].sort(
    (a, b) => Number(b[ranking as 'rating']) - Number(a[ranking as 'rating']),
  )
  const results = search || category !== 'Todos' || minRating > 0 || params.has('section')
  const feature = dishes.find((d) => d.name === 'Cappuccino da casa') || dishes[0]
  function switchView(isMap: boolean) {
    const next = new URLSearchParams(params)
    if (isMap) next.set('view', 'map')
    else next.delete('view')
    setParams(next)
  }
  return (
    <div className={`discover-page ${map ? 'map-page' : ''}`}>
      <div className="discover-controls">
        <div className="search-field">
          <Search size={22} />
          <input
            aria-label="Pesquisar pratos, lugares e pessoas"
            value={query}
            placeholder="Um prato, um lugar, uma vontade…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <IconButton label="Limpar pesquisa" onClick={() => setQuery('')}>
              <X size={18} />
            </IconButton>
          )}
          <IconButton
            label="Filtrar descobertas"
            className={minRating > 0 ? 'filter-active' : ''}
            onClick={() => setFilters(true)}
          >
            <SlidersHorizontal size={21} />
          </IconButton>
        </div>
        <div className="discover-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={!map}
            className={!map ? 'active' : ''}
            onClick={() => switchView(false)}
          >
            Descobrir
          </button>
          <button
            role="tab"
            aria-selected={map}
            className={map ? 'active' : ''}
            onClick={() => switchView(true)}
          >
            <MapPin size={18} />
            Mapa
          </button>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : dataError ? (
        <EmptyState title="Vamos tentar de novo?" text={dataError}>
          <Button onClick={() => void refresh()}>Recarregar</Button>
        </EmptyState>
      ) : map ? (
        <Suspense fallback={<Loading />}>
          <FoodMap restaurants={filteredRestaurants} selectedId={params.get('restaurant')} />
        </Suspense>
      ) : (
        <>
          <div className="category-chips">
            {categories.map(([c, emoji]) => (
              <button
                key={c}
                className={category === c ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                <span>{emoji}</span>
                {c}
              </button>
            ))}
          </div>
          {results ? (
            <section className="search-results">
              <div className="section-title">
                <h2>{search ? `Resultados para “${query}”` : 'Seu gosto, suas descobertas'}</h2>
              </div>
              <div className="filter-tabs">
                {[
                  ['dishes', 'Pratos', filteredDishes.length],
                  ['places', 'Lugares', filteredRestaurants.length],
                  ['people', 'Pessoas', filteredPeople.length],
                ].map(([id, label, count]) => (
                  <button
                    key={id}
                    className={section === id ? 'active' : ''}
                    onClick={() => setSection(String(id))}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
              {section === 'dishes' ? (
                filteredDishes.length ? (
                  <div className="dish-grid">
                    {filteredDishes.map((d) => (
                      <DishCard
                        key={d.id}
                        dish={d}
                        restaurant={restaurants.find((r) => r.id === d.restaurant_id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Ainda não está no cardápio"
                    text="Tente outro prato, restaurante ou categoria."
                  />
                )
              ) : section === 'places' ? (
                filteredRestaurants.length ? (
                  filteredRestaurants.map((r) => (
                    <Link to={`/restaurant/${r.id}`} key={r.id} className="ranking-card">
                      <img src={r.image_url} alt={r.name} />
                      <div>
                        <h3>{r.name}</h3>
                        <span className="eyebrow">{r.category}</span>
                        <p>
                          <TastyStar value={r.rating || '–'} />
                          <span>{r.review_count} avaliações</span>
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    title="Nenhum lugar encontrado"
                    text="Experimente uma pesquisa mais ampla."
                  />
                )
              ) : (
                <div className="people-grid">
                  {filteredPeople.map((p) => (
                    <article className="person-card" key={p.id}>
                      <Link to={`/people/${p.id}`}>
                        <Avatar profile={p} size={74} />
                        <h3>{p.username}</h3>
                      </Link>
                      <span className="person-level">
                        {p.is_demo ? 'Perfil de exemplo' : 'Explorador de sabores'}
                      </span>
                      <p>{p.bio || 'Em busca de boas descobertas.'}</p>
                      <FollowButton person={p} />
                    </article>
                  ))}
                  {!filteredPeople.length && (
                    <EmptyState
                      title="Ninguém por aqui ainda"
                      text="Procure pelo nome ou pelo @ de uma pessoa."
                    />
                  )}
                </div>
              )}
            </section>
          ) : (
            <>
              {feature && (
                <section className="weekly-feature">
                  <div className="weekly-feature-heading">
                    <h2>
                      TASTY DA SEMANA
                      <TastyStar />
                    </h2>
                    <button onClick={() => setAllWeekly(!allWeekly)}>
                      {allWeekly ? 'Ver menos' : 'Ver mais'}
                      <ChevronRight size={17} />
                    </button>
                  </div>
                  <div className="weekly-feature-content">
                    <Link to={`/dish/${feature.id}`} className="featured-photo">
                      <img src={feature.image_url} alt={feature.name} />
                      <TastyStar value={feature.rating} />
                      <div>
                        <span>CAFÉ & BOAS CONVERSAS</span>
                        <h3>Drama Café</h3>
                      </div>
                    </Link>
                    <div className="feature-copy">
                      <span className="eyebrow">SEU NOVO CANTINHO FAVORITO</span>
                      <h3>
                        Uma pausa.
                        <br />
                        Muitos sabores.
                      </h3>
                      <p>Para os dias que pedem um café demorado e uma boa descoberta.</p>
                      <Link to={`/dish/${feature.id}`}>
                        Quero conhecer
                        <ArrowUpRight size={18} />
                      </Link>
                      <TastyStar className="feature-copy-star" />
                    </div>
                  </div>
                  {allWeekly && (
                    <div className="weekly-extra">
                      {dishes
                        .filter(
                          (d) =>
                            restaurants.find((r) => r.id === d.restaurant_id)?.is_featured &&
                            d.id !== feature.id,
                        )
                        .map((d) => (
                          <Link to={`/dish/${d.id}`} key={d.id}>
                            <img src={d.image_url} alt={d.name} />
                            <span>{d.name}</span>
                            <ArrowUpRight size={18} />
                          </Link>
                        ))}
                    </div>
                  )}
                </section>
              )}
              <section className="discover-section">
                <div className="section-title">
                  <h2>
                    <Navigation size={21} fill="currentColor" />
                    {location ? 'Perto de você' : 'Descubra São Paulo'}
                  </h2>
                  {!location && (
                    <button className="location-button" onClick={() => void requestLocation()}>
                      Usar localização
                    </button>
                  )}
                </div>
                {nearbyR && (
                  <Link className="nearby-card" to={`/restaurant/${nearbyR.id}`}>
                    <div>
                      <h3>{nearbyR.name}</h3>
                      <p>
                        {nearbyR.category} · {nearbyR.price_range}
                      </p>
                      <span className="nearby-note">Um novo favorito esperando por você</span>
                      <div className="nearby-card-bottom">
                        <span>
                          <MapPin size={14} />
                          {location
                            ? distanceText(distanceKm(location.lat, location.lng, nearbyR))
                            : nearbyR.city}
                        </span>
                        <TastyStar value={nearbyR.rating || '–'} outline />
                      </div>
                    </div>
                    <img
                      src={
                        dishes.find((d) => d.restaurant_id === nearbyR.id)?.image_url ||
                        nearbyR.image_url
                      }
                      alt={nearbyR.name}
                    />
                  </Link>
                )}
                <div className="pagination-dots">
                  {nearby.map((r, i) => (
                    <button
                      key={r.id}
                      aria-label={`Ver ${r.name}`}
                      onClick={() => setNearIndex(i)}
                      className={nearIndex === i ? 'active' : ''}
                    />
                  ))}
                </div>
              </section>
              <section className="discover-section">
                <div className="section-title">
                  <h2>
                    <Trophy size={21} fill="currentColor" />
                    RANKING <span>· SÃO PAULO</span>
                  </h2>
                </div>
                <div className="filter-tabs">
                  {[
                    ['rating', 'Geral'],
                    ['rating-food', 'Melhor comida'],
                    ['service_rating', 'Melhor serviço'],
                    ['ambience_rating', 'Melhor ambiente'],
                  ].map(([value, label]) => (
                    <button
                      className={ranking === value ? 'active' : ''}
                      key={value}
                      onClick={() => setRanking(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {ranking === 'rating-food'
                  ? [...dishes]
                      .sort((a, b) => b.rating - a.rating)
                      .slice(0, 5)
                      .map((d, i) => (
                        <Link key={d.id} to={`/dish/${d.id}`} className="ranking-card">
                          <img src={d.image_url} alt={d.name} />
                          <div>
                            <h3>
                              <b>#{i + 1}</b>
                              {d.name}
                            </h3>
                            <span className="eyebrow">
                              {restaurants.find((r) => r.id === d.restaurant_id)?.name}
                            </span>
                            <p>
                              <TastyStar value={d.rating} />
                              <span>{d.review_count} avaliações</span>
                            </p>
                          </div>
                        </Link>
                      ))
                  : rank.slice(0, 5).map((r, i) => (
                      <Link to={`/restaurant/${r.id}`} key={r.id} className="ranking-card">
                        <img src={r.image_url} alt={r.name} />
                        <div>
                          <h3>
                            <b>#{i + 1}</b>
                            {r.name}
                          </h3>
                          <span className="eyebrow">{r.category}</span>
                          <p>
                            <TastyStar value={Number(r[ranking as 'rating']) || '–'} />
                            <span>{r.review_count} avaliações</span>
                          </p>
                        </div>
                      </Link>
                    ))}
              </section>
              <section className="discover-section">
                <div className="section-title">
                  <h2>Descubra pessoas</h2>
                  <Link to="/discover?section=people" onClick={() => setSection('people')}>
                    Ver todos
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="people-carousel">
                  {people
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <article className="person-card" key={p.id}>
                        <Link to={`/people/${p.id}`}>
                          <Avatar profile={p} size={70} />
                          <h3>{p.username}</h3>
                        </Link>
                        <span className="person-level">
                          {p.is_demo ? 'Perfil de exemplo' : 'Explorador de sabores'}
                        </span>
                        <p>{p.bio}</p>
                        <FollowButton person={p} />
                      </article>
                    ))}
                </div>
              </section>
            </>
          )}
          <p className="demo-notice">
            O catálogo inicial contém exemplos e fotos ilustrativas. As notas são calculadas pelas
            avaliações no Tasty.
          </p>
        </>
      )}
      {filters && (
        <Modal title="Do seu jeito" onClose={() => setFilters(false)}>
          <div className="form-stack">
            <label>
              Nota mínima
              <div className="filter-rating-value">
                <TastyStar value={minRating || '✦'} />
                <span>{minRating ? `${minRating.toFixed(1)} ou mais` : 'Todas as notas'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                aria-label="Nota mínima"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
              />
            </label>
            <Button onClick={() => setFilters(false)}>Mostrar resultados</Button>
            <button
              className="text-button"
              onClick={() => {
                setMinRating(0)
                setCategory('Todos')
                setFilters(false)
              }}
            >
              Limpar filtros
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
