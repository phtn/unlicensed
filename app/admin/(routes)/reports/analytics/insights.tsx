'use client'

import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
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
      <Card shadow='sm' className='p-4 dark:bg-dark-table/60'>
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
        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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

        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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

        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
          <div className='flex flex-col'>
            <p className='text-sm text-default-500 mb-1'>Avg Response Time</p>
            <p className='text-2xl font-bold font-space'>{avgResponseTime}ms</p>
            <p className='text-xs text-default-400 mt-1'>
              Page load performance
            </p>
          </div>
        </Card>

        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
          <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
          <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
                  <Chip size='sm' variant='flat' color='primary'>
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
        <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
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
                  <Chip size='sm' variant='flat' color='secondary'>
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
