import {useCopy} from '@/hooks/use-copy'
import {Icon} from '@/lib/icons'
import {ApiResponse} from '@/lib/paygate/types'
import {Card, CardHeader} from '@heroui/react'
import {useCallback} from 'react'

interface ResponseDisplayProps {
  response: ApiResponse | null
}

export const ResponseDisplay = ({response}: ResponseDisplayProps) => {
  const {copy, copied} = useCopy()
  const handleCopy = useCallback(
    (label: string, text: string) => () => {
      copy(label, text)
    },
    [copy],
  )
  if (!response) return null

  return (
    <Card shadow='sm' className='p-3 sm:p-4 md:p-6'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4'>
        <h2 className='text-xl sm:text-2xl font-polysans font-semibold'>API Response</h2>
        <div
          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
            response.success
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
          {response.success ? 'Success' : 'Error'}
        </div>
      </CardHeader>
      {/*<div className='mb-4'>

      </div>*/}

      {response.url && (
        <div className='mb-3 sm:mb-4'>
          <div className='flex items-center justify-between mb-2 gap-2'>
            <label className='block text-xs sm:text-sm font-medium flex-shrink-0'>Request URL:</label>
            <button
              onClick={handleCopy('url', response.url)}
              className='text-xs text-primary hover:underline p-1 touch-manipulation flex-shrink-0'
              aria-label='Copy URL'>
              <Icon name={copied ? 'check' : 'copy'} className='size-4 sm:size-5' />
            </button>
          </div>
          <div className='p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-lg break-all text-xs sm:text-sm font-mono overflow-x-auto'>
            {response.url}
          </div>
        </div>
      )}

      <div>
        <label className='block text-xs sm:text-sm font-medium mb-2'>Response:</label>
        {response.data &&
        typeof response.data === 'object' &&
        'type' in response.data &&
        response.data.type === 'html' &&
        'message' in response.data &&
        'content' in response.data ? (
          <div className='space-y-2 sm:space-y-3'>
            <div className='p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs sm:text-sm'>
              <p className='mb-2 break-words'>{String(response.data.message)}</p>
              <a
                href={response.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 dark:text-blue-400 hover:underline font-medium break-words inline-block'>
                Open Checkout Page in New Tab →
              </a>
            </div>
            <details className='p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg'>
              <summary className='cursor-pointer font-medium text-xs sm:text-sm mb-2 touch-manipulation'>
                View HTML Source
              </summary>
              <pre className='mt-2 overflow-auto text-xs font-mono max-h-48 sm:max-h-96'>
                {String(response.data.content)}
              </pre>
            </details>
          </div>
        ) : (
          <pre className='p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-xs sm:text-sm font-mono max-h-48 sm:max-h-96'>
            {JSON.stringify(response.data || response.error, null, 2)}
          </pre>
        )}
      </div>
    </Card>
  )
}
