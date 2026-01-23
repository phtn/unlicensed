import {CreateCheckoutSessionParams} from 'copperx-fn'
import {useTransition} from 'react'

export const useCopperX = () => {
  const [isPending, startTransition] = useTransition()
  
  const checkout = (payload: CreateCheckoutSessionParams) => {
    return new Promise<unknown>((resolve, reject) => {
      startTransition(() => {
        fetch('/api/copperx/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then(resolve)
          .catch(reject)
      })
    })
  }

  return {checkout, isPending}
}
