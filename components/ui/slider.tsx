import {Slider, SliderRootProps} from '@base-ui/react/slider'

interface EdgeSliderProps extends SliderRootProps {
  className?: string
}

export const EdgeSlider = ({className, ...props}: EdgeSliderProps) => {
  return (
    <Slider.Root
      thumbAlignment='edge'
      defaultValue={25}
      {...props}
      className={className}>
      <Slider.Control className='flex w-56 touch-none items-center py-3 select-none'>
        <Slider.Track className='h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none'>
          <Slider.Indicator className='rounded bg-gray-700 select-none' />
          <Slider.Thumb className='size-4 rounded-full bg-white outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800' />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  )
}
