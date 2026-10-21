import { Fragment } from 'react';

interface MotionTitleProps {
  text: string;
  as?: 'h1' | 'h2';
  className?: string;
  breakAfterFirstWord?: boolean;
}

/** Real text remains in the heading's accessible name while letters can be staged independently. */
export function MotionTitle({ text, as: Tag = 'h1', className, breakAfterFirstWord = false }: MotionTitleProps) {
  const words = text.split(' ');
  return <Tag className={className} aria-label={text} data-motion-title>
    {words.map((word, wordIndex) => <Fragment key={`${word}-${wordIndex}`}>
      <span className="motion-word" aria-hidden="true">
        {Array.from(word).map((letter, letterIndex) =>
          <span className="motion-letter" data-motion-letter key={letterIndex}>{letter}</span>)}
      </span>
      {wordIndex < words.length - 1 ? breakAfterFirstWord && wordIndex === 0 ? <br /> : ' ' : null}
    </Fragment>)}
  </Tag>;
}
