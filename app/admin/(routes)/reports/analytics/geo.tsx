import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {Button, Card, Chip} from '@heroui/react'
import {useQuery} from 'convex/react'
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapboxMap,
} from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {useEffect, useMemo, useRef, useState} from 'react'

interface MapboxUsChoroplethProps {
  defaultState: StateVisit | null
  stateVisits: Record<string, number>
}

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

type GeoSource = 'logs' | 'tracked'

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
    <div className='relative overflow-hidden rounded-3xl md:rounded-e-none border border-sidebar'>
      <div className='absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-4'>
        <div className='max-w-sm rounded-2xl border border-white/10 px-4 py-3'>
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

      <div className='overflow-hidden absolute inset-x-0 bottom-0 z-10 flex justify-end flex-wrap gap-2 border-t border-white/10 bg-black p-4 text-[11px] text-white/80'>
        {GEO_LEGEND.map((legendItem) => (
          <div
            key={legendItem.label}
            className='flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1'>
            <span
              className='size-2.5 rounded-full'
              style={{backgroundColor: legendItem.color}}
            />
            <span className='font-okxs'>{legendItem.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const GeoPage = () => {
  const logStats = useQuery(api.logs.q.getVisitStats, {})
  const trackedStats = useQuery(api.guestTracking.q.getVisitorGeoStats, {})
  const [selectedSource, setSelectedSource] = useState<GeoSource | null>(null)

  const activeSource: GeoSource = useMemo(() => {
    if (selectedSource) {
      return selectedSource
    }

    if ((trackedStats?.totalUnitedStatesVisits ?? 0) > 0) {
      return 'tracked'
    }

    return 'logs'
  }, [selectedSource, trackedStats])

  const activeStats = activeSource === 'tracked' ? trackedStats : logStats
  const stateVisits = useMemo(
    () => activeStats?.visitsByUsState ?? {},
    [activeStats],
  )
  const sourceLabel =
    activeSource === 'tracked' ? 'Tracked Page Views' : 'Server Visit Logs'

  const rankedStates = useMemo<StateVisit[]>(() => {
    return Object.entries(stateVisits)
      .map(([name, value]) => ({name, value}))
      .sort((left, right) => right.value - left.value)
  }, [stateVisits])

  const totalUnitedStatesVisits = activeStats?.totalUnitedStatesVisits ?? 0
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

  if (!logStats || !trackedStats) {
    return (
      <Card className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-foreground/50'>Loading geo analytics...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className='h-svh space-y-6 overflow-auto pb-32'>
      <Card className='overflow-hidden p-3 md:py-4 md:px-0 rounded-none'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <div>
              <h2 className='text-lg font-polysans md:text-2xl'>
                Visitor World Map
              </h2>
              <p className='mt-2 text-sm text-foreground/70'>
                Switch between server visit logs and tracked visitor page-view
                events to inspect how U.S. traffic distributes by state.
              </p>
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
              {(
                [
                  ['logs', 'Log Visits', logStats.totalUnitedStatesVisits],
                  [
                    'tracked',
                    'Tracked Visits',
                    trackedStats.totalUnitedStatesVisits,
                  ],
                ] as const
              ).map(([source, label, total]) => (
                <Button
                  key={source}
                  size='sm'
                  variant={activeSource === source ? 'primary' : 'ghost'}
                  onPress={() => setSelectedSource(source)}
                  className={cn(
                    'rounded-full border px-3 text-xs font-medium text-foreground',
                    activeSource === source
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/10',
                  )}>
                  {label}
                  <span className='ml-2 font-okxs text-[11px]'>
                    {total.toLocaleString()}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className='grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4'>
            <div className=''>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                Visits
              </p>
              <p className='mt-2 text-lg font-okxs font-semibold text-foreground'>
                {totalUnitedStatesVisits.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-foreground/55'>{sourceLabel}</p>
            </div>

            <div className=''>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                With Data
              </p>
              <p className='mt-2 text-lg font-okxs font-semibold text-foreground'>
                {statesWithData.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-foreground/55'>
                Mapped to a state
              </p>
            </div>

            <div className=''>
              <p className='text-[8px] uppercase tracking-[0.28em] text-/45'>
                Coverage
              </p>
              <p className='mt-2 text-lg font-okxs font-semibold text-'>
                {coverage}%
              </p>
              <p className='mt-1 text-xs text-/55'>
                {mappedUnitedStatesVisits.toLocaleString()} mapped visits
              </p>
            </div>

            <div className=''>
              <p className='text-[8px] uppercase tracking-[0.28em] text-/45'>
                Top State
              </p>
              <p className='mt-2 text-lg font-clash font-medium text-'>
                {topState?.name ?? 'No State data'}
              </p>
              <p className='mt-1 text-xs text-/55'>
                {topState
                  ? `${topState.value.toLocaleString()} visits`
                  : '0 visits'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_22rem] overflow-hidden'>
        <div className='size-full rounded-s-3xl overflow-hidden'>
          <MapboxUsChoropleth
            defaultState={topState}
            stateVisits={stateVisits}
          />
        </div>

        <Card className='p-5 dark:bg-dark-table/40 rounded-s-none'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/70'>
                Ranked States
              </p>
              <h3 className='mt-2 text-xl font-clash font-medium'>
                Where visits are landing
              </h3>
            </div>
            <Chip size='sm' variant='tertiary' color='success'>
              {statesWithData} states ·{' '}
              {activeSource === 'tracked' ? 'Tracked' : 'Logs'}
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
                    className='rounded-2xl p-4 bg-foreground/6'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      <div className='min-w-0'>
                        <p className='font-okxs text-xs uppercase tracking-[0.28em] text-default-400'>
                          #{index + 1}
                        </p>
                        <p className='mt-1 text-lg font-clash font-medium'>
                          {state.name}
                        </p>
                      </div>
                      <span className='font-okxs text-sm text-mac-blue'>
                        {state.value.toLocaleString()}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-default-400'>
                      {percentage}% of mapped U.S. visits
                    </p>
                  </div>
                )
              })
            ) : (
              <div className='rounded-2xl border border-dashed border-foreground/10 p-4 text-sm text-default-400 text-balance'>
                No state-level visit data is available yet. The map will
                populate as soon as the selected source includes a U.S. state or
                a city that can be resolved to one.
              </div>
            )}
          </div>

          <div className='mt-6 rounded-2xl bg-foreground/6 p-4'>
            <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/70'>
              Coverage Note
            </p>
            <p className='mt-3 text-sm text-default-400 text-balance'>
              {totalUnitedStatesVisits === 0
                ? `No United States visits have been recorded yet for ${sourceLabel.toLowerCase()}.`
                : mappedUnitedStatesVisits < totalUnitedStatesVisits
                  ? `Some ${sourceLabel.toLowerCase()} entries only contain country-level geo data, so the map reflects the visits that can be resolved to a state from either region or city text.`
                  : `All ${sourceLabel.toLowerCase()} visits in the current dataset map cleanly to a state.`}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
