'use client'

import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {cn} from '@/lib/utils'
import {Card, Chip} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
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

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

const CHART_GRID_STROKE = 'rgba(148, 163, 184, 0.14)'
const CHART_TICK_COLOR = '#94a3b8'
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(2, 6, 23, 0.94)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: '18px',
  color: '#e2e8f0',
  boxShadow: '0 24px 64px rgba(2, 6, 23, 0.35)',
}
const PANEL_CLASSNAME =
  'relative overflow-hidden rounded-lg border border-sidebar/70 bg-default-50/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:bg-dark-table/45 dark:shadow-[0_18px_40px_rgba(2,6,23,0.28)] md:p-5'

type CountryDatum = {
  code: string
  flag: string
  name: string
  share: number
  value: number
}

type MetricCardProps = {
  accentClassName: string
  detail: string
  eyebrow: string
  value: string
}

const REGION_DISPLAY_NAMES =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], {type: 'region'})
    : null

const isCountryCode = (value: string) => /^[A-Z]{2}$/.test(value)

const normalizeCountryCode = (value: string) => value.trim().toUpperCase()

const isValidCountryValue = (value: string) => {
  const normalized = value.trim()
  return (
    normalized.length > 0 && normalized !== 'null' && normalized !== 'null null'
  )
}

const getCountryFlag = (country: string) => {
  const code = normalizeCountryCode(country)
  if (!isCountryCode(code)) {
    return '🌐'
  }

  return String.fromCodePoint(
    ...Array.from(code).map((char) => 127397 + char.charCodeAt(0)),
  )
}

const getCountryName = (country: string) => {
  const code = normalizeCountryCode(country)
  if (!isCountryCode(code)) {
    return country.trim()
  }

  return REGION_DISPLAY_NAMES?.of(code) ?? code
}

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value)

function MetricCard({
  accentClassName,
  detail,
  eyebrow,
  value,
}: MetricCardProps) {
  return (
    <Card className={PANEL_CLASSNAME}>
      <div
        className={cn(
          'absolute inset-x-4 top-0 h-px rounded-lg bg-linear-to-r opacity-80',
          accentClassName,
        )}
      />
      <div className='relative flex flex-col gap-2'>
        <p className='text-[10px] uppercase tracking-[0.28em] text-foreground/55'>
          {eyebrow}
        </p>
        <p className='text-2xl font-space font-semibold text-foreground md:text-3xl'>
          {value}
        </p>
        <p className='text-sm text-foreground/60'>{detail}</p>
      </div>
    </Card>
  )
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  subtitle: string
  title: string
}) {
  return (
    <div className='mb-4 flex flex-col gap-1'>
      <p className='text-[10px] uppercase tracking-[0.3em] text-foreground/55'>
        {eyebrow}
      </p>
      <h3 className='text-lg font-space font-semibold text-foreground md:text-xl'>
        {title}
      </h3>
      <p className='text-sm text-foreground/55'>{subtitle}</p>
    </div>
  )
}

