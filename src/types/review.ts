export interface Party {
  role: string
  name: string
}

export interface Paragraph {
  id: string
  number: string | null
  text: string
}

export interface Section {
  id: string
  number: string | null
  heading: string
  paragraphs: Paragraph[]
}

export interface Contract {
  id: string
  title: string
  effectiveDate: string
  parties: Party[]
  sections: Section[]
}
