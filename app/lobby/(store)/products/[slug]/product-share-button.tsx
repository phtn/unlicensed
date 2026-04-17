'use client'

import type {StoreProduct} from '@/app/types'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useCallback} from 'react'

interface ProductShareButtonProps {
  product: StoreProduct
}

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.append(textarea)
  textarea.select()

  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('Copy command failed')
  }
}

export const ProductShareButton = ({product}: ProductShareButtonProps) => {
  const handleShare = useCallback(async () => {
    const shareUrl = new URL(
      `/lobby/products/${encodeURIComponent(product.slug)}`,
      window.location.origin,
    ).toString()
    const description =
      product.shortDescription || product.description || 'View this product.'
    const shareData: ShareData = {
      title: `${product.name} | Rapid Fire`,
      text: description,
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await copyToClipboard(shareUrl)
      onSuccess('Product link copied')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      try {
        await copyToClipboard(shareUrl)
        onSuccess('Product link copied')
      } catch {
        onError('Unable to share this product')
      }
    }
  }, [
    product.description,
    product.name,
    product.shortDescription,
    product.slug,
  ])

  return (
    <Button
      aria-label={`Share ${product.name}`}
      size='sm'
      variant='primary'
      onPress={handleShare}
      className='h-7 shrink-0 items-center md:-mb-1'>
      <span className='font-polysans font-medium'>share</span>
      <Icon name='share-fill' className='size-3.5' />
    </Button>
  )
}
