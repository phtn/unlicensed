'use client'

import {Loader} from '@/components/expermtl/loader'
import ShimmerText from '@/components/expermtl/shimmer'
import {Typewrite} from '@/components/expermtl/typewrite'
import {usePinAccess} from '@/ctx/pin-access'
import {Icon} from '@/lib/icons'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from 'react'

export function PinAccessGate() {
  const {authenticate, pinLength, isAuthenticated} = usePinAccess()
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [isMounted, setIsMounted] = useState(() => true)
  const [isLoading, setIsLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const [redirectTimer, setRedirectTimer] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (isAuthenticated) {
      timer = setTimeout(() => {
        setRedirectTimer(true)
      }, 4000)
    }

    return () => clearTimeout(timer as NodeJS.Timeout)
  }, [isAuthenticated])

  useEffect(() => {
    return () => {
      if (isMounted) {
        setIsMounted(false)
      }
    }
  }, [isMounted])

  useEffect(() => {
    if (isMounted && isAuthenticated) {
      startTransition(() => {
        router.replace('/lobby')
      })
    }
  }, [isMounted, isAuthenticated, router])

  const handlePinChange = useCallback(
    (value: string) => {
      // Only allow alphanumeric characters
      const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      setPin(sanitized)
      setError(false)

      if (sanitized.length === pinLength) {
        const isValid = authenticate(sanitized)
        if (isValid) {
          startTransition(() => {
            router.replace('/lobby')
          })
        } else {
          setError(true)
          setShake(true)
          setTimeout(() => {
            setShake(false)
            setPin('')
            inputRef.current?.focus()
          }, 500)
        }
      }
    },
    [authenticate, pinLength, router],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      // Get the current value from the input ref for browser automation compatibility
      const inputValue = inputRef.current?.value || pin
      const sanitized = inputValue.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

      if (sanitized.length === pinLength) {
        const isValid = authenticate(sanitized)
        if (isValid) {
          startTransition(() => {
            router.replace('/lobby')
          })
        } else {
          setError(true)
          setShake(true)
          setTimeout(() => {
            setShake(false)
            setPin('')
            if (inputRef.current) inputRef.current.value = ''
            inputRef.current?.focus()
          }, 500)
        }
      }
    },
    [authenticate, pin, pinLength, router],
  )

  const pinDisplay = useMemo(() => {
    const chars = pin.split('')
    const display: Array<{char: string; filled: boolean}> = []

    for (let i = 0; i < pinLength; i++) {
      display.push({
        char: chars[i] || '',
        filled: !!chars[i],
      })
    }

    return display
  }, [pin, pinLength])

  if (isLoading) {
    return (
      <ViewTransition>
        <div className='fixed inset-0 z-9999 flex items-center justify-center overflow-hidden bg-zinc-950'>
          <div className='absolute inset-0 bg-linear-to-b from-fuchsia-950/20 via-zinc-950 to-zinc-950' />
          <div className='absolute -bottom-96 left-1/2 -translate-x-1/2 size-160 aspect-square rounded-full bg-linear-to-t from-slate-950 via-slate-800/40 to-transparent blur-3xl' />
          <div className='relative z-10 scale-50'>
            <Loader />
          </div>
        </div>
      </ViewTransition>
    )
  }

  if (isAuthenticated) {
    return (
      <ViewTransition>
        <div className='fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-zinc-950'>
          <div className='absolute inset-0 bg-linear-to-b from-fuchsia-950/20 via-zinc-950 to-zinc-950' />
          <div className='absolute -bottom-96 left-1/2 -translate-x-1/2 size-160 aspect-square rounded-full bg-linear-to-t from-slate-950 via-slate-800/40 to-transparent blur-3xl' />
          <div className='relative z-10 font-brk tracking-widest'>
            <Typewrite initialDelay={0} speed={30} text='AWESOME!' />
          </div>
          <div className='relative flex items-center h-16 z-10 font-brk text-sm tracking-widest'>
            <ViewTransition>
              {redirectTimer && (
                <Link
                  href='/lobby'
                  className='text-brand underline underline-offset-6 decoration-zinc-100/30 hover:decoration-zinc-100/60 decoration-dotted decoration-0.5'>
                  TO LOBBY &rarr;
                </Link>
              )}
            </ViewTransition>
          </div>
        </div>
      </ViewTransition>
    )
  }

  return (
    <div className='fixed inset-0 z-9999 flex items-center justify-center overflow-hidden bg-zinc-950'>
      {/* Background gradients */}
      <div className='absolute inset-0 bg-linear-to-b from-fuchsia-950/20 via-zinc-950 to-zinc-950' />
      <div className='absolute -bottom-96 left-1/2 -translate-x-1/2 size-160 aspect-square rounded-full bg-linear-to-t from-slate-950 via-slate-800/40 to-transparent blur-3xl' />
      <div className='absolute -top-32 -right-32 w-96 h-96 rounded-full bg-zinc-500/10 blur-3xl' />
      <div className='absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-zinc-700/20 blur-3xl' />

      {/* Content */}
      <div className='relative z-10 w-full max-w-md px-6 py-16'>
        <div className='flex items-center justify-center space-x-6'>
          {/* Logo/Icon */}
          <div className='flex items-center justify-center h-full'>
            <div className='relative'>
              <Icon
                name='re-up.ph'
                className='relative z-50 size-10 mb-1 text-white/90 drop-shadow-2xl'
              />
              <div className='absolute inset-0 blur-xl bg-featured/50 rounded-3xl' />
            </div>
          </div>

          {/* Header */}
          <div className='flex items-center justify-center whitespace-nowrap'>
            <ShimmerText
              surface='dark'
              variant='default'
              className='leading-none'>
              <span className='font-polysans font-bold text-4xl md:text-6xl'>
                Halt Gate
              </span>
            </ShimmerText>
          </div>
        </div>
        <div className='flex items-center justify-center h-24'>
          <p className='text-slate-500 text-base font-light font-brk'>
            Access Code Required
          </p>
        </div>
        {/* PIN Input Display Container */}
        <div
          className={`relative flex justify-center gap-2 md:gap-3 mb-8 transition-transform ${
            shake ? 'animate-shake' : ''
          }`}
          onClick={() => inputRef.current?.focus()}>
          {/* Visual PIN boxes */}
          {pinDisplay.map((item, idx) => (
            <div
              key={idx}
              className={`
                w-14 h-13
                flex items-center justify-center
                rounded-xl border-2
                transition-all duration-200
                pointer-events-none
                ${
                  item.filled
                    ? 'bg-brand border-brand/60'
                    : 'bg-white/5 border-slate-400/20'
                }
                ${error ? 'border-red-500/70 bg-red-500/10' : ''}
              `}>
              <span
                className={`
                text-2xl md:text-3xl font-mono font-bold
                ${item.filled ? 'text-brand' : 'text-zinc-900'}
                ${error ? 'text-red-400' : ''}
              `}>
                {item.filled ? '•' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Visible Input Field */}
        <form onSubmit={handleSubmit} className='flex justify-center mb-4'>
          <input
            ref={inputRef}
            type='text'
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            maxLength={pinLength}
            autoFocus
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='characters'
            spellCheck={false}
            placeholder='Access Code'
            className='w-full max-w-xs px-4 py-3 text-center text-lg font-brk tracking-[0.5em] bg-white/5 border-2 border-slate-400/20 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-zinc-200/60 focus:bg-white/10 transition-all uppercase'
          />
        </form>

        {/* Status Message */}
        <div className='text-center text-slate-500 text-sm font-brk'>
          {error ? (
            <span className='text-rose-300'>Invalid Pin. Try again.</span>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* Footer */}
        <div className='mt-16 text-center'>
          <p className='text-slate-600 text-xs'>Access Code Not Detected</p>
        </div>
      </div>
    </div>
  )
}
