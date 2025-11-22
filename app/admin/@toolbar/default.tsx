'use client'

interface Props {
  children?: React.ReactNode
}

const Toolbar = ({children}: Props) => {
  return (
    <div className='flex items-center justify-between gap-5 md:gap-3 lg:gap-6 h-10 md:w-96 px-4 md:px-2 lg:px-5'>
      {children}
    </div>
  )
}
const ToolbarSlot = () => {
  return <Toolbar />
}

export default ToolbarSlot
