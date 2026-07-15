import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right'

interface RevealOnScrollProps {
  children: React.ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,   y: 24 },
  down:  { x: 0,   y: -24 },
  left:  { x: 24,  y: 0 },
  right: { x: -24, y: 0 },
}

export function RevealOnScroll({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  className,
  once = true,
}: RevealOnScrollProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)

  const offset = OFFSETS[direction]

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...(prefersReduced ? {} : { x: offset.x, y: offset.y }),
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once, amount: 0.15 }}
      transition={{
        duration: prefersReduced ? 0.2 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
