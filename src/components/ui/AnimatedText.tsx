import { Fragment } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'

const TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
}

interface AnimatedTextProps {
  text: string
  /** A contiguous phrase inside `text` to render in the brand gradient. */
  highlight?: string
  as?: keyof typeof TAGS
  className?: string
  delay?: number
  /** Seconds between each word landing. */
  stagger?: number
}

// The slight blur on entry is what separates this from a plain fade — words
// resolve into focus as they settle rather than just appearing.
const WORD = {
  hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export const AnimatedText: FC<AnimatedTextProps> = ({
  text,
  highlight,
  as = 'span',
  className = '',
  delay = 0,
  stagger = 0.055,
}) => {
  const Tag = TAGS[as]
  const words = text.split(' ')
  const highlightWords = highlight ? highlight.split(' ') : []

  let highlightStart = -1
  if (highlightWords.length) {
    for (let i = 0; i + highlightWords.length <= words.length; i += 1) {
      if (highlightWords.every((word, j) => words[i + j] === word)) {
        highlightStart = i
        break
      }
    }
  }
  const isHighlighted = (index: number) =>
    highlightStart >= 0 && index >= highlightStart && index < highlightStart + highlightWords.length

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <motion.span
            variants={WORD}
            className={`inline-block ${
              isHighlighted(i) ? 'text-gradient animate-gradient-x bg-[length:200%_auto]' : ''
            }`}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}
