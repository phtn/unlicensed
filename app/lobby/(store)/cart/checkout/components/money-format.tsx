import {AnimatedNumber} from '@/components/ui/animated-number'
import {formatDecimalUSD} from '@/utils/currency'

interface MoneyFormatProps {
  value: number
  precision?: number
}

export const MoneyFormat = ({value, precision = 1}: MoneyFormatProps) => {
  return (
    <span className='font-okxs font-medium'>
      <AnimatedNumber
        value={value}
        mass={0.1}
        damping={180}
        stiffness={240}
        precision={precision}
        format={formatDecimalUSD}
      />
    </span>
  )
}
