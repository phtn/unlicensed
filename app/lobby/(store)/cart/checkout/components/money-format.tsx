import {AnimatedNumber} from '@/components/ui/animated-number'

export const MoneyFormat = ({value}: {value: number}) => {
  return (
    <span className='font-okxs font-medium'>
      $
      <AnimatedNumber
        value={value}
        format={(v) => v.toFixed(2)}
        precision={1}
        stiffness={160}
        mass={0.2}
        damping={160}
      />
    </span>
  )
}
