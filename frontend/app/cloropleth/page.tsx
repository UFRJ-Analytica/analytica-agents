"use client"

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Feature, FeatureCollection, GeoJsonObject, Geometry, MultiPolygon, Polygon } from 'geojson'
import type { LatLngBoundsExpression, LeafletMouseEvent, Layer, PathOptions } from 'leaflet'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import neighborhoodsArcgis from '../../assets/dicts/pgeo3-rio-de-janeiro.json'
import { useAuth } from '../../src/components/providers/AuthProvider'
import type { GeoJSONProps } from 'react-leaflet'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as typeof import('react-leaflet').MapContainer
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as typeof import('react-leaflet').TileLayer
const GeoJSONLayer = dynamic(() => import('react-leaflet').then((m) => m.GeoJSON), { ssr: false }) as typeof import('react-leaflet').GeoJSON

type MapLevel = 'municipios' | 'bairros'

type NeighborhoodProperties = {
  id: number
  name: string
  regiaoAdm: string
  areaPlane: number
  planningAreaLabel: string
  codBairro: string
  codRa: string
  rp: string
  codRp: string
  portalLink: string | null
}

type MunicipalityProperties = {
  id: string
  name: string
  description: string
  densityIndex: number
}

type NeighborhoodFeature = Feature<Polygon | MultiPolygon, NeighborhoodProperties>
type MunicipalityFeature = Feature<Geometry, MunicipalityProperties>

type SelectionState = { level: MapLevel; props: NeighborhoodProperties | MunicipalityProperties } | null

interface ArcgisFeatureCollection {
  features?: Array<{
    attributes?: {
      objectid?: number
      nome?: string
      regiao_adm?: string
      area_plane?: string | number
      codbairro?: string | number
      codra?: string | number
      cod_rp?: string | number
      rp?: string
      link?: string
    }
    geometry?: {
      rings?: number[][][]
    }
  }>
}

const RIO_GEOJSON_SOURCE =
  process.env.NEXT_PUBLIC_RIO_GEOJSON_URL ?? 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-33-mun.json'
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_STATE_BOUNDS: LatLngBoundsExpression = [[-24.5, -44.9], [-20.5, -40.5]]
const STATE_LOCK_BOUNDS: LatLngBoundsExpression = [[-25, -45.6], [-20, -39.8]]

const AREA_PLANNING_LABELS: Record<number, string> = {
  1: 'AP-1 Centro',
  2: 'AP-2 Zona Sul',
  3: 'AP-3 Zona Norte',
  4: 'AP-4 Barra/Jacarepaguá',
  5: 'AP-5 Zona Oeste',
}

const MUNICIPALITY_DENSITY_HINTS: Record<string, number> = {
  '3304557': 5200,
  '3304904': 4200,
  '3303500': 3700,
  '3303302': 3100,
  '3301702': 2500,
  '3303005': 2100,
  '3302401': 2600,
  '3300405': 1800,
  '3301900': 1500,
  '3302205': 1900,
  '3305109': 2600,
}

const MUNICIPALITY_LEGEND = [
  { color: '#800026', label: '> 5.000 hab/km²' },
  { color: '#BD0026', label: '3.500 - 5.000' },
  { color: '#E31A1C', label: '2.500 - 3.500' },
  { color: '#FC4E2A', label: '1.500 - 2.500' },
  { color: '#FD8D3C', label: '800 - 1.500' },
  { color: '#FEB24C', label: '400 - 800' },
  { color: '#FED976', label: '200 - 400' },
  { color: '#FFEDA0', label: '< 200' },
] as const

const NEIGHBORHOOD_LEGEND = [
  { color: '#08306b', label: 'AP-1 Centro' },
  { color: '#08519c', label: 'AP-2 Zona Sul' },
  { color: '#2171b5', label: 'AP-3 Zona Norte' },
  { color: '#4292c6', label: 'AP-4 Barra/Jacarepaguá' },
  { color: '#6baed6', label: 'AP-5 Zona Oeste' },
] as const

