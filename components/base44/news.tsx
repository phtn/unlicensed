import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {Nav} from './nav'

export const Shop = () => {
  return (
    <div className='min-h-screen bg-[#F5F1ED]'>
      {/* Header */}

      <Nav>News</Nav>

      {/* Hero Section */}
      <section className='pt-32 pb-12 px-6'>
        <div className='max-w-5xl mx-auto text-center'>
          {/* Rating */}
          <div className='flex items-center justify-center gap-1 mb-3'>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={'re-up.ph'}
                className='w-5 h-5 fill-gray-400 text-gray-400'
              />
            ))}
          </div>

          <p className='text-sm text-gray-600 mb-12'>
            Helped over 100+ businesses
          </p>

          <h1 className='text-5xl md:text-6xl lg:text-7xl font-serif leading-tight mb-8'>
            From AI confusion to clarity.
          </h1>

          <p className='text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed'>
            We identify where AI saves time and money in your business, then
            build and implement the systems that make it happen.
          </p>

          <div className='flex items-center justify-center gap-4'>
            <Button className='bg-[#2C1810] hover:bg-[#3d2418] text-white rounded-full px-6 py-3'>
              Book a free call
            </Button>
            <button className='flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors'>
              <span>How we work</span>
              <Icon name='re-up.ph' className='w-4 h-4' />
            </button>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className='py-12 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='relative rounded-3xl overflow-hidden h-96 md:h-[500px]'>
            <div className='absolute inset-0 bg-linear-to-br from-orange-300 via-pink-400 to-blue-400'>
              {/* Flower blur effect */}
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96'>
                <div className='absolute inset-0 bg-linear-to-br from-orange-500 via-red-500 to-pink-500 rounded-full filter blur-3xl opacity-80'></div>
                <div className='absolute inset-0 bg-linear-to-tl from-yellow-400 via-orange-400 to-red-500 rounded-full filter blur-2xl opacity-60'></div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className='flex justify-end mt-8'>
            <button className='w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors'>
              <Icon name='re-up.ph' className='w-4 h-4' />
            </button>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className='py-20 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col md:flex-row items-center gap-12 md:gap-16'>
            <div className='text-sm text-gray-500 md:w-48 shrink-0'>
              Brands weve helped implement AI:
            </div>

            <div className='flex-1 flex flex-wrap items-center justify-center md:justify-start gap-12 md:gap-16'>
              {/* Logo 1 */}
              <div className='text-2xl text-gray-400 font-serif italic'>
                nice.
              </div>

              {/* Logo 2 */}
              <div
                className='text-2xl text-gray-400 font-script'
                style={{fontFamily: 'cursive'}}>
                Theo
              </div>

              {/* Logo 3 */}
              <div className='text-2xl text-gray-500 font-medium'>
                Amsterdam
              </div>

              {/* Logo 4 */}
              <div className='flex items-center gap-2'>
                <Icon name='re-up.ph' className='w-4 h-4' />
                <span className='text-xl text-gray-500 font-medium'>
                  Hamilton
                </span>
              </div>

              {/* Logo 5 */}
              <div className='text-2xl text-gray-500 font-bold tracking-wider'>
                CALIFORNIA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Spacing */}
      <div className='h-20'></div>
    </div>
  )
}
