'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number // in seconds
  audioBlob: Blob | null
  audioUrl: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const isPausedRef = useRef<boolean>(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      streamRef.current = stream

      // Use the best available audio format
      const options: MediaRecorderOptions = {}
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options.mimeType = 'audio/ogg'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4'
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setIsRecording(false)
        setIsPaused(false)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred')
        console.error('MediaRecorder error:', event)
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setIsPaused(false)
      isPausedRef.current = false
      startTimeRef.current = Date.now() - pausedTimeRef.current
      pausedTimeRef.current = 0

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          setRecordingTime(
            Math.floor((Date.now() - startTimeRef.current) / 1000),
          )
        }
      }, 100)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please check permissions.',
      )
      console.error('Error starting recording:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      isPausedRef.current = true
      pausedTimeRef.current = Date.now() - startTimeRef.current
    }
  }, [isRecording, isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      isPausedRef.current = false
      startTimeRef.current = Date.now() - pausedTimeRef.current
      pausedTimeRef.current = 0
    }
  }, [isRecording, isPaused])

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setIsRecording(false)
    setIsPaused(false)
    isPausedRef.current = false
    setRecordingTime(0)
    setAudioBlob(null)
    setAudioUrl(null)
    audioChunksRef.current = []
    startTimeRef.current = 0
    pausedTimeRef.current = 0
  }, [isRecording, audioUrl])

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  }
}

