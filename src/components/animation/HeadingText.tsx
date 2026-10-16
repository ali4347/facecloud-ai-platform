import { Fragment } from 'react'
import { ScrambleText } from './ScrambleText'

/**
 * Heading text with the landing page's treatment: the letters scramble into place
 * when the heading scrolls into view, and a phrase wrapped in [square brackets]
 * sits on an orange block. A "\n" starts a new line.
 *
 * Keep a highlighted phrase short (one or two words). The block does not wrap, so a
 * long one would overflow a phone screen.
 *
 * The scrambling letters are hidden from screen readers, which get the plain
 * sentence instead — otherwise they would read the random characters.
 */
export function HeadingText({ text }: { text: string }) {
  const plain = text.replace(/[[\]]/g, '').replace(/\n/g, ' ')
  const lines = text.split('\n')

  return (
    <>
      <span className="sr-only">{plain}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {line.split(/(\[[^\]]*\])/).filter(Boolean).map((part, pi) =>
              part.startsWith('[') ? (
                <span key={pi} className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold mx-1">
                  <ScrambleText text={part.slice(1, -1)} />
                </span>
              ) : (
                <ScrambleText key={pi} text={part} />
              )
            )}
          </Fragment>
        ))}
      </span>
    </>
  )
}