const NEIGHBORHOODS_COLLECTION = convertArcgisToGeojson(neighborhoodsArcgis as ArcgisFeatureCollection)
const NEIGHBORHOODS_BOUNDS = buildBoundsFromCollection(NEIGHBORHOODS_COLLECTION) ?? [[-23.1, -43.8], [-22.7, -43.0]]
const municipalityStyle: NonNullable<GeoJSONProps['style']> = (feature) =>
  baseStyle(getMunicipalityColor((feature as MunicipalityFeature)?.properties?.densityIndex ?? 0))
const neighborhoodStyle: NonNullable<GeoJSONProps['style']> = (feature) =>
  baseStyle(getNeighborhoodColor((feature as NeighborhoodFeature)?.properties?.areaPlane ?? 0))

export default function CloroplethPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [mapLevel, setMapLevel] = useState<MapLevel>('municipios')
  const [municipalities, setMunicipalities] = useState<FeatureCollection<Geometry, MunicipalityProperties> | null>(null)
  const [municipalLoading, setMunicipalLoading] = useState(true)
  const [municipalError, setMunicipalError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<SelectionState>(null)
  const [selection, setSelection] = useState<SelectionState>(null)
  useEffect(() => {
    import('leaflet/dist/leaflet.css').catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/?auth=signin')
    }
  }, [loading, session, router])

  useEffect(() => {
    let cancelled = false

    async function loadMunicipalities() {
      setMunicipalLoading(true)
      setMunicipalError(null)
      try {
        const res = await fetch(RIO_GEOJSON_SOURCE, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Erro ${res.status}`)
        }
        const raw = (await res.json()) as FeatureCollection<Geometry, Record<string, any>>
        if (cancelled) return
        setMunicipalities(normalizeMunicipalityCollection(raw))
      } catch (error) {
        if (cancelled) return
        console.error('Erro ao carregar municípios do RJ', error)
        setMunicipalities(null)
        setMunicipalError('Não foi possível carregar os municípios do estado agora.')
      } finally {
        if (!cancelled) {
          setMunicipalLoading(false)
        }
      }
    }

    loadMunicipalities()
    return () => {
      cancelled = true
    }
  }, [])

  const bounds = useMemo<LatLngBoundsExpression>(() => {
    if (mapLevel === 'municipios') {
      return buildBoundsFromCollection(municipalities) ?? DEFAULT_STATE_BOUNDS
    }
    return NEIGHBORHOODS_BOUNDS
  }, [mapLevel, municipalities])

  const legend = mapLevel === 'municipios' ? MUNICIPALITY_LEGEND : NEIGHBORHOOD_LEGEND
  const infoRegion = hovered ?? selection
  const infoMunicipality = infoRegion?.level === 'municipios' ? (infoRegion.props as MunicipalityProperties) : null
  const infoNeighborhood = infoRegion?.level === 'bairros' ? (infoRegion.props as NeighborhoodProperties) : null
  const municipalityCount = municipalities?.features.length ?? 0
  const mapKey = mapLevel === 'municipios' ? `state-${municipalityCount}` : `city-${NEIGHBORHOODS_COLLECTION.features.length}`

  const handleLevelChange = useCallback((next: MapLevel) => {
    setMapLevel(next)
    setHovered(null)
    setSelection((prev) => (prev?.level === next ? prev : null))
  }, [])

  const handleMunicipalityMouseOver = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: MunicipalityFeature }
    highlightLayer(layer)
    if (layer.feature?.properties) {
      setHovered({ level: 'municipios', props: layer.feature.properties })
    }
  }, [])

  const handleMunicipalityMouseOut = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: MunicipalityFeature; setStyle?: (options: PathOptions) => void }
    const density = layer.feature?.properties?.densityIndex ?? 0
    layer.setStyle?.(baseStyle(getMunicipalityColor(density)))
    setHovered(null)
  }, [])

  const handleMunicipalityClick = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: MunicipalityFeature }
    if (layer.feature?.properties) {
      setSelection({ level: 'municipios', props: layer.feature.properties })
    }
  }, [])

  const handleNeighborhoodMouseOver = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: NeighborhoodFeature }
    highlightLayer(layer)
    if (layer.feature?.properties) {
      setHovered({ level: 'bairros', props: layer.feature.properties })
    }
  }, [])

  const handleNeighborhoodMouseOut = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: NeighborhoodFeature; setStyle?: (options: PathOptions) => void }
    const ap = layer.feature?.properties?.areaPlane ?? 0
    layer.setStyle?.(baseStyle(getNeighborhoodColor(ap)))
    setHovered(null)
  }, [])

  const handleNeighborhoodClick = useCallback((event: LeafletMouseEvent) => {
    const layer = event.target as Layer & { feature?: NeighborhoodFeature }
    if (layer.feature?.properties) {
      setSelection({ level: 'bairros', props: layer.feature.properties })
    }
  }, [])

  const onEachMunicipality = useCallback(
    (_feature: MunicipalityFeature, layer: Layer) => {
      layer.on({ mouseover: handleMunicipalityMouseOver, mouseout: handleMunicipalityMouseOut, click: handleMunicipalityClick })
    },
    [handleMunicipalityMouseOver, handleMunicipalityMouseOut, handleMunicipalityClick],
  )

  const onEachNeighborhood = useCallback(
    (_feature: NeighborhoodFeature, layer: Layer) => {
      layer.on({ mouseover: handleNeighborhoodMouseOver, mouseout: handleNeighborhoodMouseOut, click: handleNeighborhoodClick })
    },
    [handleNeighborhoodMouseOver, handleNeighborhoodMouseOut, handleNeighborhoodClick],
  )

  const handleClearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  const handleOpenSelectionLink = useCallback(() => {
    if (!selection) return
    let url: string | null = null
    if (selection.level === 'municipios') {
      url = buildMunicipalityProfileUrl((selection.props as MunicipalityProperties).name)
    } else {
      url = buildNeighborhoodLink(selection.props as NeighborhoodProperties)
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [selection])

  if (loading) {
    return (
      <Box sx={{ height: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Verificando credenciais...
      </Box>
    )
  }

  if (!session) {
    return (
      <Box sx={{ height: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Redirecionando para a landing...
      </Box>
    )
  }

  return (
    <Stack spacing={4} sx={{ pb: 6 }}>
      <Stack spacing={1}>
        <Typography variant="h4" fontWeight={700}>
          Mapa coroplético do estado do Rio de Janeiro
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize rapidamente densidade sintética por município ou detalhe os bairros da capital para integrar com futuros endpoints de geolocalização.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(120deg, #eef2ff, #f8fafc)' }}>
          <Typography variant="overline" color="text.secondary">
            Municípios monitorados
          </Typography>
          <Typography variant="h3" fontWeight={700}>
            {municipalityCount || '--'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            GeoJSON oficial (RJ) agrupado por densidade populacional sintética.
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" color="text.secondary">
            Bairros oficiais da capital
          </Typography>
          <Typography variant="h3" fontWeight={700}>
            {NEIGHBORHOODS_COLLECTION.features.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fonte: Pgeo3 + Data.Rio com agrupamento por Área de Planejamento (AP).
          </Typography>
        </Paper>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Camada ativa:
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Chip label="Municípios do estado" color={mapLevel === 'municipios' ? 'primary' : 'default'} variant={mapLevel === 'municipios' ? 'filled' : 'outlined'} onClick={() => handleLevelChange('municipios')} clickable />
          <Chip label="Bairros da capital" color={mapLevel === 'bairros' ? 'primary' : 'default'} variant={mapLevel === 'bairros' ? 'filled' : 'outlined'} onClick={() => handleLevelChange('bairros')} clickable />
        </Stack>
      </Stack>

      {municipalError && (
        <Alert severity="warning">
          {municipalError} — configure <code>NEXT_PUBLIC_RIO_GEOJSON_URL</code> ou tente novamente.
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', height: { xs: 520, md: 640 } }}>
          <MapContainer
            key={mapKey}
            bounds={bounds}
            maxBounds={STATE_LOCK_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={7}
            maxZoom={15}
            zoomControl
            style={{ height: '100%', width: '100%', backgroundColor: '#eef2ff' }}
          >
            <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap contributors" />
            {mapLevel === 'municipios' && municipalities?.features.length ? (
              <GeoJSONLayer data={municipalities as unknown as GeoJsonObject} style={municipalityStyle} onEachFeature={onEachMunicipality} />
            ) : null}
            {mapLevel === 'bairros' ? (
              <GeoJSONLayer data={NEIGHBORHOODS_COLLECTION as unknown as GeoJsonObject} style={neighborhoodStyle} onEachFeature={onEachNeighborhood} />
            ) : null}
          </MapContainer>

          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, maxWidth: 320, p: 2, borderRadius: 2, boxShadow: 3, backgroundColor: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15,23,42,0.08)' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {mapLevel === 'municipios' ? 'Municípios do estado' : 'Bairros da capital'}
            </Typography>
            {infoMunicipality ? (
              <Stack spacing={0.5}>
                <Typography variant="h6">{infoMunicipality.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Densidade sintética: {Math.round(infoMunicipality.densityIndex).toLocaleString('pt-BR')} hab/km²
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {infoMunicipality.description}
                </Typography>
              </Stack>
            ) : infoNeighborhood ? (
              <Stack spacing={0.5}>
                <Typography variant="h6">{infoNeighborhood.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Região Administrativa: {infoNeighborhood.regiaoAdm}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {infoNeighborhood.planningAreaLabel} · RP {infoNeighborhood.rp}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Passe o mouse para destacar a região e clique para fixar detalhes.
              </Typography>
            )}
          </Box>

          <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000, p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,23,42,0.08)', boxShadow: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Legenda
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {legend.map((item) => (
                <Stack key={item.label} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 16, height: 16, borderRadius: 0.5, backgroundColor: item.color }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {mapLevel === 'municipios' && municipalLoading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'rgba(248,250,255,0.65)', zIndex: 900 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Carregando divisões municipais...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Painel da região selecionada
          </Typography>
          {selection ? (
            <>
              <Typography variant="h5">{selection.props.name}</Typography>
              <Divider />
              {selection.level === 'municipios' ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Densidade sintética: {Math.round((selection.props as MunicipalityProperties).densityIndex).toLocaleString('pt-BR')} hab/km²
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fonte pública (GeoJSON RJ) — adapte com indicadores do backend futuramente.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Região Administrativa: {(selection.props as NeighborhoodProperties).regiaoAdm}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Área de Planejamento: {(selection.props as NeighborhoodProperties).planningAreaLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    RP {(selection.props as NeighborhoodProperties).rp} · Código bairro {(selection.props as NeighborhoodProperties).codBairro}
                  </Typography>
                </Stack>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="contained" onClick={handleOpenSelectionLink}>
                  Abrir dados oficiais
                </Button>
                <Button variant="text" onClick={handleClearSelection}>
                  Limpar seleção
                </Button>
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Clique em uma região para salvar o contexto e integrar com endpoints de interesse (geo, regulação etc.).
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}

function convertArcgisToGeojson(source: ArcgisFeatureCollection): FeatureCollection<Polygon | MultiPolygon, NeighborhoodProperties> {
  const features: NeighborhoodFeature[] = []

  source?.features?.forEach((feature, index) => {
    const rings = feature.geometry?.rings
    if (!Array.isArray(rings) || !rings.length) {
      return
    }
    const coordinates = rings.map((ring) =>
      ring
        .filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2)
        .map(([lng, lat]) => [lng, lat]),
    )
    const areaPlane = toNumber(feature.attributes?.area_plane)
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates },
      properties: {
        id: feature.attributes?.objectid ?? index,
        name: (feature.attributes?.nome ?? 'Bairro sem nome').trim(),
        regiaoAdm: feature.attributes?.regiao_adm ?? 'Não informado',
        areaPlane,
        planningAreaLabel: AREA_PLANNING_LABELS[areaPlane] ?? `AP-${areaPlane || 'N/D'}`,
        codBairro: String(feature.attributes?.codbairro ?? ''),
        codRa: String(feature.attributes?.codra ?? ''),
        rp: feature.attributes?.rp ?? 'N/D',
        codRp: String(feature.attributes?.cod_rp ?? ''),
        portalLink: feature.attributes?.link ?? null,
      },
    })
  })

  return { type: 'FeatureCollection', features }
}

function normalizeMunicipalityCollection(raw: FeatureCollection<Geometry, Record<string, any>>): FeatureCollection<Geometry, MunicipalityProperties> {
  const features: MunicipalityFeature[] = []
  raw?.features?.forEach((feature, index) => {
    if (!feature?.geometry) return
    const props = feature.properties ?? {}
    const id = String(props.id ?? props.codarea ?? props.codigo ?? feature.id ?? `mun-${index}`)
    const name = String(props.name ?? props.nome ?? props.NM_MUN ?? 'Município sem nome')
    const description = String(props.description ?? props.descricao ?? name)
    features.push({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        id,
        name,
        description,
        densityIndex: computeMunicipalityDensity(id, name),
      },
    })
  })
  return { type: 'FeatureCollection', features }
}

function computeMunicipalityDensity(id: string, name: string): number {
  if (MUNICIPALITY_DENSITY_HINTS[id]) {
    return MUNICIPALITY_DENSITY_HINTS[id]
  }
  const cleaned = slugify(name)
  let hash = 0
  for (let i = 0; i < cleaned.length; i += 1) {
    hash = (hash + cleaned.charCodeAt(i) * 31) % 6000
  }
  return 400 + (hash % 3200)
}

function buildBoundsFromCollection(collection?: FeatureCollection<Geometry, any> | null): LatLngBoundsExpression | undefined {
  if (!collection?.features?.length) {
    return undefined
  }
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity

  collection.features.forEach((feature) => {
    if (!feature?.geometry) return
    const polygons = geometryToPolygons(feature.geometry)
    polygons.forEach((ring) => {
      ring.forEach(([lng, lat]) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
      })
    })
  })

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) {
    return undefined
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ]
}

function geometryToPolygons(geometry: Geometry): number[][][] {
  if (geometry.type === 'Polygon') return geometry.coordinates as number[][][]
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as number[][][][]).flat()
  return []
}

function highlightLayer(layer: Layer) {
  const target = layer as Layer & { setStyle?: (options: PathOptions) => void; bringToFront?: () => void }
  target.setStyle?.({ weight: 3, color: '#0f172a', dashArray: '', fillOpacity: 0.9 })
  target.bringToFront?.()
}

function baseStyle(fillColor: string): PathOptions {
  return {
    weight: 1,
    opacity: 1,
    color: '#f8fafc',
    dashArray: '2',
    fillOpacity: 0.75,
    fillColor,
  }
}

function getMunicipalityColor(value: number): string {
  if (value > 5000) return '#800026'
  if (value > 3500) return '#BD0026'
  if (value > 2500) return '#E31A1C'
  if (value > 1500) return '#FC4E2A'
  if (value > 800) return '#FD8D3C'
  if (value > 400) return '#FEB24C'
  if (value > 200) return '#FED976'
  return '#FFEDA0'
}

function getNeighborhoodColor(areaPlane: number): string {
  switch (areaPlane) {
    case 1:
      return '#08306b'
    case 2:
      return '#08519c'
    case 3:
      return '#2171b5'
    case 4:
      return '#4292c6'
    case 5:
      return '#6baed6'
    default:
      return '#9ecae1'
  }
}

function buildMunicipalityProfileUrl(name: string): string {
  const slug = slugify(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `https://www.ibge.gov.br/cidades-e-estados/rj/${slug}.html`
}

function buildNeighborhoodLink(props: NeighborhoodProperties): string {
  if (props.portalLink) {
    return props.portalLink
  }
  return `https://www.data.rio/?search=${encodeURIComponent(props.name)}`
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
