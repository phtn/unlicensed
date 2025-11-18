import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, Progress} from '@heroui/react'
import MiniChart from './mini-chart'

const generateData = () =>
  Array.from({length: 20}, () => ({
    value: 0,
  }))

type StatsProps = {
  salesTodayCents: number
  pendingOrdersCount: number
  ongoingDeliveriesCount: number
  deliveredOrdersCount: number
  totalOrdersCount: number
  salesData?: Array<{value: number}>
  ordersData?: Array<{value: number}>
  deliveriesData?: Array<{value: number}>
}

export const Stats = ({
  salesTodayCents,
  pendingOrdersCount,
  ongoingDeliveriesCount,
  deliveredOrdersCount,
  totalOrdersCount,
  salesData,
  ordersData,
  // deliveriesData,
}: StatsProps) => {
  // Fallback to empty data if chart data is not available
  const chartSalesData =
    salesData && salesData.length > 0 ? salesData : generateData()
  const chartOrdersData =
    ordersData && ordersData.length > 0 ? ordersData : generateData()
  // const chartDeliveriesData =
  //   deliveriesData && deliveriesData.length > 0
  //     ? deliveriesData
  //     : generateData()

  // Calculate delivery progress percentage
  const deliveryProgress =
    totalOrdersCount > 0
      ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100)
      : 0

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0'>
      <Card shadow='sm' className='p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center space-x-2 p-1 rounded-lg'>
            <div className='w-1 h-5 bg-[#06b6d4] rounded-full' />
            <p className='text-base font-medium font-space'>Sales Today</p>
          </div>
          <Button isIconOnly variant='light' size='sm'>
            <Icon name='chevron-right' className='opacity-80' />
          </Button>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-semibold font-space'>
              ${formatPrice(salesTodayCents)}
            </span>
            <span className='text-sm text-gray-400'></span>
          </div>
        </div>
        <div className='mt-4 h-12'>
          <MiniChart data={chartSalesData} color='#06b6d4' />
        </div>
      </Card>

      <Card shadow='sm' className='p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center space-x-2 p-1 rounded-lg'>
            <div className='w-1 h-5 bg-orange-500 rounded-full' />
            <p className='text-base font-medium font-space'>Orders</p>
          </div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-semibold font-space'>
              {pendingOrdersCount}
            </span>
            <span className='text-sm text-gray-400'></span>
          </div>
        </div>
        <div className='mt-4 h-12'>
          <MiniChart data={chartOrdersData} color='#ff6800' />
        </div>
      </Card>

      <Card shadow='sm' className='p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center space-x-2 p-1 rounded-lg'>
            <div className='w-1 h-5 bg-blue-400 rounded-full' />
            <p className='text-base font-medium font-space'>Deliveries</p>
          </div>
          <div className='font-space text-sm space-x-2'>
            <span className='opacity-60'>Ongoing</span>
            <span>{ongoingDeliveriesCount}</span>
          </div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-semibold font-space'>
              {deliveredOrdersCount}
            </span>
            <span className='text-sm text-gray-400'>/ {totalOrdersCount}</span>
          </div>
          <p className='text-sm text-gray-400'>Delivered</p>
        </div>
        <div className='mt-8 h-1 rounded-full overflow-hidden'>
          <Progress value={deliveryProgress} />
        </div>
      </Card>
    </div>
  )
}
