import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'

interface HeaderProps {
  documentTitle?: string
  children?: ReactNode
}

export function Header({ documentTitle, children }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          <FileText size={18} />
        </span>
        <span className="brand-name">Contract Review</span>
      </div>
      {documentTitle && <span className="header-document">{documentTitle}</span>}
      {children && <div className="header-end">{children}</div>}
    </header>
  )
}
