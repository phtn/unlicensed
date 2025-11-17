import {Icon} from '@/lib/icons'
import {Card} from '@heroui/react'
import MiniChart from './mini-chart'

const generateData = () =>
  Array.from({length: 20}, () => ({
    value: Math.random() * 50 + 50,
  }))

export const Metrics = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0'>
      <Card className='bg-[#1a1f2e] border-[#1a1f2e] hover:border-[#3a4152] transition-all duration-300 p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='p-2 bg-[#242938] rounded-lg'>
            <Icon name='pink-rozay' className='w-5 h-5 text-cyan-400' />
          </div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-3xl font-bold text-white'>12,350</span>
            <span className='text-sm text-gray-400'>MW</span>
          </div>
          <p className='text-sm text-gray-400'>Total Power Generation</p>
        </div>
        <div className='mt-4 h-12'>
          <MiniChart data={generateData()} color='#06b6d4' />
        </div>
      </Card>

      <Card className='bg-[#1a1f2e] border-[#2a3142] hover:border-[#3a4152] transition-all duration-300 p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='p-2 bg-[#242938] rounded-lg'>
            <Icon name='pinene' className='w-5 h-5 text-orange-400' />
          </div>
          <div className='text-xs text-gray-400'>vs 12,350 MW</div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-3xl font-bold text-white'>11,870</span>
            <span className='text-sm text-gray-400'>MW</span>
          </div>
          <p className='text-sm text-gray-400'>Total Power Consumption</p>
        </div>
        <div className='mt-4 h-1 bg-[#2a3142] rounded-full overflow-hidden'>
          <div className='h-full bg-linear-to-r from-red-500 to-orange-500 w-[96%] transition-all duration-700' />
        </div>
      </Card>

      <Card className='bg-[#1a1f2e] border-[#2a3142] hover:border-[#3a4152] transition-all duration-300 p-3 sm:p-4 md:p-5 min-w-0'>
        <div className='flex items-start justify-between mb-3'>
          <div className='p-2 bg-[#242938] rounded-lg'>
            <Icon name='humulene' className='w-5 h-5 text-blue-400' />
          </div>
          <div className='relative inline-flex'>
            <svg width='48' height='48' className='transform -rotate-90'>
              <circle
                cx='24'
                cy='24'
                r='20'
                stroke='#2a3142'
                strokeWidth='4'
                fill='none'
              />
              <circle
                cx='24'
                cy='24'
                r='20'
                stroke='#3b82f6'
                strokeWidth='4'
                fill='none'
                strokeDasharray={`${98 * 1.25} ${125.6}`}
                strokeLinecap='round'
                className='transition-all duration-700'
              />
            </svg>
          </div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-3xl font-bold text-white'>98</span>
            <span className='text-sm text-gray-400'>%</span>
          </div>
          <p className='text-sm text-gray-400'>Grid Load</p>
        </div>
      </Card>
    </div>
  )
}
