import {Icon} from '@/lib/icons'
import React, {useState} from 'react'
import * as Tone from 'tone'

interface SoundState {
  name: string
  description: string
  color: string
}

const ChatSoundsDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null)

  const soundStates: SoundState[] = [
    {
      name: 'Message Sent',
      description: 'Quick upward swoosh - confirms your message was sent',
      color: 'bg-green-500',
    },
    {
      name: 'Message Received',
      description: 'Gentle notification tone - someone replied to you',
      color: 'bg-blue-500',
    },
    {
      name: 'Typing Indicator',
      description: 'Subtle bubble sound - someone is typing',
      color: 'bg-purple-500',
    },
    {
      name: 'Error',
      description: 'Low descending tone - message failed to send',
      color: 'bg-red-500',
    },
    {
      name: 'New Connection',
      description: 'Pleasant chime - someone joined the chat',
      color: 'bg-yellow-500',
    },
    {
      name: 'Mention',
      description: 'Attention-grabbing beep - you were mentioned',
      color: 'bg-orange-500',
    },
  ]

  const playMessageSent = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'sine'},
      envelope: {attack: 0.01, decay: 0.1, sustain: 0, release: 0.1},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('C5', '0.08', now)
    synth.triggerAttackRelease('E5', '0.08', now + 0.08)
  }

  const playMessageReceived = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'triangle'},
      envelope: {attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.3},
    }).toDestination()

    synth.triggerAttackRelease('A4', '0.3')
  }

  const playTypingIndicator = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'sine'},
      envelope: {attack: 0.005, decay: 0.05, sustain: 0, release: 0.05},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('G5', '0.03', now)
    synth.triggerAttackRelease('G5', '0.03', now + 0.15)
    synth.triggerAttackRelease('G5', '0.03', now + 0.3)
  }

  const playError = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'square'},
      envelope: {attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('F3', '0.15', now)
    synth.triggerAttackRelease('D3', '0.2', now + 0.1)
  }

  const playNewConnection = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'sine'},
      envelope: {attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.3},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('C5', '0.2', now)
    synth.triggerAttackRelease('E5', '0.2', now + 0.1)
    synth.triggerAttackRelease('G5', '0.3', now + 0.2)
  }

  const playMention = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'square'},
      envelope: {attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('D5', '0.1', now)
    synth.triggerAttackRelease('D5', '0.1', now + 0.15)
  }

  const playSoundFunctions: Record<string, () => Promise<void>> = {
    'Message Sent': playMessageSent,
    'Message Received': playMessageReceived,
    'Typing Indicator': playTypingIndicator,
    Error: playError,
    'New Connection': playNewConnection,
    Mention: playMention,
  }

  const playSound = async (soundName: string): Promise<void> => {
    setIsPlaying(soundName)
    const playFunction = playSoundFunctions[soundName]
    if (playFunction) {
      await playFunction()
    }
    setTimeout(() => setIsPlaying(null), 600)
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-white mb-3'>
            Chat Message Sounds
          </h1>
          <p className='text-slate-300 text-lg'>
            Click to hear different notification sounds for chat states
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {soundStates.map((state: SoundState) => (
            <button
              key={state.name}
              onClick={() => playSound(state.name)}
              disabled={isPlaying !== null}
              className={`${state.color} bg-opacity-10 border-2 ${state.color.replace('bg-', 'border-')}
                rounded-xl p-6 text-left transition-all duration-200
                hover:bg-opacity-20 hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                relative overflow-hidden group`}>
              <div className='flex items-start justify-between mb-3'>
                <h3 className='text-xl font-semibold text-white'>
                  {state.name}
                </h3>
                <div
                  className={`${state.color} bg-opacity-20 rounded-full p-2
                  group-hover:bg-opacity-30 transition-all`}>
                  <Icon
                    name='play-solid'
                    className={`w-5 h-5 ${state.color.replace('bg-', 'text-')}
                    ${isPlaying === state.name ? 'animate-pulse' : ''}`}
                  />
                </div>
              </div>
              <p className='text-slate-300 text-sm'>{state.description}</p>
              {isPlaying === state.name && (
                <div className='absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30'>
                  <div className='h-full bg-white bg-opacity-60 animate-pulse'></div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className='mt-12 bg-slate-800 bg-opacity-50 rounded-xl p-6 border border-slate-700'>
          <h2 className='text-xl font-semibold text-white mb-3'>
            Sound Design Tips
          </h2>
          <ul className='text-slate-300 space-y-2'>
            <li>
              • <strong className='text-white'>Sent:</strong> Upward pitch =
              positive action
            </li>
            <li>
              • <strong className='text-white'>Received:</strong> Gentle tone =
              non-intrusive notification
            </li>
            <li>
              • <strong className='text-white'>Typing:</strong> Rapid pulses =
              activity indicator
            </li>
            <li>
              • <strong className='text-white'>Error:</strong> Descending pitch
              = something went wrong
            </li>
            <li>
              • <strong className='text-white'>Connection:</strong> Ascending
              chime = welcoming
            </li>
            <li>
              • <strong className='text-white'>Mention:</strong> Double beep =
              requires attention
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ChatSoundsDemo
