import {Callout, DotDiv} from '@/components/ui/callout'

export const DevRedirect = () => {
  return (
    <Callout
      title={
        <h1 className='md:text-xl font-normal font-polysans space-x-1 md:space-x-4'>
          <span>Development in-progress</span>
          <DotDiv />
          <span>Redirect enabled</span>
        </h1>
      }
      description='Checkout route protected. Please check back later.'
      icon='code'
      type='debug'
    />
  )
}
