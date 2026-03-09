import {Duration, Effect, Fiber} from 'effect'
import {useCallback, useEffect, useRef, useState} from 'react'

interface UsePasteOptions {
  timeout?: number
}

interface UsePasteReturn {
  paste: () => Promise<string | null>
  pastedText: string | null
  isPasting: boolean
  pasted: boolean
  error: Error | null
}

class ClipboardError extends Error {
  constructor(message = 'Failed to read from clipboard') {
    super(message)
    this.name = 'ClipboardError'
  }
}

const readClipboard = Effect.tryPromise({
  try: () => navigator.clipboard.readText(),
  catch: (cause) => (cause instanceof Error ? cause : new ClipboardError()),
})

const makeResetEffect = (timeout: number, onReset: VoidFunction) =>
  Effect.sleep(Duration.millis(timeout)).pipe(
    Effect.zipRight(Effect.sync(onReset)),
  )

export function usePaste({
  timeout = 2000,
}: UsePasteOptions = {}): UsePasteReturn {
  const [pastedText, setPastedText] = useState<string | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pasted, setPasted] = useState(false)

  const resetFiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null)

  const interruptReset = useCallback(() => {
    const fiber = resetFiberRef.current
    resetFiberRef.current = null

    if (fiber) {
      void Effect.runPromise(Fiber.interrupt(fiber))
    }
  }, [])

  const scheduleReset = useCallback(() => {
    interruptReset()

    resetFiberRef.current = Effect.runFork(
      makeResetEffect(timeout, () => {
        setPasted(false)
        resetFiberRef.current = null
      }),
    )
  }, [interruptReset, timeout])

  const paste = useCallback(async (): Promise<string | null> => {
    setIsPasting(true)
    setError(null)

    const program = readClipboard.pipe(
      Effect.tap((text) =>
        Effect.sync(() => {
          setPastedText(text)
          setPasted(true)
          scheduleReset()
        }),
      ),
      Effect.catchAll((err) =>
        Effect.sync(() => {
          const nextError = err instanceof Error ? err : new ClipboardError()
          setError(nextError)
          console.error('Failed to paste:', nextError)
          return null
        }),
      ),
      Effect.ensuring(Effect.sync(() => setIsPasting(false))),
    )

    return Effect.runPromise(program)
  }, [scheduleReset])

  useEffect(() => {
    return () => {
      interruptReset()
    }
  }, [interruptReset])

  return {paste, pastedText, isPasting, pasted, error}
}
