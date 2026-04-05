'use client'

import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {Card, Chip} from '@heroui/react'
import {useQuery} from 'convex/react'
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapboxMap,
} from 'mapbox-gl'
import {useEffect, useMemo, useRef, useState} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Color palette for charts
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null
const US_STATES_GEOJSON_URL =
  'https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson'
const GEO_FILL_COLOR = [
  'step',
  ['coalesce', ['get', 'visitCount'], 0],
  '#101827',
  1,
  '#1d4ed8',
  5,
  '#2563eb',
  10,
  '#0ea5e9',
  25,
  '#14b8a6',
  50,
  '#84cc16',
] as ExpressionSpecification
const GEO_FILL_OPACITY = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  0.95,
  ['>', ['coalesce', ['get', 'visitCount'], 0], 0],
  0.82,
  0.36,
] as ExpressionSpecification
const GEO_LINE_COLOR = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  '#f8fafc',
  '#64748b',
] as ExpressionSpecification
const GEO_LINE_WIDTH = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  2.2,
  0.9,
] as ExpressionSpecification
const GEO_LEGEND = [
  {label: '0', color: '#101827'},
  {label: '1-4', color: '#1d4ed8'},
  {label: '5-9', color: '#2563eb'},
  {label: '10-24', color: '#0ea5e9'},
  {label: '25-49', color: '#14b8a6'},
  {label: '50+', color: '#84cc16'},
] as const

type StateVisit = {
  name: string
  value: number
}

type StatesGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  {
    STATE_ID: string
    STATE_NAME: string
    visitCount?: number
  }
>

const decorateStatesGeoJson = (
  geoJson: StatesGeoJson,
  stateVisits: Record<string, number>,
): StatesGeoJson => ({
  ...geoJson,
  features: geoJson.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      visitCount: stateVisits[feature.properties.STATE_NAME] ?? 0,
    },
  })),
})

