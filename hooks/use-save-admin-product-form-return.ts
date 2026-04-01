'use client'

import { setAdminProductFormReturnPath } from '@/lib/admin-product-form-return'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export const useSaveAdminProductFormReturn = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(() => {
    const search = searchParams.toString()
    const hash = typeof window === 'undefined' ? '' : window.location.hash
    const returnPath = `${pathname}${search ? `?${search}` : ''}${hash}`

    setAdminProductFormReturnPath(returnPath)
  }, [pathname, searchParams])
}
