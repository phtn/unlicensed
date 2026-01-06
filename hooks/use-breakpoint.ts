import {useEffect, useState} from 'react'

const MD_BREAKPOINT = 768
const LG_BREAKPOINT = 1024

type Breakpoint = 'mobile' | 'md' | 'lg'

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= LG_BREAKPOINT) {
        setBreakpoint('lg')
      } else if (width >= MD_BREAKPOINT) {
        setBreakpoint('md')
      } else {
        setBreakpoint('mobile')
      }
    }

    updateBreakpoint()

    const mqlMd = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`)
    const mqlLg = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`)

    const handleChange = () => updateBreakpoint()

    mqlMd.addEventListener('change', handleChange)
    mqlLg.addEventListener('change', handleChange)

    return () => {
      mqlMd.removeEventListener('change', handleChange)
      mqlLg.removeEventListener('change', handleChange)
    }
  }, [])

  return breakpoint
}
