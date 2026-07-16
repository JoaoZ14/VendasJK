import type { ClientInsert, ClientType } from '../types'

export interface GeoPoint {
  lat: number
  lon: number
}

export interface PlaceSuggestion {
  displayName: string
  lat: number
  lon: number
  city: string | null
  state: string | null
}

export interface HotelResult {
  osmId: string
  name: string
  type: ClientType
  lat: number
  lon: number
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/** Espelhos públicos — se um falhar, tenta o próximo */
const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const TOURISM_TYPES = [
  'hotel',
  'guest_house',
  'hostel',
  'motel',
  'resort',
  'chalet',
  'apartment',
] as const

function mapTourismType(tourism: string | undefined): ClientType {
  switch (tourism) {
    case 'hotel':
      return 'hotel'
    case 'guest_house':
    case 'chalet':
    case 'apartment':
      return 'pousada'
    case 'hostel':
      return 'hostel'
    case 'resort':
      return 'resort'
    default:
      return 'outro'
  }
}

const RESULT_LIMIT = 100

function buildAroundQuery(lat: number, lon: number, radius: number): string {
  const types = TOURISM_TYPES.join('|')
  return `
[out:json][timeout:25];
(
  nwr["tourism"~"^(${types})$"](around:${radius},${lat},${lon});
);
out center tags ${RESULT_LIMIT};
`.trim()
}

async function fetchOverpass(query: string): Promise<{
  elements?: Array<{
    type: string
    id: number
    lat?: number
    lon?: number
    center?: { lat: number; lon: number }
    tags?: Record<string, string>
  }>
  remark?: string
}> {
  const errors: string[] = []

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 28000)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })

      const text = await res.text()

      if (!res.ok) {
        errors.push(`${new URL(endpoint).host}: HTTP ${res.status}`)
        continue
      }

      let data: {
        elements?: Array<{
          type: string
          id: number
          lat?: number
          lon?: number
          center?: { lat: number; lon: number }
          tags?: Record<string, string>
        }>
        remark?: string
      }

      try {
        data = JSON.parse(text) as typeof data
      } catch {
        errors.push(`${new URL(endpoint).host}: resposta inválida`)
        continue
      }

      if (data.remark && !data.elements) {
        errors.push(`${new URL(endpoint).host}: ${data.remark}`)
        continue
      }

      return data
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'timeout'
          : err instanceof Error
            ? err.message
            : 'erro de rede'
      errors.push(`${new URL(endpoint).host}: ${msg}`)
    } finally {
      window.clearTimeout(timer)
    }
  }

  throw new Error(
    `Nenhum servidor Overpass respondeu. ${errors.slice(0, 3).join(' · ')}`,
  )
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = new URL(`${NOMINATIM}/search`)
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'br')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) throw new Error('Falha ao buscar cidade (Nominatim)')

  const data = (await res.json()) as Array<{
    display_name: string
    lat: string
    lon: string
    address?: {
      city?: string
      town?: string
      village?: string
      municipality?: string
      state?: string
    }
  }>

  return data.map((item) => ({
    displayName: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
    city:
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.municipality ||
      null,
    state: item.address?.state || null,
  }))
}

export async function searchHotelsAround(
  center: GeoPoint,
  radiusMeters: number,
): Promise<HotelResult[]> {
  const radius = Math.max(500, Math.min(Math.round(radiusMeters), 15000))
  const { lat, lon } = center
  const query = buildAroundQuery(lat, lon, radius)
  const data = await fetchOverpass(query)

  const seen = new Set<string>()
  const results: HotelResult[] = []

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {}
    const name = tags.name?.trim()
    if (!name) continue

    const pointLat = el.lat ?? el.center?.lat
    const pointLon = el.lon ?? el.center?.lon
    if (pointLat == null || pointLon == null) continue

    const key = `${name.toLowerCase()}|${tags['addr:city'] ?? ''}|${pointLat.toFixed(4)}|${pointLon.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      osmId: `${el.type}/${el.id}`,
      name,
      type: mapTourismType(tags.tourism),
      lat: pointLat,
      lon: pointLon,
      city:
        tags['addr:city'] || tags['addr:town'] || tags['addr:suburb'] || null,
      state: tags['addr:state'] || null,
      phone: tags.phone || tags['contact:phone'] || null,
      email: tags.email || tags['contact:email'] || null,
      website: tags.website || tags['contact:website'] || null,
      address:
        [
          tags['addr:street'],
          tags['addr:housenumber'],
          tags['addr:city'],
        ]
          .filter(Boolean)
          .join(', ') || null,
    })
  }

  return results.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function hotelToClientInsert(
  hotel: HotelResult,
  fallbackCity?: string | null,
  fallbackState?: string | null,
): ClientInsert {
  const phone = hotel.phone
  return {
    company_name: hotel.name,
    type: hotel.type,
    city: hotel.city || fallbackCity || null,
    state: hotel.state || fallbackState || null,
    phone,
    whatsapp: phone,
    email: hotel.email,
    website: hotel.website,
    contact_name: null,
    contact_role: null,
    notes: [
      hotel.address ? `Endereço OSM: ${hotel.address}` : null,
      `Fonte: OpenStreetMap (${hotel.osmId})`,
      `Coords: ${hotel.lat.toFixed(5)}, ${hotel.lon.toFixed(5)}`,
    ]
      .filter(Boolean)
      .join('\n'),
    status: 'nao_contatado',
    last_contact_at: null,
    next_follow_up_at: null,
  }
}
