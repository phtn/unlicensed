/**
 * Test utilities for React component tests
 */

import type {ReactElement, ReactNode} from 'react'
import {render, type RenderOptions} from '@testing-library/react'
import {PendingDealsProvider} from '@/ctx/pending-deals'

interface AllProvidersProps {
  children: ReactNode
  includePendingDeals?: boolean
}

function AllProviders({
  children,
  includePendingDeals = false,
}: AllProvidersProps) {
  const content = includePendingDeals ? (
    <PendingDealsProvider>{children}</PendingDealsProvider>
  ) : (
    children
  )
  return <div className='min-h-screen'>{content}</div>
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  includePendingDeals?: boolean
}

export function renderWithProviders(
  ui: ReactElement,
  {includePendingDeals = false, ...options}: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({children}) => (
      <AllProviders includePendingDeals={includePendingDeals}>
        {children}
      </AllProviders>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export {renderWithProviders as render}
