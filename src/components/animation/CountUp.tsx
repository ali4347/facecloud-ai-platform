import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
  className?: string
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export function CountUp({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const prefersReduced = useReducedMotion()
  const [display, setDisplay] = useState('0')
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    if (prefersReduced) {
      setDisplay(end.toFixed(decimals))
      return
    }

    const startTime = performance.now()
    const durationMs = duration * 1000

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutQuart(progress)
      const current = easedProgress * end

      setDisplay(current.toFixed(decimals))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [isInView, end, duration, decimals, prefersReduced])

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
