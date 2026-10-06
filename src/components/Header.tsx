import { FileText } from 'lucide-react'

interface HeaderProps {
  documentTitle?: string
}

export function Header({ documentTitle }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          <FileText size={18} />
        </span>
        <span className="brand-name">Contract Review</span>
      </div>
      {documentTitle && <span className="header-document">{documentTitle}</span>}
    </header>
  )
}