export const InsightsPage = () => {
  const isMobile = useMobile()
  const stats = useQuery(api.logs.q.getVisitStats, {})
  const logs = useQuery(api.logs.q.getLogs, {
    limit: 1000,
    type: 'page_visit',
  })
  const [now] = useState(() => Date.now())

  const timeBasedStats = useMemo(() => {
    if (!logs?.logs) return null

    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const last7Days = logs.logs.filter((log) => log.createdAt >= sevenDaysAgo)
    const last30Days = logs.logs.filter((log) => log.createdAt >= thirtyDaysAgo)

    const last24Hours = logs.logs.filter(
      (log) => log.createdAt >= now - 24 * 60 * 60 * 1000,
    )
    const hourlyData = Array.from({length: 24}, (_, index) => {
      const hourStart = now - (24 - index) * 60 * 60 * 1000
      const hourEnd = hourStart + 60 * 60 * 1000
      const count = last24Hours.filter(
        (log) => log.createdAt >= hourStart && log.createdAt < hourEnd,
      ).length

      return {
        hour: new Date(hourStart).getHours(),
        label: `${new Date(hourStart).getHours()}:00`,
        visits: count,
      }
    })

    const dailyData = Array.from({length: 7}, (_, index) => {
      const dayStart = now - (7 - index) * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const dayLogs = logs.logs.filter(
        (log) => log.createdAt >= dayStart && log.createdAt < dayEnd,
      )

      return {
        date: new Date(dayStart).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        }),
        uniqueVisitors: new Set(dayLogs.map((log) => log.ipAddress)).size,
        visits: dayLogs.length,
      }
    })

    return {
      dailyData,
      hourlyData,
      last30Days: last30Days.length,
      last7Days: last7Days.length,
    }
  }, [logs, now])

  const topPages = useMemo(() => {
    if (!stats?.visitsByPath) return []

    return Object.entries(stats.visitsByPath)
      .map(([path, count]) => ({
        count,
        path,
        share:
          stats.totalVisits > 0
            ? Math.round((count / stats.totalVisits) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [stats])

  const deviceData = useMemo(() => {
    if (!stats?.visitsByDevice) return []

    const totalDeviceVisits = Object.values(stats.visitsByDevice).reduce(
      (sum, value) => sum + value,
      0,
    )

    return Object.entries(stats.visitsByDevice).map(([device, count]) => ({
      name: device.charAt(0).toUpperCase() + device.slice(1),
      share:
        totalDeviceVisits > 0
          ? Math.round((count / totalDeviceVisits) * 100)
          : 0,
      value: count,
    }))
  }, [stats])

  const countryData = useMemo<CountryDatum[]>(() => {
    if (!stats?.visitsByCountry) return []

    const normalizedCountries = Object.entries(stats.visitsByCountry).filter(
      ([country]) => isValidCountryValue(country),
    )
    const totalCountryVisits = normalizedCountries.reduce(
      (sum, [, count]) => sum + count,
      0,
    )

    return normalizedCountries
      .map(([country, count]) => ({
        code: normalizeCountryCode(country),
        flag: getCountryFlag(country),
        name: getCountryName(country),
        share:
          totalCountryVisits > 0
            ? Math.round((count / totalCountryVisits) * 100)
            : 0,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [stats])

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

  const avgResponseTime = useMemo(() => {
    if (!logs?.logs || logs.logs.length === 0) return 0

    const logsWithResponseTime = logs.logs.filter(
      (log) => log.responseTime !== undefined,
    )
    if (logsWithResponseTime.length === 0) return 0

    const totalResponseTime = logsWithResponseTime.reduce(
      (sum, log) => sum + (log.responseTime || 0),
      0,
    )

    return Math.round(totalResponseTime / logsWithResponseTime.length)
  }, [logs])

  const repeatTraffic = useMemo(() => {
    if (!stats || stats.totalVisits <= 0) return 0

    return Math.max(
      0,
      Math.round(
        ((stats.totalVisits - stats.uniqueVisitors) / stats.totalVisits) * 100,
      ),
    )
  }, [stats])

  const peakHour = useMemo(() => {
    if (!timeBasedStats || timeBasedStats.hourlyData.length === 0) {
      return null
    }

    return timeBasedStats.hourlyData.reduce((peak, current) =>
      current.visits > peak.visits ? current : peak,
    )
  }, [timeBasedStats])

  const topCountry = countryData[0] ?? null
  const topPage = topPages[0] ?? null

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
    <div className='h-svh space-y-5 overflow-auto p-2 pb-32 md:space-y-6 md:p-4'>
      <Card className='relative overflow-hidden px-5 py-5 md:px-6 md:py-6 shadow-none'>
        <div className='pointer-events-none absolute inset-0' />
        <div className='relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between'>
          <div className='max-w-3xl'>
            <p className='text-[8px] uppercase tracking-[0.34em]'>
              Traffic Insights
            </p>
            <h2 className='mt-3 text-xl font-polysans font-semibold tracking-tight md:text-3xl'>
              Visitor Analytics
            </h2>
            <p className='mt-3 max-w-2xl text-sm leading-6 md:text-base'>
              Refined analytics for traffic volume, device mix, top content, and
              country distribution across the current page-visit dataset.
            </p>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Chip
                size='sm'
                variant='tertiary'
                className='border border-foreground/10 bg-foreground/4'>
                {timeBasedStats?.last30Days.toLocaleString() ?? '0'} visits in
                30 days
              </Chip>
              {topCountry ? (
                <Chip
                  size='sm'
                  variant='tertiary'
                  className='border border-foreground/10 bg-foreground/4'>
                  {topCountry.flag} {topCountry.name}
                </Chip>
              ) : null}
              {peakHour ? (
                <Chip
                  size='sm'
                  variant='tertiary'
                  className='border border-foreground/10 bg-foreground/4 text-foreground'>
                  Peak hour {peakHour.label}
                </Chip>
              ) : null}
              {topPage ? (
                <Chip
                  size='sm'
                  variant='tertiary'
                  className='border border-foreground/10 bg-foreground/4 text-foreground'>
                  Top page {topPage.path}
                </Chip>
              ) : null}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-136'>
            <div className='rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md'>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                Today Flow
              </p>
              <p className='mt-2 text-2xl font-space font-semibold text-foreground'>
                {formatCompactNumber(timeBasedStats?.last7Days ?? 0)}
              </p>
              <p className='mt-1 text-xs text-foreground/55'>
                Visits in the last 7 days
              </p>
            </div>
            <div className='rounded-2xl border border-foreground/10 bg-foreground/6 p-4 backdrop-blur-md'>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                Response
              </p>
              <p className='mt-2 text-lg font-okxs font-semibold text-foreground'>
                {avgResponseTime}ms
              </p>
              <p className='mt-1 text-xs text-foreground/55'>
                Average measured latency
              </p>
            </div>
            <div className='rounded-lg border border-foreground/10 bg-foreground/6 p-4 backdrop-blur-md'>
              <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                Return Mix
              </p>
              <p className='mt-2 text-lg font-okxs font-semibold text-foreground'>
                {repeatTraffic}%
              </p>
              <p className='mt-1 text-xs text-foreground/55'>
                Repeat traffic share
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4'>
        <MetricCard
          accentClassName='from-sky-400 via-blue-500 to-transparent'
          eyebrow='Total Visits'
          value={stats.totalVisits.toLocaleString()}
          detail={`${timeBasedStats?.last7Days.toLocaleString() ?? '0'} in the last 7 days`}
        />
        <MetricCard
          accentClassName='from-emerald-400 via-teal-500 to-transparent'
          eyebrow='Unique Visitors'
          value={stats.uniqueVisitors.toLocaleString()}
          detail={`${stats.uniqueUsers.toLocaleString()} authenticated users`}
        />
        <MetricCard
          accentClassName='from-amber-300 via-orange-500 to-transparent'
          eyebrow='Avg Response Time'
          value={`${avgResponseTime}ms`}
          detail='Measured across recent page-visit logs'
        />
        <MetricCard
          accentClassName='from-fuchsia-400 via-violet-500 to-transparent'
          eyebrow='Repeat Traffic'
          value={`${repeatTraffic}%`}
          detail='Visits beyond the first unique visitor marker'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <Card className={PANEL_CLASSNAME}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_62%)]' />
          <div className='relative'>
            <SectionHeading
              eyebrow='Velocity'
              title='Daily Visits'
              subtitle='A seven-day read on overall traffic and visitor consistency.'
            />
            {timeBasedStats ? (
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={timeBasedStats.dailyData}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis
                    axisLine={false}
                    dataKey='date'
                    tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{fill: 'rgba(59,130,246,0.08)'}}
                    itemStyle={{color: '#e2e8f0'}}
                    labelStyle={{color: '#94a3b8'}}
                  />
                  <Bar
                    dataKey='visits'
                    fill={COLORS[0]}
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>

        <Card className={PANEL_CLASSNAME}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_62%)]' />
          <div className='relative'>
            <SectionHeading
              eyebrow='Cadence'
              title='Hourly Distribution'
              subtitle='The most recent 24-hour rhythm of site activity.'
            />
            {timeBasedStats ? (
              <ResponsiveContainer width='100%' height={280}>
                <LineChart data={timeBasedStats.hourlyData}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis
                    axisLine={false}
                    dataKey='hour'
                    tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1}}
                    itemStyle={{color: '#e2e8f0'}}
                    labelStyle={{color: '#94a3b8'}}
                  />
                  <Line
                    activeDot={{fill: COLORS[1], r: 5, strokeWidth: 0}}
                    dataKey='visits'
                    dot={false}
                    stroke={COLORS[1]}
                    strokeWidth={2.5}
                    type='monotone'
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <Card className={PANEL_CLASSNAME}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_62%)]' />
          <div className='relative'>
            <SectionHeading
              eyebrow='Audience'
              title='Device Distribution'
              subtitle='How people are arriving across desktop, mobile, and tablet.'
            />
            <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-center'>
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <Pie
                    cx='50%'
                    cy='50%'
                    data={deviceData}
                    dataKey='value'
                    innerRadius={isMobile ? 48 : 62}
                    labelLine={false}
                    outerRadius={isMobile ? 72 : 92}
                    paddingAngle={3}
                    stroke='rgba(15, 23, 42, 0.8)'
                    strokeWidth={2}>
                    {deviceData.map((_, index) => (
                      <Cell
                        key={`device-cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    itemStyle={{color: '#e2e8f0'}}
                    labelStyle={{color: '#94a3b8'}}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className='grid gap-2'>
                {deviceData.length > 0 ? (
                  deviceData.map((device, index) => (
                    <div
                      key={device.name}
                      className='rounded-2xl border border-foreground/8 bg-foreground/4 px-3 py-2.5'>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          <span
                            className='size-2.5 rounded-full'
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className='text-sm text-foreground'>
                            {device.name}
                          </span>
                        </div>
                        <span className='text-xs font-okxs text-foreground/65'>
                          {device.share}%
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-foreground/50'>
                        {device.value.toLocaleString()} visits
                      </p>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-foreground/50'>
                    No device data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className={cn(PANEL_CLASSNAME)}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_62%)]' />
          <div className='relative'>
            <SectionHeading
              eyebrow='Environment'
              title='Browser Distribution'
              subtitle='The browser stack showing up most often in recent visits.'
            />
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={browserData} layout='vertical'>
                <CartesianGrid horizontal stroke={CHART_GRID_STROKE} />
                <XAxis
                  axisLine={false}
                  tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                  tickLine={false}
                  type='number'
                />
                <YAxis
                  axisLine={false}
                  dataKey='name'
                  tick={{fill: CHART_TICK_COLOR, fontSize: 12}}
                  tickLine={false}
                  type='category'
                  width={88}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={{fill: 'rgba(245,158,11,0.08)'}}
                  itemStyle={{color: '#e2e8f0'}}
                  labelStyle={{color: '#94a3b8'}}
                />
                <Bar dataKey='value' fill={COLORS[2]} radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2 pb-32'>
        <Card className={PANEL_CLASSNAME}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.12),transparent_62%)]' />
          <div className='relative'>
            <div className='mb-4 flex items-start justify-between gap-3'>
              <SectionHeading
                eyebrow='Content'
                title='Top Pages'
                subtitle='The pages pulling the most attention right now.'
              />
              <Chip size='sm' variant='tertiary' color='accent'>
                {topPages.length} pages
              </Chip>
            </div>
            <div className='space-y-3'>
              {topPages.length > 0 ? (
                topPages.map((page, index) => (
                  <div
                    key={page.path}
                    className='rounded-2xl border border-foreground/8 bg-foreground/4 p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-[10px] uppercase tracking-[0.28em] text-foreground/45'>
                          #{index + 1}
                        </p>
                        <p className='mt-1 truncate text-sm font-medium text-foreground'>
                          {page.path}
                        </p>
                      </div>
                      <div className='shrink-0 text-right'>
                        <p className='text-sm font-okxs text-foreground'>
                          {page.count.toLocaleString()}
                        </p>
                        <p className='text-xs text-foreground/50'>
                          {page.share}% share
                        </p>
                      </div>
                    </div>
                    <div className='mt-3 h-2 rounded-full bg-foreground/8'>
                      <div
                        className='h-full rounded-full bg-linear-to-r from-pink-500 via-fuchsia-500 to-violet-500'
                        style={{width: `${Math.max(page.share, 6)}%`}}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-sm text-foreground/50'>
                  No page data available
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className={PANEL_CLASSNAME}>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_62%)]' />
          <div className='relative'>
            <div className='mb-4 flex items-start justify-between gap-3'>
              <SectionHeading
                eyebrow='Geography'
                title='Top Countries'
                subtitle='Country codes are expanded into readable names and flags.'
              />
              <Chip size='sm' variant='tertiary' color='success'>
                {countryData.length} countries
              </Chip>
            </div>
            <div className='space-y-3'>
              {countryData.length > 0 ? (
                countryData.map((country, index) => (
                  <div
                    key={`${country.code}-${index}`}
                    className='rounded-2xl border border-foreground/8 bg-foreground/4 p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex min-w-0 items-center gap-3'>
                        <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl border border-foreground/8 bg-foreground/5 text-xl'>
                          {country.flag}
                        </div>
                        <div className='min-w-0'>
                          <p className='text-[8px] uppercase tracking-[0.28em] text-foreground/45'>
                            #{index + 1} ·{' '}
                            {country.code.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p className='mt-1 truncate text-base font-medium text-foreground'>
                            {country.name.split(' ').pop()}
                          </p>
                        </div>
                      </div>
                      <div className='shrink-0 text-right'>
                        <p className='text-base font-okxs text-foreground'>
                          {country.value.toLocaleString()}
                        </p>
                        <p className='text-xs text-foreground/50'>
                          {country.share}% share
                        </p>
                      </div>
                    </div>
                    <div className='mt-3 h-2 rounded-full bg-foreground/8'>
                      <div
                        className='h-full rounded-full bg-linear-to-r from-cyan-500 via-sky-500 to-blue-500'
                        style={{width: `${Math.max(country.share, 6)}%`}}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-sm text-foreground/50'>
                  No country data available
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
