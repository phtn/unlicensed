'use client'

import type {ClassName, StoreProduct} from '@/app/types'
import {HyperList} from '@/components/expermtl/hyper-list'
import {PrimaryCard} from '@/components/store/primary-card'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import {PotencyLevel} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {parseAsString, parseAsStringEnum, useQueryState} from 'nuqs'
import {
  Activity,
  useCallback,
  useMemo,
  useTransition,
  ViewTransition,
} from 'react'
import {
  CheckPin,
  ProgressIndicator,
  Step,
  StepHeader,
  StepWrapper,
} from './components'
import {OrbScene} from './orbs'

interface ContentProps {
  initialProducts: StoreProduct[]
}

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
  {icon: 'strength', id: 'mild', label: 'Mild', description: 'Light & Gentle'},
  {
    icon: 'strength-medium',
    id: 'medium',
    label: 'Medium',
    description: 'Balanced',
  },
  {
    icon: 'strength-high',
    id: 'high',
    label: 'High',
    description: 'Potent & Strong',
  },
]

export const Content = ({initialProducts}: ContentProps) => {
  // URL query state
  const [step, setStep] = useQueryState(
    'step',
    parseAsStringEnum<Step>([
      'intro',
      'mood',
      'flavor',
      'potency',
      'results',
    ]).withDefault('intro'),
  )
  const [moods, setMoods] = useQueryState(
    'moods',
    parseAsString.withDefault(''),
  )
  const [flavors, setFlavors] = useQueryState(
    'flavors',
    parseAsString.withDefault(''),
  )
  const [potency, setPotency] = useQueryState(
    'potency',
    parseAsStringEnum<PotencyLevel>(['mild', 'medium', 'high']),
  )
  const [isPending, startTransition] = useTransition()

  // Derive preferences from URL state
  const preferences = useMemo<FinderPreferences>(
    () => ({
      moods: moods
        ? moods
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean)
        : [],
      flavors: flavors
        ? flavors
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
      potency: potency ?? null,
    }),
    [moods, flavors, potency],
  )

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

  const toggleMood = useCallback(
    (moodId: string) => {
      startTransition(() => {
        const currentMoods = preferences.moods
        const newMoods = currentMoods.includes(moodId)
          ? currentMoods.filter((m) => m !== moodId)
          : [...currentMoods, moodId]
        setMoods(newMoods.length > 0 ? newMoods.join(',') : null)
      })
    },
    [preferences.moods, setMoods],
  )

  const toggleFlavor = useCallback(
    (flavorId: string) => {
      startTransition(() => {
        const currentFlavors = preferences.flavors
        const newFlavors = currentFlavors.includes(flavorId)
          ? currentFlavors.filter((f) => f !== flavorId)
          : [...currentFlavors, flavorId]
        setFlavors(newFlavors.length > 0 ? newFlavors.join(',') : null)
      })
    },
    [preferences.flavors, setFlavors],
  )

  const handleSetPotency = useCallback(
    (newPotency: PotencyLevel) => {
      startTransition(() => {
        setPotency(newPotency)
      })
    },
    [setPotency],
  )

  const nextStep = () => {
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
  }

  const prevStep = () => {
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
  }

  const resetFinder = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/lobby/strain-finder'
    }
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
    <div className='h-full md:min-h-screen md:bg-background dark:md:background dark:bg-black'>
      <ScrollArea className='relative mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-8 pt-16 sm:pt-16 lg:pt-48 md:h-full h-screen overflow-hidden'>
        <ViewTransition>
          <div
            className={cn('text-center mb-4 sm:mb-0', {
              hidden: step === 'intro',
            })}>
            <div className='flex md:flex-col w-full items-center justify-between'>
              <div className='md:hidden font-polysans whitespace-nowrap font-medium mb-3 ml-4 bg-sidebar dark:bg-dark-gray/40 dark:text-white text-dark-gray md:text-base text-sm px-4 py-1.5 md:py-1 rounded-full w-fit'>
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
              <OrbScene />
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
              hint='Select moods that resonate with you'
            />
            <div className='grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5 md:gap-4 px-1'>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = preferences.moods.includes(mood.id)
                return (
                  <button
                    key={mood.id}
                    onClick={() => toggleMood(mood.id)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-3.5 md:p-6 transition-all duration-300 ${
                      isSelected
                        ? 'border-effects bg-effects/10 scale-105'
                        : 'border-sidebar bg-sidebar/60 dark:bg-dark-table/60 md:hover:border-slate-300/50 hover:scale-102'
                    }`}>
                    <div className='text-center space-y-2'>
                      <div className='text-4xl'>{mood.emoji}</div>
                      <div className='font-semibold text-foreground'>
                        {mood.label}
                      </div>
                      <div className='text-xs text-muted-foreground'>
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
            <div className='grid grid-cols-3 sm:grid-cols-4 gap-4 px-1'>
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
                    onClick={() => handleSetPotency(option.id)}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border-2 p-6 md:py-6 transition-all duration-300 border-foreground/20 bg-background md:hover:border-foreground/40 hover:scale-102',
                      {
                        'border border-rose-500 bg-rose-500/5':
                          option.id === 'high' && isSelected,
                      },
                      {
                        'border-terpenes bg-terpenes/5':
                          option.id === 'medium' && isSelected,
                      },
                      {
                        'border-featured bg-featured/5':
                          option.id === 'mild' && isSelected,
                      },
                    )}>
                    <div className='flex items-start justify-center'>
                      <div className='text-left md:text-center'>
                        <div className='flex items-center space-x-2'>
                          <Icon
                            name={option.icon}
                            className={cn('size-9', {
                              'text-featured': option.id === 'mild',
                              'text-terpenes': option.id === 'medium',
                              'text-rose-500': option.id === 'high',
                            })}
                          />
                          <div className='text-xl md:text-2xl font-polysans font-semibold text-foreground capitalize'>
                            {option.label}
                          </div>
                        </div>

                        <div className='text-sm opacity-60 font-sans'>
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
              hint={`Here are three strains we think you'll love`}
              // hint="Based on your preferences, "
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
              ) : (
                <p className='text-lg opacity-60 mb-6'>
                  No products match your preferences. Try adjusting your
                  selections.
                </p>
              )}
            </ViewTransition>
            <div className='text-center py-12'>
              <Button
                size='lg'
                onPress={resetFinder}
                radius='full'
                variant='solid'
                color='primary'
                className='bg-foreground font-polysans dark:text-background'>
                Start Over
              </Button>
            </div>
          </StepWrapper>
        </Activity>

        {/* Navigation */}
        {step !== 'intro' && (
          <div className='relative z-200 flex items-center justify-between mt-4 sm:mt-16 max-w-4xl mx-auto'>
            {step !== 'mood' && step !== 'results' && (
              <Button
                onPress={prevStep}
                variant='flat'
                radius='full'
                isDisabled={isPending}
                className='px-6 ml-2 font-polysans font-semibold bg-sidebar'>
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
                className={cn(
                  'px-8 bg-brand disabled:bg-zinc-500 text-white font-polysans font-semibold tracking-wide mr-2',
                )}>
                <span className='drop-shadow-xs drop-shadow-zinc-600/30'>
                  {step === 'potency' ? 'Find My Strains' : 'Continue'}
                  {step === 'potency' && <span className='ml-2'>&rarr;</span>}
                </span>
              </Button>
            ) : null}
          </div>
        )}
      </ScrollArea>
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
      className='relative z-200 cta-button w-fit px-8 py-6 mr-4 text-sm font-semibold uppercase tracking-[0.30em] flex items-center bg-dark-gray dark:bg-effects text-white md:place-self-start place-self-end'
      isDisabled={loading}>
      <span>Start</span>
    </Button>
  </div>
)
