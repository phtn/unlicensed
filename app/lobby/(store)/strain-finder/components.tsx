import {ClassName} from '@/app/types'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

export type Step = 'intro' | 'mood' | 'flavor' | 'potency' | 'results'
interface ProgressIndicatorProps {
  steps: Array<Step>
  step: Step
  className?: ClassName
}

export const ProgressIndicator = ({
  steps,
  step,
  className,
}: ProgressIndicatorProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 mb-3 mr-4',
        className,
      )}>
      {steps.map((s, index) => (
        <div key={s} className='flex items-center'>
          <div
            className={`h-2 w-3 sm:w-6 rounded-full transition-all duration-300 ease-in-out origin-center ${
              step === s
                ? 'bg-featured w-8 sm:w-20'
                : index <
                    (
                      ['mood', 'flavor', 'potency', 'results'] as Step[]
                    ).indexOf(step)
                  ? 'bg-featured/70'
                  : 'bg-foreground/15'
            }`}
          />
          {index < 3 && <div className='h-0 w-1 sm:w-3 bg-foreground/20' />}
        </div>
      ))}
    </div>
  )
}

export const StepHeader = ({title, hint}: {title: string; hint: string}) => {
  return (
    <>
      <h2 className='text-2xl sm:text-3xl font-polysans font-semibold text-foreground mb-1 md:mb-5 text-center'>
        {title}
      </h2>
      <p className='text-center text-sm font-polysans font-thin tracking-wider opacity-50 mb-4 md:mb-12 line-clamp-2 max-w-[35ch] mx-auto'>
        {hint}
      </p>
    </>
  )
}

interface StepWrapperProps {
  children?: ReactNode
  className?: ClassName
}

export const StepWrapper = ({children, className}: StepWrapperProps) => (
  <div
    className={cn(
      'max-w-4xl mx-auto md:min-h-full min-h-[calc(100lvh-260px)]',
      className,
    )}>
    {children}
  </div>
)

interface CheckPinProps {
  className?: ClassName
  step: Step
}

export const CheckPin = ({className, step}: CheckPinProps) => (
  <div className='absolute top-2 right-2 rotate-6 size-5 rounded-full bg-white flex items-center justify-center'>
    <div
      className={cn(
        'size-6 aspect-square rounded-full bg-neutral-50/20 absolute dark:blur-xs',
        className,
      )}
    />
    <div className='size-4.5 aspect-square rounded-full bg-white absolute' />
    <Icon
      name='check-fill'
      className={cn('text-effects size-6 relative', {
        'text-terpenes': step === 'flavor',
        'text-dark-gray': step === 'potency',
      })}
    />
  </div>
)
