import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, Download } from 'lucide-react'
import styled from 'styled-components'
import { HotelSearchMap } from '../components/HotelSearchMap'
import {
  Badge,
  Button,
  Card,
  ChipButton,
  EmptyState,
  Input,
  Label,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  Spinner,
  Stack,
} from '../components/ui'
import { CLIENT_TYPE_LABELS } from '../types'
import { createClientsBulk, fetchClients } from '../services/clients'
import {
  hotelToClientInsert,
  searchHotelsAround,
  searchPlaces,
  type HotelResult,
  type PlaceSuggestion,
} from '../services/geo'

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`

const ResultsPanel = styled(Card)`
  max-height: 640px;
  overflow: auto;
  padding: ${({ theme }) => theme.space[4]};
`

const ResultItem = styled.label`
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-bottom: 2px;
  }

  small {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`

const Suggestions = styled.ul`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.elevated};
  overflow: hidden;
`

const SuggestionBtn = styled.button`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.ink};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
`

const Slider = styled.input`
  width: 100%;
  accent-color: ${({ theme }) => theme.colors.primary};
`

const DEFAULT_CENTER = { lat: -23.5505, lon: -46.6333 }

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function HotelSearchPage() {
  const navigate = useNavigate()
  const [cityQuery, setCityQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [place, setPlace] = useState<PlaceSuggestion | null>(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [radiusKm, setRadiusKm] = useState(5)
  const [hotels, setHotels] = useState<HotelResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchingCity, setSearchingCity] = useState(false)
  const [searchingHotels, setSearchingHotels] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)
  const [onlyWithWebsite, setOnlyWithWebsite] = useState(false)

  const radiusMeters = radiusKm * 1000

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (onlyWithPhone && !h.phone) return false
      if (onlyWithEmail && !h.email) return false
      if (onlyWithWebsite && !h.website) return false
      return true
    })
  }, [hotels, onlyWithPhone, onlyWithEmail, onlyWithWebsite])

  const markers = useMemo(
    () =>
      filteredHotels.map((h) => ({
        id: h.osmId,
        lat: h.lat,
        lon: h.lon,
        name: h.name,
      })),
    [filteredHotels],
  )

  async function handleCitySearch() {
    setError(null)
    setInfo(null)
    setSearchingCity(true)
    try {
      const results = await searchPlaces(cityQuery)
      setSuggestions(results)
      if (results.length === 0) {
        setInfo('Nenhuma cidade encontrada. Tente outro nome.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca de cidade')
    } finally {
      setSearchingCity(false)
    }
  }

  function pickPlace(suggestion: PlaceSuggestion) {
    setPlace(suggestion)
    setCenter({ lat: suggestion.lat, lon: suggestion.lon })
    setSuggestions([])
    setCityQuery(suggestion.displayName.split(',')[0] ?? suggestion.displayName)
    setHotels([])
    setSelected(new Set())
  }

  async function handleHotelSearch() {
    setError(null)
    setInfo(null)
    setSearchingHotels(true)
    try {
      const results = await searchHotelsAround(center, radiusMeters)
      setHotels(results)
      setSelected(new Set(results.map((r) => r.osmId)))
      if (results.length === 0) {
        setInfo(
          'Nenhum hotel/pousada encontrado nesse raio no OpenStreetMap. Aumente o raio ou mude o ponto.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca de hotéis')
    } finally {
      setSearchingHotels(false)
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filteredHotels.map((h) => h.osmId)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function handleImport() {
    const picked = hotels.filter((h) => selected.has(h.osmId))
    if (picked.length === 0) {
      setError('Selecione ao menos um estabelecimento.')
      return
    }

    setImporting(true)
    setError(null)
    setInfo(null)
    try {
      const existing = await fetchClients()
      const existingKeys = new Set(
        existing.map(
          (c) =>
            `${normalizeName(c.company_name)}|${normalizeName(c.city ?? '')}`,
        ),
      )

      const toImport = picked.filter((h) => {
        const city = h.city || place?.city || ''
        const key = `${normalizeName(h.name)}|${normalizeName(city)}`
        return !existingKeys.has(key)
      })

      const skipped = picked.length - toImport.length

      if (toImport.length === 0) {
        setInfo(
          `Nada novo para importar. ${skipped} já existiam na sua lista.`,
        )
        return
      }

      const rows = toImport.map((h) =>
        hotelToClientInsert(h, place?.city, place?.state),
      )
      await createClientsBulk(rows)

      setInfo(
        `${toImport.length} importados${
          skipped > 0 ? ` · ${skipped} duplicados ignorados` : ''
        }.`,
      )
      navigate('/clientes?filter=nao_contatado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na importação')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Buscar hotéis</PageTitle>
          <PageSubtitle>
            Mapa gratuito (OpenStreetMap) · clique no mapa ou busque por cidade
          </PageSubtitle>
        </div>
        <Button
          onClick={handleImport}
          disabled={importing || selected.size === 0}
        >
          <Download size={16} />
          Importar selecionados ({selected.size})
        </Button>
      </PageHeader>

      <Layout>
        <Stack $gap={4}>
          <Card>
            <Stack $gap={3}>
              <Label htmlFor="city">Cidade ou região</Label>
              <Row>
                <Input
                  id="city"
                  placeholder="Ex.: Gramado, RS"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCitySearch()
                  }}
                />
                <Button
                  $variant="secondary"
                  onClick={handleCitySearch}
                  disabled={searchingCity || cityQuery.trim().length < 2}
                >
                  {searchingCity ? <Spinner /> : <Search size={16} />}
                  Buscar
                </Button>
              </Row>
              {suggestions.length > 0 && (
                <Suggestions>
                  {suggestions.map((s) => (
                    <li key={`${s.lat}-${s.lon}-${s.displayName}`}>
                      <SuggestionBtn type="button" onClick={() => pickPlace(s)}>
                        <MapPin
                          size={14}
                          style={{ display: 'inline', marginRight: 6 }}
                        />
                        {s.displayName}
                      </SuggestionBtn>
                    </li>
                  ))}
                </Suggestions>
              )}

              <div>
                <Label htmlFor="radius">
                  Raio: {radiusKm} km
                </Label>
                <Slider
                  id="radius"
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                />
              </div>

              <Hint>
                Clique no mapa para posicionar o centro do raio
                {place ? ` · região: ${place.city || cityQuery}` : ''}.
                A busca limita a 100 resultados por vez.
              </Hint>

              <Button
                onClick={handleHotelSearch}
                disabled={searchingHotels}
                $size="lg"
              >
                {searchingHotels
                  ? 'Consultando OpenStreetMap…'
                  : (
                    <>
                      <Search size={16} />
                      Buscar hotéis neste raio
                    </>
                  )}
              </Button>
            </Stack>
          </Card>

          <HotelSearchMap
            center={center}
            radiusMeters={radiusMeters}
            hotelMarkers={markers}
            onPickCenter={(lat, lon) => {
              setCenter({ lat, lon })
              setHotels([])
              setSelected(new Set())
            }}
          />
        </Stack>

        <ResultsPanel>
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>
              Resultados{' '}
              {hotels.length > 0
                ? `(${filteredHotels.length}${
                    filteredHotels.length !== hotels.length
                      ? ` de ${hotels.length}`
                      : ''
                  })`
                : ''}
            </strong>
            {filteredHotels.length > 0 && (
              <Row $gap={2}>
                <ChipButton type="button" onClick={selectAll}>
                  Todos
                </ChipButton>
                <ChipButton type="button" onClick={selectNone}>
                  Nenhum
                </ChipButton>
              </Row>
            )}
          </Row>

          {hotels.length > 0 && (
            <Stack $gap={2} style={{ marginBottom: 12 }}>
              <Label>Filtrar resultados</Label>
              <Row $gap={2} style={{ flexWrap: 'wrap' }}>
                <ChipButton
                  type="button"
                  $active={onlyWithPhone}
                  onClick={() => setOnlyWithPhone((v) => !v)}
                >
                  Com telefone
                </ChipButton>
                <ChipButton
                  type="button"
                  $active={onlyWithEmail}
                  onClick={() => setOnlyWithEmail((v) => !v)}
                >
                  Com email
                </ChipButton>
                <ChipButton
                  type="button"
                  $active={onlyWithWebsite}
                  onClick={() => setOnlyWithWebsite((v) => !v)}
                >
                  Com site
                </ChipButton>
              </Row>
            </Stack>
          )}

          {error && (
            <EmptyState>
              <strong>Erro</strong>
              <span>{error}</span>
            </EmptyState>
          )}

          {!error && info && hotels.length === 0 && (
            <EmptyState>
              <strong>Aviso</strong>
              <span>{info}</span>
            </EmptyState>
          )}

          {!error && hotels.length === 0 && !info && (
            <EmptyState>
              <strong>Nada ainda</strong>
              <span>
                Busque uma cidade ou clique no mapa, ajuste o raio e rode a
                busca.
              </span>
            </EmptyState>
          )}

          {!error &&
            hotels.length > 0 &&
            filteredHotels.length === 0 && (
              <EmptyState>
                <strong>Nenhum no filtro</strong>
                <span>
                  Há {hotels.length} resultados, mas nenhum passa nos filtros
                  ativos.
                </span>
              </EmptyState>
            )}

          {filteredHotels.map((h) => (
            <ResultItem key={h.osmId}>
              <input
                type="checkbox"
                checked={selected.has(h.osmId)}
                onChange={() => toggleOne(h.osmId)}
              />
              <div>
                <strong>{h.name}</strong>
                <Row $gap={2} style={{ margin: '4px 0' }}>
                  <Badge $tone="primary">{CLIENT_TYPE_LABELS[h.type]}</Badge>
                  {(h.city || place?.city) && (
                    <small>
                      {[h.city || place?.city, h.state || place?.state]
                        .filter(Boolean)
                        .join(' / ')}
                    </small>
                  )}
                </Row>
                <small>
                  {[h.phone, h.email, h.website].filter(Boolean).join(' · ') ||
                    'Sem telefone/email no OSM'}
                </small>
              </div>
            </ResultItem>
          ))}

          {info && hotels.length > 0 && (
            <Hint style={{ marginTop: 12 }}>{info}</Hint>
          )}
        </ResultsPanel>
      </Layout>
    </Page>
  )
}
