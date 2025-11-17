'use client'

import {Icon} from '@/lib/icons'

interface AnimationSettings {
  showPath: boolean
  startCurveX: number
  startCurveY: number
  endCurveX: number
  endCurveY: number
  startTiming: number
}

export default function SettingsPanel({
  settings,
  onSettingsChangeAction,
}: {
  settings: AnimationSettings
  onSettingsChangeAction: (settings: AnimationSettings) => void
}) {
  const handleChange = (key: keyof AnimationSettings, value: unknown) => {
    onSettingsChangeAction({...settings, [key]: value})
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Animation Settings</h1>
        </div>
        <Icon name='strength' size={24} className='text-neutral-500' />
      </div>

      {/* Curve Visualization */}
      <section className='mb-8'>
        <h2 className='text-lg font-semibold mb-2'>Curve Visualization</h2>
        <p className='text-neutral-400 text-sm mb-4'>
          Display the animation path on screen
        </p>
        <button
          onClick={() => handleChange('showPath', !settings.showPath)}
          className='px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors'>
          Show Animation Path
        </button>
      </section>

      {/* Flight Path - Start Curve */}
      <section className='mb-8'>
        <h3 className='text-base font-semibold mb-4'>
          Flight Path - Start Curve
        </h3>
        <p className='text-neutral-400 text-sm mb-6'>
          Adjust how the item curves at the beginning
        </p>

        <div className='space-y-6'>
          {/* Horizontal Position */}
          <div>
            <label className='block text-sm font-medium mb-3'>
              Horizontal Position
            </label>
            <div className='flex items-center gap-4'>
              <input
                type='range'
                min='-300'
                max='0'
                value={settings.startCurveX}
                onChange={(e) =>
                  handleChange('startCurveX', Number(e.target.value))
                }
                className='flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer'
              />
              <span className='text-neutral-400 text-sm w-12 text-right'>
                {settings.startCurveX}
              </span>
            </div>
          </div>

          {/* Arc Height */}
          <div>
            <label className='block text-sm font-medium mb-3'>Arc Height</label>
            <div className='flex items-center gap-4'>
              <input
                type='range'
                min='-200'
                max='0'
                value={settings.startCurveY}
                onChange={(e) =>
                  handleChange('startCurveY', Number(e.target.value))
                }
                className='flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer'
              />
              <span className='text-neutral-400 text-sm w-12 text-right'>
                {settings.startCurveY}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Flight Path - End Curve */}
      <section className='mb-8'>
        <h3 className='text-base font-semibold mb-4'>
          Flight Path - End Curve
        </h3>
        <p className='text-neutral-400 text-sm mb-6'>
          Adjust how the item curves before reaching the cart
        </p>

        <div className='space-y-6'>
          {/* Horizontal Position */}
          <div>
            <label className='block text-sm font-medium mb-3'>
              Horizontal Position
            </label>
            <div className='flex items-center gap-4'>
              <input
                type='range'
                min='0'
                max='300'
                value={settings.endCurveX}
                onChange={(e) =>
                  handleChange('endCurveX', Number(e.target.value))
                }
                className='flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer'
              />
              <span className='text-neutral-400 text-sm w-12 text-right'>
                {settings.endCurveX}
              </span>
            </div>
          </div>

          {/* Arc Height */}
          <div>
            <label className='block text-sm font-medium mb-3'>Arc Height</label>
            <div className='flex items-center gap-4'>
              <input
                type='range'
                min='-200'
                max='0'
                value={settings.endCurveY}
                onChange={(e) =>
                  handleChange('endCurveY', Number(e.target.value))
                }
                className='flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer'
              />
              <span className='text-neutral-400 text-sm w-12 text-right'>
                {settings.endCurveY}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Easing */}
      <section>
        <h3 className='text-base font-semibold mb-4'>Animation Easing</h3>
        <p className='text-neutral-400 text-sm mb-6'>
          Control the speed curve and acceleration timing
        </p>

        <div>
          <label className='block text-sm font-medium mb-3'>
            Start Timing (X1)
          </label>
          <div className='flex items-center gap-4'>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={settings.startTiming}
              onChange={(e) =>
                handleChange('startTiming', Number(e.target.value))
              }
              className='flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer'
            />
            <span className='text-neutral-400 text-sm w-12 text-right'>
              {settings.startTiming.toFixed(2)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
