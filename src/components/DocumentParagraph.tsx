import type { Paragraph } from '../types/review'

interface DocumentParagraphProps {
  paragraph: Paragraph
}

export function DocumentParagraph({ paragraph }: DocumentParagraphProps) {
  return (
    <div className="paragraph" id={paragraph.id}>
      <span className="paragraph-number" aria-hidden={paragraph.number ? undefined : true}>
        {paragraph.number}
      </span>
      <p className="paragraph-text">{paragraph.text}</p>
    </div>
  )
}
