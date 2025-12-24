'use client'

import type {ClassName, StoreProduct} from '@/app/types'
import {HyperList} from '@/components/expermtl/hyper-list'
import {PrimaryCard} from '@/components/store/primary-card'
import {api} from '@/convex/_generated/api'
import {PotencyLevel} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {
  Activity,
  ReactNode,
  useCallback,
  useMemo,
  useState,
  useTransition,
  ViewTransition,
} from 'react'

interface ContentProps {
  initialProducts: StoreProduct[]
}

type Step = 'intro' | 'mood' | 'flavor' | 'potency' | 'results'

interface FinderPreferences {
  moods: string[]
  flavors: string[]
  potency: PotencyLevel | null
}

const steps: Array<Step> = ['mood', 'flavor', 'potency', 'results']
const MOOD_OPTIONS = [
  {id: 'relaxed', label: 'Relaxed', emoji: '😌', description: 'Unwind & chill'},
  {id: 'energetic', label: 'Energetic', emoji: '⚡', description: 'Get moving'},
  {
    id: 'creative',
    label: 'Creative',
    emoji: '🎨',
    description: 'Spark inspiration',
  },
  {id: 'focused', label: 'Focused', emoji: '🎯', description: 'Stay sharp'},
  {id: 'euphoric', label: 'Euphoric', emoji: '✨', description: 'Feel amazing'},
  {id: 'sleepy', label: 'Sleepy', emoji: '😴', description: 'Wind down'},
]

const FLAVOR_OPTIONS = [
  {id: 'fruity', label: 'Fruity', emoji: '🍓'},
  {id: 'citrus', label: 'Citrus', emoji: '🍋'},
  {id: 'earthy', label: 'Earthy', emoji: '🌿'},
  {id: 'pine', label: 'Pine', emoji: '🌲'},
  {id: 'sweet', label: 'Sweet', emoji: '🍯'},
  {id: 'spicy', label: 'Spicy', emoji: '🌶️'},
  {id: 'herbal', label: 'Herbal', emoji: '🌱'},
  {id: 'floral', label: 'Floral', emoji: '🌸'},
]

const POTENCY_OPTIONS: Array<{
  id: PotencyLevel
  label: string
  description: string
  icon: IconName
}> = [
  {icon: 'strength', id: 'mild', label: 'Mild', description: 'Light & gentle'},
  {
    icon: 'strength-medium',
    id: 'medium',
    label: 'Medium',
    description: 'Balanced experience',
  },
  {
    icon: 'strength-high',
    id: 'high',
    label: 'High',
    description: 'Potent & strong',
  },
]

