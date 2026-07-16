import { useEffect } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styled from 'styled-components'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix ícones padrão do Leaflet no Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const MapWrap = styled.div`
  height: 420px;
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.colors.elevated};
    font-family: ${({ theme }) => theme.fonts.sans};
  }
`

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true })
  }, [lat, lon, map])
  return null
}

interface Props {
  center: { lat: number; lon: number }
  radiusMeters: number
  hotelMarkers?: Array<{ id: string; lat: number; lon: number; name: string }>
  onPickCenter: (lat: number, lon: number) => void
}

export function HotelSearchMap({
  center,
  radiusMeters,
  hotelMarkers = [],
  onPickCenter,
}: Props) {
  return (
    <MapWrap>
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={12}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center.lat} lon={center.lon} />
        <MapClickHandler onPick={onPickCenter} />
        <Marker position={[center.lat, center.lon]} />
        <Circle
          center={[center.lat, center.lon]}
          radius={radiusMeters}
          pathOptions={{
            color: '#4d8fd9',
            fillColor: '#4d8fd9',
            fillOpacity: 0.12,
            weight: 2,
          }}
        />
        {hotelMarkers.map((h) => (
          <Marker key={h.id} position={[h.lat, h.lon]} title={h.name} />
        ))}
      </MapContainer>
    </MapWrap>
  )
}
