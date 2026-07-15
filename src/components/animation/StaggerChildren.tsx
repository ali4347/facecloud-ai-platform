import { motion, useReducedMotion } from 'framer-motion'

interface StaggerChildrenProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
  once?: boolean
}

const containerVariants = (stagger: number, reduced: boolean) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduced ? 0 : stagger,
    },
  },
})

const itemVariants = (reduced: boolean) => ({
  hidden: {
    opacity: 0,
    ...(reduced ? {} : { y: 20 }),
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reduced ? 0.2 : 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
})

export function StaggerChildren({
  children,
  staggerDelay = 0.08,
  className,
  once = true,
}: StaggerChildrenProps) {
  const prefersReduced = useReducedMotion()
  const reduced = !!prefersReduced

  return (
    <motion.div
      variants={containerVariants(staggerDelay, reduced)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Wrap each child in this to inherit stagger timing from StaggerChildren */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div variants={itemVariants(!!prefersReduced)} className={className}>
      {children}
    </motion.div>
  )
}
