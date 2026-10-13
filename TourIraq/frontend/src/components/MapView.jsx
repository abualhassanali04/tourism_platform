import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useI18n } from '../i18n/I18nContext'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Vite does not resolve Leaflet's default icon paths, so set them explicitly.
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [30, 30] })
  }, [map, points])
  return null
}

function ZoomControls() {
  const map = useMap()
  const { t } = useI18n()
  return (
    <div className="map-controls">
      <button type="button" aria-label={t('map.zoomIn')} onClick={() => map.zoomIn()}>+</button>
      <button type="button" aria-label={t('map.zoomOut')} onClick={() => map.zoomOut()}>−</button>
    </div>
  )
}

/** places: [{id,name,latitude,longitude}] — radius: optional stamp radius circle (meters) */
export default function MapView({ places, height = 320, radius, userPosition, link = true }) {
  const { isRtl } = useI18n()
  if (!places?.length) return null
  const points = places.map((p) => [p.latitude, p.longitude])
  const center = points[0]

  return (
    <div className="map-wrap" style={{ height }}>
      <MapContainer center={center} zoom={places.length === 1 ? 15 : 6} scrollWheelZoom={false} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        <ZoomControls />
        {places.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} alt={isRtl ? p.nameAr || p.name : p.name}>
            <Popup>{link ? <Link to={`/places/${p.id}`}>{isRtl ? p.nameAr || p.name : p.name}</Link> : isRtl ? p.nameAr || p.name : p.name}</Popup>
          </Marker>
        ))}
        {radius && places.length === 1 && (
          <Circle center={center} radius={radius} pathOptions={{ color: '#08763D', fillOpacity: 0.12 }} />
        )}
        {userPosition && (
          <Circle center={[userPosition.lat, userPosition.lng]} radius={8} pathOptions={{ color: '#E77C63', fillOpacity: 0.9 }} />
        )}
      </MapContainer>
    </div>
  )
}
