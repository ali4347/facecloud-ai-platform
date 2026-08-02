import { useState, useEffect, useRef } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

interface ScrambleTextProps {
  text: string
  className?: string
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_=<>{}[[]/-#@+*%'

export function ScrambleText({ text, className }: ScrambleTextProps) {
  const [displayedText, setDisplayedText] = useState(text)
  const containerRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) {
      setDisplayedText(text)
      return
    }

    if (!isInView) return

    let isMounted = true
    let frame = 0
    const durationFrames = 35 // Runs for approx 700ms at ~50fps
    const totalLength = text.length

    // Generate initial randomized string matching character length and spaces
    const getScrambledString = () =>
      text
        .split('')
        .map(char => {
          if (char === ' ') return ' '
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

    setDisplayedText(getScrambledString())

    const interval = setInterval(() => {
      if (!isMounted) return

      frame++
      const progress = frame / durationFrames

      if (progress >= 1) {
        setDisplayedText(text)
        clearInterval(interval)
        return
      }

      // Number of characters resolved from left to right
      const resolvedCount = Math.floor(progress * totalLength)
      
      const nextText = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          if (index < resolvedCount) {
            return char
          }
          // Scramble characters that are not yet resolved
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplayedText(nextText)
    }, 20)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isInView, text, prefersReduced])

  return (
    <span ref={containerRef} className={className}>
      {displayedText}
    </span>
  )
}
