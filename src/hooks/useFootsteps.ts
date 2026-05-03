import { useRef } from 'react'

export function useFootsteps() {
  const ctxRef = useRef<AudioContext | null>(null)
  const lastStepRef = useRef(0)

  function getCtx(): AudioContext {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  function playStep() {
    const now = Date.now()
    if (now - lastStepRef.current < 270) return
    lastStepRef.current = now

    try {
      const ctx = getCtx()
      const rate = ctx.sampleRate
      const dur = 0.08 + Math.random() * 0.05

      // Decaying noise burst — stone thud with echo tail
      const buf = ctx.createBuffer(1, Math.floor(rate * dur), rate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / rate
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 42)
      }

      const src = ctx.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = 0.85 + Math.random() * 0.30

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 350 + Math.random() * 280

      const gain = ctx.createGain()
      gain.gain.value = 0.28 + Math.random() * 0.22

      src.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      src.start()
    } catch {
      // silently fail if AudioContext unavailable
    }
  }

  return { playStep }
}
