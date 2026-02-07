import {useState} from 'react'
import * as Tone from 'tone'

export const useChatSFX = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null)

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
    sent: playMessageSent,
    received: playMessageReceived,
    typing: playTypingIndicator,
    error: playError,
    connect: playNewConnection,
    mention: playMention,
  }

  const playSound = async (soundName: string): Promise<void> => {
    setIsPlaying(soundName)
    const playFunction = playSoundFunctions[soundName]
    if (playFunction) {
      await playFunction()
    }
    setTimeout(() => setIsPlaying(null), 600)
  }

  const stopSound = async (): Promise<void> => {
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: {type: 'square'},
      envelope: {attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1},
    }).toDestination()

    const now = Tone.now()
    synth.triggerAttackRelease('C5', '0.2', now)
    synth.triggerAttackRelease('E5', '0.2', now + 0.1)
    synth.triggerAttackRelease('G5', '0.3', now + 0.2)
  }

  return {
    playSound,
    stopSound,
    isPlaying,
  }
}
