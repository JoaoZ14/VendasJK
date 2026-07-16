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

export type SearchCategoryId =
  | 'hospedagem'
  | 'alimentacao'
  | 'comercio'
  | 'servicos'
  | 'saude'

export interface SearchCategory {
  id: SearchCategoryId
  label: string
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'saude', label: 'Saúde' },
]

/** Default focado em quem costuma precisar de site/landing. */
export const DEFAULT_SEARCH_CATEGORIES: SearchCategoryId[] = [
  'comercio',
  'servicos',
]

/** Resultado OSM (antes era só hotel). */
export interface PlaceResult {
  osmId: string
  name: string
  type: ClientType
  category: SearchCategoryId
  categoryLabel: string
  lat: number
  lon: number
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
}

/** @deprecated use PlaceResult */
export type HotelResult = PlaceResult

const NOMINATIM = 'https://nominatim.openstreetmap.org'

const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const RESULT_LIMIT = 120

const CATEGORY_QUERIES: Record<
  SearchCategoryId,
  (around: string) => string[]
> = {
  hospedagem: (around) => [
    `nwr["tourism"~"^(hotel|guest_house|hostel|motel|resort|chalet|apartment)$"]${around}`,
  ],
  alimentacao: (around) => [
    `nwr["amenity"~"^(restaurant|cafe|bar|fast_food|pub|ice_cream|food_court|biergarten)$"]${around}`,
  ],
  comercio: (around) => [`nwr["shop"]${around}`],
  servicos: (around) => [
    `nwr["office"]${around}`,
    `nwr["craft"]${around}`,
    `nwr["amenity"~"^(bank|atm|car_rental|car_wash|laundry|hairdresser|beauty_salon|fuel)$"]${around}`,
  ],
  saude: (around) => [
    `nwr["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$"]${around}`,
    `nwr["healthcare"]${around}`,
  ],
}

function mapTourismType(tourism: string | undefined): ClientType {
  switch (tourism) {
    case 'hotel':
      return 'hotel'
    case 'guest_house':
    case 'chalet':
    case 'apartment':
    case 'motel':
      return 'pousada'
    case 'hostel':
      return 'hostel'
    case 'resort':
      return 'resort'
    default:
      return 'empresa'
  }
}

function detectCategory(tags: Record<string, string>): SearchCategoryId {
  const tourism = tags.tourism
  if (
    tourism &&
    /^(hotel|guest_house|hostel|motel|resort|chalet|apartment)$/.test(tourism)
  ) {
    return 'hospedagem'
  }
  if (
    tags.amenity &&
    /^(restaurant|cafe|bar|fast_food|pub|ice_cream|food_court|biergarten)$/.test(
      tags.amenity,
    )
  ) {
    return 'alimentacao'
  }
  if (
    tags.amenity &&
    /^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$/.test(tags.amenity)
  ) {
    return 'saude'
  }
  if (tags.healthcare) return 'saude'
  if (tags.shop) return 'comercio'
  if (tags.office || tags.craft) return 'servicos'
  if (
    tags.amenity &&
    /^(bank|atm|car_rental|car_wash|laundry|hairdresser|beauty_salon|fuel)$/.test(
      tags.amenity,
    )
  ) {
    return 'servicos'
  }
  return 'comercio'
}

function mapClientType(
  category: SearchCategoryId,
  tags: Record<string, string>,
): ClientType {
  if (category === 'hospedagem') return mapTourismType(tags.tourism)
  return 'empresa'
}

function categoryLabel(id: SearchCategoryId): string {
  return SEARCH_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

function buildAroundQuery(
  lat: number,
  lon: number,
  radius: number,
  categories: SearchCategoryId[],
): string {
  const around = `(around:${radius},${lat},${lon})`
  const lines = categories.flatMap((id) => CATEGORY_QUERIES[id](around))
  return `
[out:json][timeout:28];
(
  ${lines.join(';\n  ')};
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
    const timer = window.setTimeout(() => controller.abort(), 30000)

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

  if (!res.ok) throw new Error('Falha ao buscar endereço (Nominatim)')

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

export async function searchPlacesAround(
  center: GeoPoint,
  radiusMeters: number,
  categories: SearchCategoryId[],
): Promise<PlaceResult[]> {
  if (categories.length === 0) {
    throw new Error('Selecione ao menos uma categoria.')
  }

  const radius = Math.max(500, Math.min(Math.round(radiusMeters), 15000))
  const { lat, lon } = center
  const query = buildAroundQuery(lat, lon, radius, categories)
  const data = await fetchOverpass(query)

  const seen = new Set<string>()
  const results: PlaceResult[] = []

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {}
    const name = tags.name?.trim()
    if (!name) continue

    const pointLat = el.lat ?? el.center?.lat
    const pointLon = el.lon ?? el.center?.lon
    if (pointLat == null || pointLon == null) continue

    const category = detectCategory(tags)
    if (!categories.includes(category)) continue

    const key = `${name.toLowerCase()}|${tags['addr:city'] ?? ''}|${pointLat.toFixed(4)}|${pointLon.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      osmId: `${el.type}/${el.id}`,
      name,
      type: mapClientType(category, tags),
      category,
      categoryLabel: categoryLabel(category),
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

/** @deprecated use searchPlacesAround */
export async function searchHotelsAround(
  center: GeoPoint,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  return searchPlacesAround(center, radiusMeters, ['hospedagem'])
}

export function placeToClientInsert(
  place: PlaceResult,
  fallbackCity?: string | null,
  fallbackState?: string | null,
): ClientInsert {
  const phone = place.phone
  return {
    company_name: place.name,
    type: place.type,
    city: place.city || fallbackCity || null,
    state: place.state || fallbackState || null,
    phone,
    whatsapp: phone,
    email: place.email,
    website: place.website,
    contact_name: null,
    contact_role: null,
    notes: [
      place.address ? `Endereço OSM: ${place.address}` : null,
      `Categoria: ${place.categoryLabel}`,
      `Fonte: OpenStreetMap (${place.osmId})`,
      `Coords: ${place.lat.toFixed(5)}, ${place.lon.toFixed(5)}`,
    ]
      .filter(Boolean)
      .join('\n'),
    status: 'nao_contatado',
    last_contact_at: null,
    next_follow_up_at: null,
  }
}

/** @deprecated use placeToClientInsert */
export const hotelToClientInsert = placeToClientInsert

export function cityTabLabel(place: PlaceSuggestion): string {
  const city =
    place.city ||
    place.displayName.split(',')[0]?.trim() ||
    'Região'
  const state = place.state
  return state ? `${city}, ${state}` : city
}

export function cityTabId(place: PlaceSuggestion): string {
  const base = cityTabLabel(place)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${place.lat.toFixed(3)}-${place.lon.toFixed(3)}`
}
