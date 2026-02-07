'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useCallback, useEffect, useRef, useState} from 'react'

interface AudioMessagePlayerProps {
  url: string
  fileName: string
  isCurrentUser?: boolean // Kept for backward compatibility, but not used
}

export function AudioMessagePlayer({url}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const hasUserInteractedRef = useRef(false)

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds === 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      // Capture duration if available
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
        setIsLoading(false)
      }
      // For webm files, duration might not be available until playback starts
      // Duration will be discovered naturally as audio plays or via durationchange event
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      // Capture duration if it becomes available during playback
      if (
        duration === 0 &&
        audio.duration &&
        isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        setDuration(audio.duration)
        setIsLoading(false)
      }
    }

    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
        setIsLoading(false)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleError = () => {
      setIsLoading(false)
    }

    const handleSeeked = () => {
      // Capture duration if it becomes available
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        if (duration === 0) {
          setDuration(audio.duration)
          setIsLoading(false)
        }
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      hasUserInteractedRef.current = true
      // Capture duration if available
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        if (duration === 0) {
          setDuration(audio.duration)
          setIsLoading(false)
        }
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('seeked', handleSeeked)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('seeked', handleSeeked)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [duration, isPlaying])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    // Mark that user has interacted
    hasUserInteractedRef.current = true

    if (isPlaying) {
      audio.pause()
    } else {
      // Don't set isPlaying optimistically - let the play event handler do it
      audio.play().catch((error) => {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      })
    }
  }, [isPlaying])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || !duration) return

      hasUserInteractedRef.current = true

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * duration

      audio.currentTime = newTime
      setCurrentTime(newTime)
    },
    [duration],
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className='flex items-center gap-3 p-3 rounded-2xl min-w-[220px] max-w-[300px] bg-indigo-500 shadow-md'>
      <audio ref={audioRef} src={url} preload='metadata' />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={cn(
          'shrink-0 size-10 rounded-full flex items-center justify-center transition-all active:scale-95',
          'bg-white/20 hover:bg-white/30 text-white',
          isLoading && 'opacity-50 cursor-not-allowed',
        )}>
        {isLoading ? (
          <div className='size-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
        ) : isPlaying ? (
          <Icon name='pause-solid' className='size-5' />
        ) : (
          <Icon name='play-solid' className='size-5 ml-0.5' />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className='flex-1 min-w-0'>
        {/* Progress Bar */}
        <div
          onClick={handleProgressClick}
          className='relative h-8 cursor-pointer rounded-md overflow-hidden bg-white/10'>
          {/* Waveform visual (static bars) */}
          <div className='absolute inset-0 flex items-center justify-around px-1'>
            {Array.from({length: 28}).map((_, i) => {
              // Create a pseudo-random height pattern for visual appeal
              const height =
                20 + Math.sin(i * 0.8) * 15 + Math.cos(i * 1.2) * 10
              const isActive = (i / 28) * 100 <= progress
              return (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-full transition-colors duration-150',
                    isActive ? 'bg-white' : 'bg-white/30',
                  )}
                  style={{height: `${height}%`}}
                />
              )
            })}
          </div>
        </div>

        {/* Time Display */}
        <div className='flex justify-between mt-1 px-0.5'>
          <span className='text-[10px] font-mono tabular-nums text-white/80'>
            {formatTime(currentTime)}
          </span>
          <span className='text-[10px] font-mono tabular-nums text-white/80'>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
