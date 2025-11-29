import {Activity, ReactNode} from 'react'

interface HyperActivityProps {
  c: boolean
  children?: ReactNode
}

export const HyperActivity = ({c, children}: HyperActivityProps) => (
  <Activity mode={c ? 'visible' : 'hidden'}>{children}</Activity>
)
