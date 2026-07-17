import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, Download, X, Mail } from 'lucide-react'
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
  cityTabId,
  cityTabLabel,
  DEFAULT_SEARCH_CATEGORIES,
  placeToClientInsert,
  SEARCH_CATEGORIES,
  searchPlaces,
  searchPlacesAround,
  type PlaceResult,
  type PlaceSuggestion,
  type SearchCategoryId,
} from '../services/geo'
import { prepareFirstContactEmail } from '../utils/emailTemplate'

const STORAGE_KEY = 'crm-place-search-tabs'
const MAX_TABS = 8

interface CityTab {
  id: string
  label: string
  place: PlaceSuggestion | null
  center: { lat: number; lon: number }
  radiusKm: number
  categories: SearchCategoryId[]
  results: PlaceResult[]
  selected: string[]
  onlyWithPhone: boolean
  onlyWithEmail: boolean
  onlyWithWebsite: boolean
  cityQuery: string
}

interface StoredSearch {
  tabs: CityTab[]
  activeTabId: string | null
}

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

const MailBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.elevated};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
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

const TabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const Tab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  height: 34px;
  padding: 0 ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primaryMuted : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.muted};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`

const TabClose = styled.span`
  display: inline-flex;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`

const DEFAULT_CENTER = { lat: -23.5505, lon: -46.6333 }

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function emptyTab(partial?: Partial<CityTab>): CityTab {
  return {
    id: `draft-${Date.now()}`,
    label: 'Nova busca',
    place: null,
    center: DEFAULT_CENTER,
    radiusKm: 5,
    categories: [...DEFAULT_SEARCH_CATEGORIES],
    results: [],
    selected: [],
    onlyWithPhone: false,
    onlyWithEmail: false,
    onlyWithWebsite: false,
    cityQuery: '',
    ...partial,
  }
}

function loadStored(): StoredSearch {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { tabs: [], activeTabId: null }
    const parsed = JSON.parse(raw) as StoredSearch
    if (!Array.isArray(parsed.tabs)) return { tabs: [], activeTabId: null }
    return parsed
  } catch {
    return { tabs: [], activeTabId: null }
  }
}

export function HotelSearchPage() {
  const navigate = useNavigate()
  const stored = useMemo(() => loadStored(), [])

  const [tabs, setTabs] = useState<CityTab[]>(() =>
    stored.tabs.length > 0 ? stored.tabs : [],
  )
  const [activeTabId, setActiveTabId] = useState<string | null>(
    () => stored.activeTabId ?? stored.tabs[0]?.id ?? null,
  )
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [searchingCity, setSearchingCity] = useState(false)
  const [searchingPlaces, setSearchingPlaces] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showContactFilters, setShowContactFilters] = useState(false)
  const [preparingEmailId, setPreparingEmailId] = useState<string | null>(null)

  const activeTab = useMemo(() => {
    if (!activeTabId) return null
    return tabs.find((t) => t.id === activeTabId) ?? null
  }, [tabs, activeTabId])

  const draftQuery = activeTab?.cityQuery ?? ''
  const center = activeTab?.center ?? DEFAULT_CENTER
  const radiusKm = activeTab?.radiusKm ?? 5
  const categories = activeTab?.categories ?? DEFAULT_SEARCH_CATEGORIES
  const results = activeTab?.results ?? []
  const selected = useMemo(
    () => new Set(activeTab?.selected ?? []),
    [activeTab?.selected],
  )
  const onlyWithPhone = activeTab?.onlyWithPhone ?? false
  const onlyWithEmail = activeTab?.onlyWithEmail ?? false
  const onlyWithWebsite = activeTab?.onlyWithWebsite ?? false
  const place = activeTab?.place ?? null

  const radiusMeters = radiusKm * 1000

  useEffect(() => {
    const payload: StoredSearch = { tabs, activeTabId }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // quota / private mode — ignore
    }
  }, [tabs, activeTabId])

  const updateActive = useCallback(
    (patch: Partial<CityTab>) => {
      if (!activeTabId) return
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, ...patch } : t)),
      )
    },
    [activeTabId],
  )

  const filteredResults = useMemo(() => {
    return results.filter((h) => {
      if (onlyWithPhone && !h.phone) return false
      if (onlyWithEmail && !h.email) return false
      if (onlyWithWebsite && !h.website) return false
      return true
    })
  }, [results, onlyWithPhone, onlyWithEmail, onlyWithWebsite])

  const markers = useMemo(
    () =>
      filteredResults.map((h) => ({
        id: h.osmId,
        lat: h.lat,
        lon: h.lon,
        name: h.name,
      })),
    [filteredResults],
  )

  async function handleCitySearch() {
    setError(null)
    setInfo(null)
    setSearchingCity(true)
    try {
      const found = await searchPlaces(draftQuery)
      setSuggestions(found)
      if (found.length === 0) {
        setInfo('Nenhum endereço encontrado. Tente outro nome.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca de endereço')
    } finally {
      setSearchingCity(false)
    }
  }

  function ensureActiveTab(): string {
    if (activeTabId && tabs.some((t) => t.id === activeTabId)) {
      return activeTabId
    }
    const draft = emptyTab()
    setTabs((prev) => [...prev, draft])
    setActiveTabId(draft.id)
    return draft.id
  }

  function pickPlace(suggestion: PlaceSuggestion) {
    setError(null)
    setInfo(null)
    setSuggestions([])

    const id = cityTabId(suggestion)
    const label = cityTabLabel(suggestion)
    const existing = tabs.find((t) => t.id === id)

    if (existing) {
      setActiveTabId(existing.id)
      setTabs((prev) =>
        prev.map((t) =>
          t.id === existing.id
            ? {
                ...t,
                place: suggestion,
                center: { lat: suggestion.lat, lon: suggestion.lon },
                cityQuery: label,
              }
            : t,
        ),
      )
      return
    }

    const nextTab = emptyTab({
      id,
      label,
      place: suggestion,
      center: { lat: suggestion.lat, lon: suggestion.lon },
      cityQuery: label,
      categories: activeTab?.categories ?? [...DEFAULT_SEARCH_CATEGORIES],
      radiusKm: activeTab?.radiusKm ?? 5,
    })

    setTabs((prev) => {
      const withoutDraft = prev.filter((t) => !t.id.startsWith('draft-'))
      const capped =
        withoutDraft.length >= MAX_TABS
          ? withoutDraft.slice(withoutDraft.length - MAX_TABS + 1)
          : withoutDraft
      return [...capped, nextTab]
    })
    setActiveTabId(id)
  }

  function closeTab(id: string, e: MouseEvent) {
    e.stopPropagation()
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeTabId === id) {
        setActiveTabId(next[next.length - 1]?.id ?? null)
      }
      return next
    })
    setSuggestions([])
    setError(null)
    setInfo(null)
  }

  function startNewTab() {
    setTabs((prev) => {
      if (prev.length >= MAX_TABS) {
        setInfo(`Limite de ${MAX_TABS} cidades. Feche uma aba para abrir outra.`)
        return prev
      }
      const draft = emptyTab()
      setActiveTabId(draft.id)
      setSuggestions([])
      setError(null)
      setInfo(null)
      return [...prev, draft]
    })
  }

  function toggleCategory(id: SearchCategoryId) {
    setTabs((prev) => {
      let list = prev
      let tabId = activeTabId
      if (!tabId || !prev.some((t) => t.id === tabId)) {
        const draft = emptyTab()
        list = [...prev, draft]
        tabId = draft.id
        setActiveTabId(tabId)
      }
      return list.map((t) => {
        if (t.id !== tabId) return t
        const has = t.categories.includes(id)
        const nextCats = has
          ? t.categories.filter((c) => c !== id)
          : [...t.categories, id]
        return {
          ...t,
          categories: nextCats.length > 0 ? nextCats : t.categories,
        }
      })
    })
  }

  async function handlePlaceSearch() {
    let tab = activeTab
    if (!tab) {
      tab = emptyTab({
        cityQuery: draftQuery,
        center,
        radiusKm,
        categories: [...categories],
      })
      setTabs((prev) => [...prev, tab!])
      setActiveTabId(tab.id)
    }

    setError(null)
    setInfo(null)
    setSearchingPlaces(true)
    try {
      const found = await searchPlacesAround(
        tab.center,
        tab.radiusKm * 1000,
        tab.categories,
      )
      const tabId = tab.id
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? {
                ...t,
                results: found,
                selected: found.filter((r) => r.phone).map((r) => r.osmId),
                onlyWithPhone: false,
              }
            : t,
        ),
      )
      if (found.length === 0) {
        setInfo(
          'Nenhum estabelecimento nesse raio no OpenStreetMap. Aumente o raio, mude o ponto ou as categorias.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca')
    } finally {
      setSearchingPlaces(false)
    }
  }

  function toggleOne(id: string) {
    updateActive({
      selected: selected.has(id)
        ? [...selected].filter((x) => x !== id)
        : [...selected, id],
    })
  }

  function selectAll() {
    updateActive({ selected: filteredResults.map((h) => h.osmId) })
  }

  function selectNone() {
    updateActive({ selected: [] })
  }

  async function handleImport() {
    const picked = results.filter((h) => selected.has(h.osmId))
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
        placeToClientInsert(h, place?.city, place?.state),
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

  function onQueryChange(value: string) {
    if (!activeTabId) {
      const draft = emptyTab({ cityQuery: value })
      setTabs([draft])
      setActiveTabId(draft.id)
      return
    }
    updateActive({ cityQuery: value })
  }

  async function handlePrepareEmail(hotel: PlaceResult, event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (!hotel.email) return

    setPreparingEmailId(hotel.osmId)
    setError(null)
    try {
      await prepareFirstContactEmail(hotel.email, hotel.name)
      setInfo(
        `E-mail de ${hotel.name} copiado. Cole no corpo do Gmail com Ctrl+V e envie.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível preparar o e-mail. Copie o HTML manualmente.',
      )
    } finally {
      setPreparingEmailId(null)
    }
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Buscar</PageTitle>
          <PageSubtitle>
            Endereço + mapa · abas por cidade · várias categorias
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

      <TabBar>
        {tabs.map((t) => (
          <Tab
            key={t.id}
            type="button"
            $active={t.id === activeTabId}
            onClick={() => {
              setActiveTabId(t.id)
              setSuggestions([])
              setError(null)
              setInfo(null)
            }}
          >
            <MapPin size={14} />
            {t.label}
            <TabClose
              role="button"
              aria-label={`Fechar ${t.label}`}
              onClick={(e) => closeTab(t.id, e)}
            >
              <X size={14} />
            </TabClose>
          </Tab>
        ))}
        <ChipButton type="button" onClick={startNewTab}>
          + Cidade
        </ChipButton>
      </TabBar>

      <Layout>
        <Stack $gap={4}>
          <Card>
            <Stack $gap={3}>
              <Label htmlFor="city">Cidade ou endereço</Label>
              <Row>
                <Input
                  id="city"
                  placeholder="Ex.: Gramado, RS"
                  value={draftQuery}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCitySearch()
                  }}
                />
                <Button
                  $variant="secondary"
                  onClick={handleCitySearch}
                  disabled={searchingCity || draftQuery.trim().length < 2}
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
                <Label>Categorias</Label>
                <Row $gap={2} style={{ flexWrap: 'wrap', marginTop: 8 }}>
                  {SEARCH_CATEGORIES.map((c) => (
                    <ChipButton
                      key={c.id}
                      type="button"
                      $active={categories.includes(c.id)}
                      onClick={() => toggleCategory(c.id)}
                    >
                      {c.label}
                    </ChipButton>
                  ))}
                </Row>
              </div>

              <div>
                <Label htmlFor="radius">Raio: {radiusKm} km</Label>
                <Slider
                  id="radius"
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => {
                    const km = Number(e.target.value)
                    setTabs((prev) => {
                      let list = prev
                      let tabId = activeTabId
                      if (!tabId || !prev.some((t) => t.id === tabId)) {
                        const draft = emptyTab({ radiusKm: km })
                        list = [...prev, draft]
                        tabId = draft.id
                        setActiveTabId(tabId)
                      }
                      return list.map((t) =>
                        t.id === tabId ? { ...t, radiusKm: km } : t,
                      )
                    })
                  }}
                />
              </div>

              <Hint>
                Categorias padrão: Comércio e Serviços. Pré-seleção: só com
                telefone.
              </Hint>

              <Button
                onClick={handlePlaceSearch}
                disabled={searchingPlaces || categories.length === 0}
                $size="lg"
              >
                {searchingPlaces ? (
                  'Consultando OpenStreetMap…'
                ) : (
                  <>
                    <Search size={16} />
                    Buscar neste raio
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
              const tabId = ensureActiveTab()
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === tabId
                    ? {
                        ...t,
                        center: { lat, lon },
                        results: [],
                        selected: [],
                      }
                    : t,
                ),
              )
            }}
          />
        </Stack>

        <ResultsPanel>
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>
              Resultados{' '}
              {results.length > 0
                ? `(${filteredResults.length}${
                    filteredResults.length !== results.length
                      ? ` de ${results.length}`
                      : ''
                  })`
                : ''}
            </strong>
            {filteredResults.length > 0 && (
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

          {results.length > 0 && (
            <Stack $gap={2} style={{ marginBottom: 12 }}>
              <ChipButton
                type="button"
                $active={showContactFilters || onlyWithPhone || onlyWithEmail || onlyWithWebsite}
                onClick={() => setShowContactFilters((v) => !v)}
              >
                Filtros de contato
              </ChipButton>
              {showContactFilters && (
                <Row $gap={2} style={{ flexWrap: 'wrap' }}>
                  <ChipButton
                    type="button"
                    $active={onlyWithPhone}
                    onClick={() =>
                      updateActive({ onlyWithPhone: !onlyWithPhone })
                    }
                  >
                    Com telefone
                  </ChipButton>
                  <ChipButton
                    type="button"
                    $active={onlyWithEmail}
                    onClick={() =>
                      updateActive({ onlyWithEmail: !onlyWithEmail })
                    }
                  >
                    Com email
                  </ChipButton>
                  <ChipButton
                    type="button"
                    $active={onlyWithWebsite}
                    onClick={() =>
                      updateActive({ onlyWithWebsite: !onlyWithWebsite })
                    }
                  >
                    Com site
                  </ChipButton>
                </Row>
              )}
              <Hint>
                Pré-selecionados: só quem tem telefone no OSM (melhor para
                WhatsApp).
              </Hint>
            </Stack>
          )}

          {error && (
            <EmptyState>
              <strong>Erro</strong>
              <span>{error}</span>
            </EmptyState>
          )}

          {!error && info && results.length === 0 && (
            <EmptyState>
              <strong>Aviso</strong>
              <span>{info}</span>
            </EmptyState>
          )}

          {!error && results.length === 0 && !info && (
            <EmptyState>
              <strong>Nada ainda</strong>
              <span>
                Busque um endereço, escolha a sugestão (vira aba da cidade),
                marque categorias e rode a busca.
              </span>
            </EmptyState>
          )}

          {!error && results.length > 0 && filteredResults.length === 0 && (
            <EmptyState>
              <strong>Nenhum no filtro</strong>
              <span>
                Há {results.length} resultados, mas nenhum passa nos filtros
                ativos.
              </span>
            </EmptyState>
          )}

          {filteredResults.map((h) => (
            <ResultItem key={h.osmId}>
              <input
                type="checkbox"
                checked={selected.has(h.osmId)}
                onChange={() => toggleOne(h.osmId)}
              />
              <div>
                <strong>{h.name}</strong>
                <Row $gap={2} style={{ margin: '4px 0', flexWrap: 'wrap' }}>
                  <Badge $tone="primary">{h.categoryLabel}</Badge>
                  <Badge>{CLIENT_TYPE_LABELS[h.type]}</Badge>
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
                {h.email && (
                  <MailBtn
                    type="button"
                    disabled={preparingEmailId === h.osmId}
                    onClick={(e) => void handlePrepareEmail(h, e)}
                  >
                    <Mail size={14} />
                    {preparingEmailId === h.osmId
                      ? 'Preparando…'
                      : 'Preparar e-mail'}
                  </MailBtn>
                )}
              </div>
            </ResultItem>
          ))}

          {info && results.length > 0 && (
            <Hint style={{ marginTop: 12 }}>{info}</Hint>
          )}
        </ResultsPanel>
      </Layout>
    </Page>
  )
}