export const Content = ({initialProducts}: ContentProps) => {
  const [step, setStep] = useState<Step>('intro')
  const [preferences, setPreferences] = useState<FinderPreferences>({
    moods: [],
    flavors: [],
    potency: null,
  })
  const [isPending, startTransition] = useTransition()

  const productsQuery = useQuery(api.products.q.listProducts, {})
  const products = useMemo(
    () =>
      (productsQuery?.map(adaptProduct) ?? initialProducts).filter(
        (p) => p.available && p.stock > 0,
      ),
    [productsQuery, initialProducts],
  )

  // Get product image IDs for URL resolution
  const productImageIds = useMemo(
    () => products.map((p) => p.image).filter((id): id is string => !!id),
    [products],
  )
  const resolveUrl = useStorageUrls(productImageIds)

  const toggleMood = useCallback((moodId: string) => {
    startTransition(() => {
      setPreferences((prev) => ({
        ...prev,
        moods: prev.moods.includes(moodId)
          ? prev.moods.filter((m) => m !== moodId)
          : [...prev.moods, moodId],
      }))
    })
  }, [])

  const toggleFlavor = useCallback((flavorId: string) => {
    startTransition(() => {
      setPreferences((prev) => ({
        ...prev,
        flavors: prev.flavors.includes(flavorId)
          ? prev.flavors.filter((f) => f !== flavorId)
          : [...prev.flavors, flavorId],
      }))
    })
  }, [])

  const setPotency = useCallback((potency: PotencyLevel) => {
    startTransition(() => {
      setPreferences((prev) => ({...prev, potency}))
    })
  }, [])

  const nextStep = useCallback(() => {
    startTransition(() => {
      if (step === 'intro') {
        setStep('mood')
      } else if (step === 'mood') {
        setStep('flavor')
      } else if (step === 'flavor') {
        setStep('potency')
      } else if (step === 'potency' && preferences.potency) {
        setStep('results')
      }
    })
  }, [step, preferences])

  const prevStep = useCallback(() => {
    startTransition(() => {
      if (step === 'intro') {
      } else if (step === 'flavor') {
        setStep('mood')
      } else if (step === 'potency') {
        setStep('flavor')
      } else if (step === 'results') {
        setStep('potency')
      }
    })
  }, [step])

  const resetFinder = useCallback(() => {
    startTransition(() => {
      setStep('intro')
      setPreferences({moods: [], flavors: [], potency: null})
    })
  }, [])

  // Match products based on preferences
  const matchedProducts = useMemo(() => {
    if (step !== 'results') return []

    const scored = products.map((product) => {
      let score = 0

      // Match moods (effects)
      if (preferences.moods.length > 0) {
        const matchingEffects = product.effects.filter((effect) =>
          preferences.moods.some((mood) =>
            effect.toLowerCase().includes(mood.toLowerCase()),
          ),
        )
        score += matchingEffects.length * 10
      }

      // Match flavors (flavorNotes and terpenes)
      if (preferences.flavors.length > 0) {
        const allFlavors = [...product.flavorNotes, ...product.terpenes].map(
          (f) => f.toLowerCase(),
        )
        const matchingFlavors = preferences.flavors.filter((flavor) =>
          allFlavors.some((f) => f.includes(flavor.toLowerCase())),
        )
        score += matchingFlavors.length * 8
      }

      // Match potency
      if (preferences.potency && product.potencyLevel === preferences.potency) {
        score += 15
      }

      // Boost featured products
      if (product.featured) {
        score += 5
      }

      // Boost products with higher ratings
      score += product.rating * 2

      return {product, score}
    })

    // Sort by score and return top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.product)
  }, [products, preferences, step])

  const canProceed = useMemo(() => {
    if (step === 'mood') return preferences.moods.length > 0
    if (step === 'potency') return preferences.potency !== null
    return true
  }, [step, preferences])

  const data = useMemo(
    () =>
      matchedProducts.slice().map((p) => ({
        ...p,
        image: p.image ? (resolveUrl(p.image) as string) : null,
      })) satisfies Array<StoreProduct | null>,
    [matchedProducts, resolveUrl],
  )

  return (
    <div className='md:min-h-screen min-h-[calc(100lvh-100px)] md:bg-background dark:md:background dark:bg-black'>
      <div className='mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-8 pt-16 sm:pt-16 lg:pt-48 md:h-full h-screen overflow-hidden'>
        <ViewTransition>
          <div
            className={cn('text-center mb-4 sm:mb-0', {
              hidden: step === 'intro',
            })}>
            <div className='flex md:flex-col w-full items-center justify-between'>
              <div className='md:hidden font-polysans whitespace-nowrap font-medium mb-3 ml-4 bg-light-gray/30 dark:bg-dark-gray/40 dark:text-white text-dark-gray md:text-base text-sm px-4 py-1.5 md:py-1 rounded-full w-fit'>
                Strain Finder
              </div>
              {step !== 'intro' && (
                <ProgressIndicator
                  steps={steps}
                  step={step}
                  className='md:hidden'
                />
              )}
            </div>
          </div>
        </ViewTransition>

        {step !== 'intro' && (
          <ProgressIndicator
            className='md:flex hidden pb-6'
            steps={steps}
            step={step}
          />
        )}

        {/* Intro Step */}
        <Activity mode={step === 'intro' ? 'visible' : 'hidden'}>
          <StepWrapper className='md:max-w-7xl'>
            <div className='rounded-[2.75rem] h-[calc(100lvh-140px)] md:h-auto md:rounded-[36px] bg-slate-200 dark:bg-dark-table/60 border border-foreground/20 sm:px-14 sm:pt-8 transition-colors p-4'>
              <div className='grid md:gap-12 gap-6 lg:grid-cols-5 lg:items-center'>
                <LeftSideContent
                  nextStep={nextStep}
                  loading={isPending}
                  className='hidden md:flex md:flex-col'
                />

                {/* Right Side - Visual Element */}
                <div className='lg:col-span-2 flex items-center justify-center relative'>
                  <div className='relative w-full md:max-w-md aspect-square rounded-4xl'>
                    {/* Isometric-style illustration */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                      {/* Stacked cards/product cards */}
                      <div className='relative w-64 h-64 rounded-4xl'>
                        {/* Card 1 */}
                        <div className='absolute top-0 left-0 w-50 h-64 rounded-2xl bg-linear-to-br from-brand/20 to-brand/5 border-2 border-brand/30 transform rotate-[-8deg] shadow-lg' />
                        {/* Card 2 */}
                        <div className='absolute top-4 left-8 w-36 h-50 rounded-2xl bg-linear-to-br from-featured/20 to-featured/5 border-2 border-featured/30 transform rotate-[4deg] shadow-lg' />
                        {/* Card 3 */}
                        <div className='absolute top-8 left-16 w-32 h-40 rounded-2xl bg-linear-to-br from-light-gray/20 to-light-gray/5 border-2 border-light-gray/30 transform rotate-[-4deg] shadow-lg' />

                        {/* Shield/Checkmark icon in front */}
                        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
                          <div className='w-20 h-20 rounded-full bg-brand/10 dark:bg-effects/20 flex items-center justify-center backdrop-blur-xl'>
                            <Icon name='e' className='w-10 h-10 text-effects' />
                          </div>
                        </div>

                        {/* Floating elements (like coins) */}
                        <div className='absolute top-8 right-8 w-10 h-10 rounded-full bg-terpenes/30 dark:bg-terpenes/20 flex items-center justify-center backdrop-blur-xl transform rotate-2'>
                          <Icon name='humulene' className='size-24' />
                        </div>
                        <div className='absolute bottom-12 left-4 w-12 h-12 rounded-full bg-orange-300/30 dark:bg-accent/20 flex items-center justify-center backdrop-blur-xl transform -rotate-16'>
                          <Icon name='pinene' className='size-24' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <LeftSideContent
                  nextStep={nextStep}
                  loading={isPending}
                  className='md:hidden'
                />
              </div>
            </div>
          </StepWrapper>
        </Activity>

        {/* Step Content */}
        <Activity mode={step === 'mood' ? 'visible' : 'hidden'}>
          <StepWrapper>
            <StepHeader
              title="What's your vibe?"
              hint='Select one or more moods that resonate with you'
            />
            <div className='grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5 md:gap-4 px-0.5'>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = preferences.moods.includes(mood.id)
                return (
                  <button
                    key={mood.id}
                    onClick={() => toggleMood(mood.id)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-3.5 md:p-6 transition-all duration-300 ${
                      isSelected
                        ? 'border-effects bg-effects/10 scale-105'
                        : 'border-slate-300/40 bg-slate-200/40 dark:bg-dark-table/60 md:hover:border-slate-300/50 hover:scale-102'
                    }`}>
                    <div className='text-center space-y-2'>
                      <div className='text-4xl'>{mood.emoji}</div>
                      <div className='font-semibold text-foreground'>
                        {mood.label}
                      </div>
                      <div className='text-xs opacity-60'>
                        {mood.description}
                      </div>
                    </div>
                    <Activity mode={isSelected ? 'visible' : 'hidden'}>
                      <CheckPin step={step} />
                    </Activity>
                  </button>
                )
              })}
            </div>
          </StepWrapper>
        </Activity>

        <Activity mode={step === 'flavor' ? 'visible' : 'hidden'}>
          <StepWrapper>
            <StepHeader
              title='Hints and Flavors'
              hint='Choose the flavors that excite your palate'
            />
            <h2 className='text-2xl sm:text-3xl font-semibold text-foreground mb-6 text-center'></h2>
            <p className='text-center text-sm opacity-60 mb-8'></p>
            <div className='grid grid-cols-3 sm:grid-cols-4 gap-4'>
              {FLAVOR_OPTIONS.map((flavor) => {
                const isSelected = preferences.flavors.includes(flavor.id)
                return (
                  <button
                    key={flavor.id}
                    onClick={() => toggleFlavor(flavor.id)}
                    className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 ${
                      isSelected
                        ? 'border-terpenes bg-terpenes/10 scale-105'
                        : 'border-foreground/20 bg-background hover:border-foreground/40 hover:scale-102'
                    }`}>
                    <div className='text-center space-y-2'>
                      <div className='text-3xl'>{flavor.emoji}</div>
                      <div className='font-medium text-sm text-foreground'>
                        {flavor.label}
                      </div>
                    </div>
                    <Activity mode={isSelected ? 'visible' : 'hidden'}>
                      <CheckPin step={step} className='' />
                    </Activity>
                  </button>
                )
              })}
            </div>
          </StepWrapper>
        </Activity>

        <Activity mode={step === 'potency' ? 'visible' : 'hidden'}>
          <StepWrapper>
            <StepHeader
              title='Potency level?'
              hint='Select your preferred strength'
            />
            <div className='grid md:grid-cols-3 gap-4 pt-4 px-3'>
              {POTENCY_OPTIONS.map((option) => {
                const isSelected = preferences.potency === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setPotency(option.id)}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border-2 p-6 md:p-8 transition-all duration-300 border-foreground/20 bg-background md:hover:border-foreground/40 hover:scale-102',
                      {
                        'border border-rose-500 bg-rose-500/10':
                          option.id === 'high' && isSelected,
                      },
                      {
                        'border-featured bg-featured/10':
                          option.id === 'medium' && isSelected,
                      },
                      {
                        'border-emerald-500 bg-emerald-500/10':
                          option.id === 'mild' && isSelected,
                      },
                    )}>
                    <div className='flex items-center space-x-8'>
                      <Icon name={option.icon} className='size-16' />
                      <div className='text-left md:text-center space-y-1'>
                        <div className='text-2xl md:text-3xl font-bold text-foreground uppercase'>
                          {option.label}
                        </div>
                        <div className='text-sm opacity-60'>
                          {option.description}
                        </div>
                      </div>
                    </div>
                    <Activity mode={isSelected ? 'visible' : 'hidden'}>
                      <CheckPin step={step} className='' />
                    </Activity>
                  </button>
                )
              })}
            </div>
          </StepWrapper>
        </Activity>

        <Activity mode={step === 'results' ? 'visible' : 'hidden'}>
          <StepWrapper>
            <StepHeader
              title='Your Perfect Match'
              hint="Based on your preferences, here are three strains we think you'll love"
            />
            <div className='text-center mb-12'>
              <h2 className='text-3xl sm:text-4xl font-semibold text-foreground mb-4'></h2>
              <p className='text-base opacity-60 max-w-2xl mx-auto'></p>
            </div>
            <ViewTransition>
              {data.length > 0 ? (
                <HyperList
                  data={data}
                  direction='right'
                  component={PrimaryCard}
                  container='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8'
                />
              ) : null}
            </ViewTransition>
            <div className='text-center py-12'>
              <p className='text-lg opacity-60 mb-6'>
                No products match your preferences. Try adjusting your
                selections.
              </p>
              <Button
                onPress={resetFinder}
                radius='full'
                variant='solid'
                className='cta-button'>
                Start Over
              </Button>
            </div>
          </StepWrapper>
        </Activity>

        {/* Navigation */}
        {step !== 'intro' && (
          <div className='flex items-center justify-between mt-4 sm:mt-16 max-w-4xl mx-auto'>
            {step !== 'mood' && (
              <Button
                onPress={prevStep}
                variant='bordered'
                radius='full'
                isDisabled={isPending}
                className='px-6 ml-2'>
                Back
              </Button>
            )}
            <div className='flex-1' />
            {step !== 'results' ? (
              <Button
                onPress={nextStep}
                radius='full'
                variant='solid'
                isDisabled={!canProceed || isPending}
                className={cn('cta-button px-8 bg-dark-gray text-white mr-2')}>
                {step === 'potency' ? 'Find My Strains' : 'Continue'}
              </Button>
            ) : (
              <Button
                onPress={resetFinder}
                radius='full'
                variant='bordered'
                className='px-8'>
                Start Over
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface LeftSideContentProps {
  nextStep: VoidFunction
  loading: boolean
  className?: ClassName
}

const LeftSideContent = ({
  nextStep,
  loading,
  className,
}: LeftSideContentProps) => (
  <div className={cn('space-y-12 md:space-y-16 lg:col-span-3', className)}>
    <h1 className='text-4xl lg:text-4xl font-polysans font-semibold text-foreground tracking-tight max-w-[16ch] md:max-w-[28ch] text-center'>
      <span className='font-bold md:text-5xl md:whitespace-nowrap'>
        Tell us how you want to <span className='text-effects'>feel</span>
      </span>
      <p className='opacity-70 font-medium text-lg lg:text-4xl'>
        We&apos;ll build your tasting flight
      </p>
    </h1>
    <p className='hidden md:flex text-base opacity-70 max-w-[54ch]'>
      We&apos;ll craft a personalized tasting flight matched to your vibe..
    </p>
    <Button
      size='lg'
      radius='full'
      variant='solid'
      onPress={nextStep}
      className='cta-button w-fit px-8 py-6 mr-4 text-sm font-semibold uppercase tracking-[0.30em] flex items-center bg-dark-gray dark:bg-effects text-white md:place-self-start place-self-end'
      isDisabled={loading}>
      <span>Start</span>
    </Button>
  </div>
)

interface ProgressIndicatorProps {
  steps: Array<Step>
  step: Step
  className?: ClassName
}

const ProgressIndicator = ({
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
            className={`h-2 w-3 sm:w-12 rounded-full transition-all duration-300 ease-in-out ${
              step === s
                ? 'bg-featured w-8 sm:w-20'
                : index <
                    (
                      ['mood', 'flavor', 'potency', 'results'] as Step[]
                    ).indexOf(step)
                  ? 'bg-featured/50'
                  : 'bg-foreground/20'
            }`}
          />
          {index < 3 && <div className='h-0 w-1 sm:w-4 bg-foreground/20' />}
        </div>
      ))}
    </div>
  )
}

const StepHeader = ({title, hint}: {title: string; hint: string}) => {
  return (
    <>
      <h2 className='text-2xl sm:text-3xl font-polysans font-semibold text-foreground mb-1 md:mb-5 text-center'>
        {title}
      </h2>
      <p className='text-center text-sm opacity-60 mb-4 md:mb-12 line-clamp-2 max-w-[35ch] mx-auto'>
        {hint}
      </p>
    </>
  )
}

interface StepWrapperProps {
  children?: ReactNode
  className?: ClassName
}

const StepWrapper = ({children, className}: StepWrapperProps) => (
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

const CheckPin = ({className, step}: CheckPinProps) => (
  <div className='absolute top-2 right-2 rotate-6 size-5 rounded-full bg-white flex items-center justify-center'>
    <div
      className={cn(
        'size-6 aspect-square rounded-full bg-indigo-300/60 absolute dark:blur-xs',
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
