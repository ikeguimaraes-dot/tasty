import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, X, ArrowUpRight } from 'lucide-react'
import { useApp } from '../lib/context'
import { distanceKm, distanceText } from '../lib/utils'
import type { Restaurant } from '../lib/types'
import { IconButton, TastyStar } from './ui'
function Recenter({ center, places }: { center: [number, number]; places: Restaurant[] }) {
  const map = useMap()
  const ids = places.map((p) => p.id).join(',')
  useEffect(() => {
    if (places.length)
      map.fitBounds(
        places.map((p) => [p.latitude, p.longitude] as [number, number]),
        { paddingTopLeft: [35, 145], paddingBottomRight: [35, 300], maxZoom: 14 },
      )
    else map.flyTo(center, 14, { duration: 0.8 })
  }, [center[0], center[1], ids, map])
  return null
}
export default function FoodMap({
  restaurants,
  selectedId,
}: {
  restaurants: Restaurant[]
  selectedId: string | null
}) {
  const { location, requestLocation, dishes } = useApp()
  const [selected, setSelected] = useState(selectedId)
  const [panel, setPanel] = useState(true)
  const [tileError, setTileError] = useState(false)
  const restaurant = restaurants.find((r) => r.id === selected)
  const center: [number, number] = restaurant
    ? [restaurant.latitude, restaurant.longitude]
    : location
      ? [location.lat, location.lng]
      : [-23.553, -46.66]
  const ordered = [...restaurants].sort((a, b) =>
    location
      ? distanceKm(location.lat, location.lng, a) - distanceKm(location.lat, location.lng, b)
      : b.rating - a.rating,
  )
  return (
    <div className="food-map">
      <MapContainer center={center} zoom={14} zoomControl={false} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        <Recenter center={center} places={!restaurant && !location ? restaurants : []} />
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            title={r.name}
            icon={L.divIcon({
              className: 'tasty-map-marker',
              html: `<span class="map-pin ${r.id === selected ? 'selected' : ''}"><b>${r.rating ? Number(r.rating).toFixed(1).replace('.', ',') : '✦'}</b></span>`,
              iconSize: [48, 58],
              iconAnchor: [24, 55],
            })}
            eventHandlers={{
              click: () => {
                setSelected(r.id)
                setPanel(true)
              },
            }}
          />
        ))}
        {location && (
          <Marker
            position={[location.lat, location.lng]}
            title="Sua localização"
            icon={L.divIcon({
              className: 'user-map-marker',
              html: '<span></span>',
              iconSize: [20, 20],
            })}
          />
        )}
      </MapContainer>
      <button
        className="map-location"
        onClick={() => {
          setSelected(null)
          void requestLocation()
        }}
      >
        <Navigation size={20} />
        Minha localização
      </button>
      {tileError && (
        <div className="map-warning">
          O mapa está demorando a carregar. Os lugares continuam disponíveis abaixo.
        </div>
      )}
      {panel ? (
        <div className="map-nearby-panel">
          <IconButton label="Recolher lugares" onClick={() => setPanel(false)}>
            <X size={19} />
          </IconButton>
          {restaurant ? (
            <>
              <div className="selected-place">
                <img src={restaurant.image_url} alt={restaurant.name} />
                <div>
                  <span className="eyebrow">{restaurant.category}</span>
                  <h2>{restaurant.name}</h2>
                  <p>
                    <MapPin size={14} />
                    {restaurant.address}
                  </p>
                  <Link className="btn" to={`/restaurant/${restaurant.id}`}>
                    Conhecer o lugar
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
                <TastyStar value={restaurant.rating || '–'} />
              </div>
              <button className="text-button" onClick={() => setSelected(null)}>
                Ver todos os lugares
              </button>
            </>
          ) : (
            <>
              <h2>{location ? 'Perto de você' : 'Descubra São Paulo'}</h2>
              <p>{restaurants.length} restaurantes no mapa</p>
              <div className="map-places">
                {ordered.map((r) => (
                  <button key={r.id} onClick={() => setSelected(r.id)}>
                    <div>
                      <img
                        src={dishes.find((d) => d.restaurant_id === r.id)?.image_url || r.image_url}
                        alt={r.name}
                      />
                      <TastyStar value={r.rating || '–'} />
                    </div>
                    <strong>{r.name}</strong>
                    <span>
                      {location
                        ? distanceText(distanceKm(location.lat, location.lng, r))
                        : r.category}
                    </span>
                  </button>
                ))}
              </div>
              {restaurants.length === 0 && (
                <p>Nenhum lugar com esses filtros. Tente ampliar a busca.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <button className="map-expand" onClick={() => setPanel(true)}>
          Ver {restaurants.length} lugares
          <ArrowUpRight size={18} />
        </button>
      )}
    </div>
  )
}