export const InsightsPage = () => {
  const isMobile = useMobile()
  const stats = useQuery(api.logs.q.getVisitStats, {})
  const logs = useQuery(api.logs.q.getLogs, {
    limit: 1000,
    type: 'page_visit',
  })
  const [now] = useState(() => Date.now())

  // Calculate time-based metrics (last 7 days, 30 days)
  const timeBasedStats = useMemo(() => {
    if (!logs?.logs) return null

    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const last7Days = logs.logs.filter((log) => log.createdAt >= sevenDaysAgo)
    const last30Days = logs.logs.filter((log) => log.createdAt >= thirtyDaysAgo)

    // Hourly distribution for last 24 hours
    const last24Hours = logs.logs.filter(
      (log) => log.createdAt >= now - 24 * 60 * 60 * 1000,
    )
    const hourlyData = Array.from({length: 24}, (_, i) => {
      const hourStart = now - (24 - i) * 60 * 60 * 1000
      const hourEnd = hourStart + 60 * 60 * 1000
      const count = last24Hours.filter(
        (log) => log.createdAt >= hourStart && log.createdAt < hourEnd,
      ).length
      return {
        hour: new Date(hourStart).getHours(),
        visits: count,
        label: `${new Date(hourStart).getHours()}:00`,
      }
    })

    // Daily distribution for last 7 days
    const dailyData = Array.from({length: 7}, (_, i) => {
      const dayStart = now - (7 - i) * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const dayLogs = logs.logs.filter(
        (log) => log.createdAt >= dayStart && log.createdAt < dayEnd,
      )
      return {
        date: new Date(dayStart).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        visits: dayLogs.length,
        uniqueVisitors: new Set(dayLogs.map((log) => log.ipAddress)).size,
      }
    })

    return {
      last7Days: last7Days.length,
      last30Days: last30Days.length,
      hourlyData,
      dailyData,
    }
  }, [logs, now])

  // Top pages data
  const topPages = useMemo(() => {
    if (!stats?.visitsByPath) return []
    return Object.entries(stats.visitsByPath)
      .map(([path, count]) => ({path, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [stats])

  // Device distribution
  const deviceData = useMemo(() => {
    if (!stats?.visitsByDevice) return []
    return Object.entries(stats.visitsByDevice).map(([device, count]) => ({
      name: device.charAt(0).toUpperCase() + device.slice(1),
      value: count,
    }))
  }, [stats])

  // Country distribution
  const countryData = useMemo(() => {
    if (!stats?.visitsByCountry) return []
    return Object.entries(stats.visitsByCountry)
      .map(([country, count]) => ({name: country, value: count}))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [stats])

  // Browser distribution
  const browserData = useMemo(() => {
    if (!logs?.logs) return []
    const browserCounts: Record<string, number> = {}
    logs.logs.forEach((log) => {
      if (log.browser) {
        browserCounts[log.browser] = (browserCounts[log.browser] || 0) + 1
      }
    })
    return Object.entries(browserCounts)
      .map(([browser, count]) => ({name: browser, value: count}))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [logs])

  // Average response time
  const avgResponseTime = useMemo(() => {
    if (!logs?.logs || logs.logs.length === 0) return 0
    const logsWithResponseTime = logs.logs.filter(
      (log) => log.responseTime !== undefined,
    )
    if (logsWithResponseTime.length === 0) return 0
    const sum = logsWithResponseTime.reduce(
      (acc, log) => acc + (log.responseTime || 0),
      0,
    )
    return Math.round(sum / logsWithResponseTime.length)
  }, [logs])

  if (!stats || !logs) {
    return (
      <Card className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading insights...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className='space-y-6 p-4 h-screen overflow-auto pb-32'>
      {/* Key Metrics Cards */}
      <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4 dark:bg-dark-table/40'>
          <div className='flex flex-col'>
            <p className='text-sm text-default-500 mb-1'>Total Visits</p>
            <p className='text-2xl font-bold font-space'>
              {stats.totalVisits.toLocaleString()}
            </p>
            {timeBasedStats && (
              <p className='text-xs text-default-400 mt-1'>
                {timeBasedStats.last7Days} in last 7 days
              </p>
            )}
          </div>
        </Card>

        <Card className='p-4 dark:bg-dark-table/40'>
          <div className='flex flex-col'>
            <p className='text-sm text-default-500 mb-1'>Unique Visitors</p>
            <p className='text-2xl font-bold font-space'>
              {stats.uniqueVisitors.toLocaleString()}
            </p>
            <p className='text-xs text-default-400 mt-1'>
              {stats.uniqueUsers} authenticated users
            </p>
          </div>
        </Card>

        <Card className='p-4 dark:bg-dark-table/40'>
          <div className='flex flex-col'>
            <p className='text-sm text-default-500 mb-1'>Avg Response Time</p>
            <p className='text-2xl font-bold font-space'>{avgResponseTime}ms</p>
            <p className='text-xs text-default-400 mt-1'>
              Page load performance
            </p>
          </div>
        </Card>

        <Card className='p-4 dark:bg-dark-table/40'>
          <div className='flex flex-col'>
            <p className='text-sm text-default-500 mb-1'>Bounce Rate</p>
            <p className='text-2xl font-bold font-space'>
              {stats.totalVisits > 0
                ? Math.round(
                    ((stats.totalVisits - stats.uniqueVisitors) /
                      stats.totalVisits) *
                      100,
                  )
                : 0}
              %
            </p>
            <p className='text-xs text-default-400 mt-1'>Single-page visits</p>
          </div>
        </Card>
      </div>

      {/* Charts Row 1: Time-based analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Daily Visits Chart */}
        {timeBasedStats && (
          <Card className='p-4 dark:bg-dark-table/40'>
            <h3 className='text-lg font-semibold font-space mb-4'>
              Daily Visits (Last 7 Days)
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={timeBasedStats.dailyData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='visits' fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Hourly Distribution */}
        {timeBasedStats && (
          <Card className='p-4 dark:bg-dark-table/40'>
            <h3 className='text-lg font-semibold font-space mb-4'>
              Hourly Distribution (Last 24 Hours)
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={timeBasedStats.hourlyData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='hour' />
                <YAxis />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='visits'
                  stroke={COLORS[1]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Charts Row 2: Distribution charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Device Distribution */}
        <Card className='p-4 dark:bg-dark-table/40'>
          <h3 className='text-lg font-semibold font-space mb-4'>
            Device Distribution
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({name, percent}) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={isMobile ? 50 : 80}
                fill='#8884d8'
                dataKey='value'>
                {deviceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Browser Distribution */}
        <Card className='p-4 dark:bg-dark-table/40'>
          <h3 className='text-lg font-semibold font-space mb-4'>
            Browser Distribution
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={browserData} layout='vertical'>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis type='number' />
              <YAxis dataKey='name' type='category' width={80} />
              <Tooltip />
              <Bar dataKey='value' fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Pages and Countries */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Top Pages */}
        <Card className='p-4 dark:bg-dark-table/40'>
          <h3 className='text-lg font-semibold font-space mb-4'>Top Pages</h3>
          <div className='space-y-2'>
            {topPages.length > 0 ? (
              topPages.map((page, index) => (
                <div
                  key={page.path}
                  className='flex items-center justify-between p-2 rounded-lg hover:bg-default-100 dark:hover:bg-default-50'>
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <span className='text-sm font-medium text-default-400 w-6'>
                      {index + 1}
                    </span>
                    <p className='text-sm text-foreground truncate'>
                      {page.path}
                    </p>
                  </div>
                  <Chip size='sm' variant='tertiary' color='accent'>
                    {page.count}
                  </Chip>
                </div>
              ))
            ) : (
              <p className='text-sm text-default-400'>No data available</p>
            )}
          </div>
        </Card>

        {/* Top Countries */}
        <Card className='p-4 dark:bg-dark-table/40'>
          <h3 className='text-lg font-semibold font-space mb-4'>
            Top Countries
          </h3>
          <div className='space-y-2'>
            {countryData.length > 0 ? (
              countryData.map((country, index) => (
                <div
                  key={country.name}
                  className='flex items-center justify-between p-2 rounded-lg hover:bg-default-100 dark:hover:bg-default-50'>
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <span className='text-sm font-medium text-default-400 w-6'>
                      {index + 1}
                    </span>
                    <p className='text-sm text-foreground'>{country.name}</p>
                  </div>
                  <Chip size='sm' variant='tertiary' color='default'>
                    {country.value}
                  </Chip>
                </div>
              ))
            ) : (
              <p className='text-sm text-default-400'>No data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface MapboxUsChoroplethProps {
  defaultState: StateVisit | null
  stateVisits: Record<string, number>
}

const MapboxUsChoropleth = ({
  defaultState,
  stateVisits,
}: MapboxUsChoroplethProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const baseGeoJsonRef = useRef<StatesGeoJson | null>(null)
  const hoveredStateIdRef = useRef<string | number | null>(null)
  const stateVisitsRef = useRef(stateVisits)
  const [hoveredState, setHoveredState] = useState<StateVisit | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    stateVisitsRef.current = stateVisits
  }, [stateVisits])

  useEffect(() => {
    let isCancelled = false

    const initializeMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return
      }

      try {
        if (!MAPBOX_TOKEN) {
          throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not configured.')
        }

        const [{default: mapboxgl}, response] = await Promise.all([
          import('mapbox-gl'),
          fetch(US_STATES_GEOJSON_URL, {cache: 'force-cache'}),
        ])

        if (!response.ok) {
          throw new Error('Unable to load United States map geometry.')
        }

        const geoJson = (await response.json()) as StatesGeoJson
        if (isCancelled || !mapContainerRef.current) {
          return
        }

        baseGeoJsonRef.current = geoJson
        mapboxgl.accessToken = MAPBOX_TOKEN

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-98.5795, 39.8283],
          zoom: 2.7,
          minZoom: 2.5,
          maxZoom: 6,
          cooperativeGestures: true,
          attributionControl: false,
        })

        mapRef.current = map
        map.addControl(
          new mapboxgl.NavigationControl({showCompass: false}),
          'top-right',
        )

        map.on('load', () => {
          if (isCancelled || !baseGeoJsonRef.current) {
            return
          }

          map.addSource('us-states', {
            type: 'geojson',
            data: decorateStatesGeoJson(
              baseGeoJsonRef.current,
              stateVisitsRef.current,
            ),
          })

          map.addLayer({
            id: 'us-states-fill',
            type: 'fill',
            source: 'us-states',
            paint: {
              'fill-color': GEO_FILL_COLOR,
              'fill-opacity': GEO_FILL_OPACITY,
            },
          })

          map.addLayer({
            id: 'us-states-outline',
            type: 'line',
            source: 'us-states',
            paint: {
              'line-color': GEO_LINE_COLOR,
              'line-opacity': 0.85,
              'line-width': GEO_LINE_WIDTH,
            },
          })

          map.on('mousemove', 'us-states-fill', (event) => {
            const feature = event.features?.[0]
            if (!feature || feature.id === undefined) {
              return
            }

            if (
              hoveredStateIdRef.current !== null &&
              hoveredStateIdRef.current !== feature.id
            ) {
              map.setFeatureState(
                {source: 'us-states', id: hoveredStateIdRef.current},
                {hover: false},
              )
            }

            hoveredStateIdRef.current = feature.id
            map.setFeatureState(
              {source: 'us-states', id: hoveredStateIdRef.current},
              {hover: true},
            )

            const stateName =
              typeof feature.properties?.STATE_NAME === 'string'
                ? feature.properties.STATE_NAME
                : 'Unknown'
            const visitCount =
              typeof feature.properties?.visitCount === 'number'
                ? feature.properties.visitCount
                : Number(feature.properties?.visitCount ?? 0)

            setHoveredState({
              name: stateName,
              value: Number.isNaN(visitCount) ? 0 : visitCount,
            })
          })

          map.on('mouseleave', 'us-states-fill', () => {
            if (hoveredStateIdRef.current !== null) {
              map.setFeatureState(
                {source: 'us-states', id: hoveredStateIdRef.current},
                {hover: false},
              )
              hoveredStateIdRef.current = null
            }

            setHoveredState(null)
          })

          setIsMapReady(true)
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setMapError(
          error instanceof Error ? error.message : 'Unable to initialize map.',
        )
      }
    }

    void initializeMap()

    return () => {
      isCancelled = true

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !baseGeoJsonRef.current) {
      return
    }

    const source = mapRef.current.getSource('us-states') as
      | GeoJSONSource
      | undefined

    source?.setData(decorateStatesGeoJson(baseGeoJsonRef.current, stateVisits))
  }, [stateVisits])

  const displayState = hoveredState ?? defaultState

  return (
    <div className='relative overflow-hidden rounded-3xl border border-white/10'>
      <div className='absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-4'>
        <div className='max-w-sm rounded-2xl border border-white/10 bg-black/0 px-4 py-3 backdrop-blur-md'>
          <p className='text-[10px] uppercase tracking-[0.32em] text-white/45'>
            {hoveredState ? 'Hovered State' : 'Top State'}
          </p>
          <p className='mt-2 text-xl font-space font-semibold text-white'>
            {displayState?.name ?? 'United States'}
          </p>
          <p className='text-sm text-white/70'>
            {displayState
              ? `${displayState.value.toLocaleString()} visits`
              : 'Move across the map to inspect state traffic.'}
          </p>
        </div>
        <div className='rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/55 backdrop-blur-md'>
          Mapbox GL JS
        </div>
      </div>

      <div ref={mapContainerRef} className='h-[420.01px] md:h-[580.01px]' />

      {!isMapReady && !mapError ? (
        <div className='absolute inset-0 flex items-center justify-center bg-[#050811]/75 backdrop-blur-sm'>
          <div className='text-center'>
            <p className='font-space text-lg text-white'>Loading map</p>
            <p className='mt-2 text-sm text-white/65'>
              Preparing the U.S. visitor layer.
            </p>
          </div>
        </div>
      ) : null}

      {mapError ? (
        <div className='absolute inset-0 flex items-center justify-center bg-[#050811]/85 p-6 text-center backdrop-blur-sm'>
          <div>
            <p className='font-space text-lg text-white'>Map unavailable</p>
            <p className='mt-2 text-sm text-white/65'>{mapError}</p>
          </div>
        </div>
      ) : null}

      <div className='absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 border-t border-white/10 bg-black/55 p-4 text-[11px] text-white/70 backdrop-blur-md'>
        {GEO_LEGEND.map((legendItem) => (
          <div
            key={legendItem.label}
            className='flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1'>
            <span
              className='size-2.5 rounded-full'
              style={{backgroundColor: legendItem.color}}
            />
            <span>{legendItem.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const GeoPage = () => {
  const stats = useQuery(api.logs.q.getVisitStats, {})

  const rankedStates = useMemo<StateVisit[]>(() => {
    if (!stats?.visitsByUsState) {
      return []
    }

    return Object.entries(stats.visitsByUsState)
      .map(([name, value]) => ({name, value}))
      .sort((left, right) => right.value - left.value)
  }, [stats])

  const totalUnitedStatesVisits = stats?.totalUnitedStatesVisits ?? 0
  const statesWithData = rankedStates.length
  const mappedUnitedStatesVisits = useMemo(
    () => rankedStates.reduce((total, state) => total + state.value, 0),
    [rankedStates],
  )
  const coverage =
    totalUnitedStatesVisits > 0
      ? Math.round((mappedUnitedStatesVisits / totalUnitedStatesVisits) * 100)
      : 0
  const topState = rankedStates[0] ?? null

  if (!stats) {
    return (
      <Card className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading geo analytics...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className='space-y-6 h-screen overflow-auto pb-32'>
      <Card
                className='overflow-hidden border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(5,8,17,1))] p-4 dark:bg-dark-table/60'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <Chip size='sm' variant='tertiary' color='accent'>
              Geo
            </Chip>
            <div>
              <h2 className='text-3xl font-space font-semibold text-white'>
                World Visitor Map
              </h2>
              <p className='mt-2 text-sm text-white/70'>
                Mapbox choropleth of U.S. traffic from visitor logs, recorded
                state data and city-based fallbacks when region data is missing.
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
              <p className='text-xs uppercase tracking-[0.28em] text-white/45'>
                Visits
              </p>
              <p className='mt-3 text-2xl font-space font-semibold text-white'>
                {totalUnitedStatesVisits.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-white/55'>
                Current analytics set
              </p>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
              <p className='text-xs uppercase tracking-[0.28em] text-white/45'>
                With Data
              </p>
              <p className='mt-3 text-2xl font-space font-semibold text-white'>
                {statesWithData.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-white/55'>Mapped to a state</p>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
              <p className='text-xs uppercase tracking-[0.28em] text-white/45'>
                Coverage
              </p>
              <p className='mt-3 text-2xl font-okxs font-semibold text-white'>
                {coverage}%
              </p>
              <p className='mt-1 text-xs text-white/55'>
                {mappedUnitedStatesVisits.toLocaleString()} mapped visits
              </p>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
              <p className='text-xs uppercase tracking-[0.28em] text-white/45'>
                Top State
              </p>
              <p className='mt-3 text-lg font-clash font-semibold text-white'>
                {topState?.name ?? 'Waiting for data'}
              </p>
              <p className='mt-1 text-xs text-white/55'>
                {topState
                  ? `${topState.value.toLocaleString()} visits`
                  : '0 visits'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_22rem] rounded-b-3xl overflow-hidden'>
        <Card
          
          
          className='dark:bg-dark-table/40 overflow-hidden bg-white'>
          <MapboxUsChoropleth
            defaultState={topState}
            stateVisits={stats.visitsByUsState ?? {}}
          />
        </Card>

        <Card className='p-5 dark:bg-dark-table/40'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-xs uppercase tracking-[0.28em] text-default-400'>
                Ranked States
              </p>
              <h3 className='mt-2 text-xl font-space font-semibold'>
                Where visits are landing
              </h3>
            </div>
            <Chip size='sm' variant='tertiary' color='success'>
              {statesWithData} states
            </Chip>
          </div>

          <div className='mt-6 space-y-3'>
            {rankedStates.length > 0 ? (
              rankedStates.slice(0, 8).map((state, index) => {
                const percentage =
                  mappedUnitedStatesVisits > 0
                    ? Math.round((state.value / mappedUnitedStatesVisits) * 100)
                    : 0

                return (
                  <div
                    key={state.name}
                    className='rounded-2xl border border-white/6 bg-default-100/40 p-4 dark:bg-dark-gray/20'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-xs uppercase tracking-[0.28em] text-default-400'>
                          #{index + 1}
                        </p>
                        <p className='mt-2 text-lg font-space font-semibold'>
                          {state.name}
                        </p>
                      </div>
                      <Chip size='sm' variant='tertiary' color='accent'>
                        {state.value.toLocaleString()}
                      </Chip>
                    </div>
                    <p className='mt-3 text-sm text-default-400'>
                      {percentage}% of mapped U.S. visits
                    </p>
                  </div>
                )
              })
            ) : (
              <div className='rounded-2xl border border-dashed border-white/10 p-4 text-sm text-default-400'>
                No state-level visit data is available yet. The map will
                populate as soon as U.S. logs include a state or a city that can
                be resolved to one.
              </div>
            )}
          </div>

          <div className='mt-6 rounded-2xl border border-white/6 bg-default-100/40 p-4 dark:bg-dark-gray/20'>
            <p className='text-xs uppercase tracking-[0.28em] text-default-400'>
              Coverage Note
            </p>
            <p className='mt-3 text-sm text-default-400'>
              {totalUnitedStatesVisits === 0
                ? 'No United States visits have been recorded yet.'
                : mappedUnitedStatesVisits < totalUnitedStatesVisits
                  ? 'Some U.S. visits only contain country-level geo data, so the map reflects the visits that can be resolved to a state from either region or city text.'
                  : 'All logged U.S. visits in the current dataset map cleanly to a state.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
