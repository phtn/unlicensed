'use client'

import type {ReactNode} from 'react'

export const Table = ({children, className}: {children: ReactNode; className?: string}) => {
  return <table className={className}>{children}</table>
}

export const TableHeader = ({children, className}: {children: ReactNode; className?: string}) => {
  return <thead className={className}>{children}</thead>
}

export const TableBody = ({children}: {children: ReactNode}) => {
  return <tbody>{children}</tbody>
}

export const TableRow = ({
  children,
  className,
  onClick,
  ...props
}: {
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void
  [key: string]: unknown
}) => {
  return (
    <tr className={className} onClick={onClick} {...props}>
      {children}
    </tr>
  )
}

export const TableHead = ({children, className, style}: {children: ReactNode; className?: string; style?: React.CSSProperties}) => {
  return <th className={className} style={style}>{children}</th>
}

export const TableCell = ({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
  [key: string]: unknown
}) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}

