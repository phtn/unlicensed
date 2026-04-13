import {cn} from '@/lib/utils'
import {motion, type Transition} from 'motion/react'

type CrossOutProps = {
  active?: boolean
  className?: string
  pathClassName?: string
}

const getPathAnimate = (active: boolean) => ({
  pathLength: active ? 1 : 0,
  opacity: active ? 1 : 0,
})

const getPathTransition = (active: boolean): Transition => ({
  pathLength: {duration: 0.7, ease: 'easeInOut'},
  opacity: {
    duration: 0.12,
    delay: active ? 0 : 0.58,
  },
})

export const CrossOut = ({
  active = true,
  className,
  pathClassName,
}: CrossOutProps) => {
  return (
    <motion.svg
      aria-hidden='true'
      width='36'
      height='36'
      viewBox='0 0 36 36'
      preserveAspectRatio='none'
      className={cn(
        'pointer-events-none absolute top-1/2 z-20 h-7 w-full -translate-y-1/2 -inset-x-0.5',
        className,
      )}>
      <motion.path
        d='M3.83105 22.7444c.01074 0 .02147 0 .14066-.0148.11919-.0147 3.62915-.7001 5.95173-1.1631C19.1592 19.7256 27.93 17.7827 33.5 16.5'
        // d='M3.15527 21.5142c.06473-.0066.12945-.0132 2.14272-.6923 2.01328-.6791 5.97311-2.0305 8.12241-2.745 2.1494-.7144 2.3682-.7511 2.318-.5937-.0501.1574-.3758.5098-1.1007 1.1692-.7248.6594-1.839 1.615-2.4756 2.1762-.9949.8773-1.067 1.1783-1.0687 1.2781-.0008.0434.0675.0589.3613.0262.2938-.0328.8286-.1176 4.1531-1.1932 3.3244-1.0757 9.4223-3.1397 12.6761-4.227 3.2538-1.0874 3.4788-1.1356 3.7617-1.1905'
        vectorEffect='non-scaling-stroke'
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeMiterlimit={10}
        fill='none'
        initial={{pathLength: 0, opacity: 0}}
        animate={getPathAnimate(active)}
        transition={getPathTransition(active)}
        className={cn(
          'stroke-neutral-900 dark:stroke-neutral-100',
          pathClassName,
        )}
      />
    </motion.svg>
  )
}

/*

<svg width="31" height="6" viewBox="0 0 31 6" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.5 3.52873C0.56506 3.52873 0.630121 3.52873 2.70192 3.05748C4.77372 2.58624 8.8503 1.64375 11.061 1.15111C13.2718 0.658466 13.4932 0.644237 13.4273 0.795699C13.3615 0.947161 13.0017 1.26475 12.2136 1.84714C11.4256 2.42953 10.2202 3.2671 9.5299 3.76087C8.45106 4.53264 8.3488 4.82476 8.33697 4.9239C8.33183 4.96691 8.3982 4.98933 8.6938 4.98658C8.9894 4.98383 9.53006 4.95374 12.9465 4.22105C16.363 3.48837 22.6389 2.054 25.9862 1.30251C29.3336 0.551026 29.5623 0.525894 29.8493 0.5" stroke="white" stroke-linecap="round"/>
</svg>

*/
