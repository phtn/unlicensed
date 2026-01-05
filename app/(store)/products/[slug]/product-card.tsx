'use client'

type ProductCardProps = {
  onAddToCart: VoidFunction
}

export default function ProductCard({onAddToCart}: ProductCardProps) {
  return (
    <div className='bg-neutral-800 rounded-xl p-6 w-96 shadow-2xl'>
      {/* Product Image */}
      <div className='bg-neutral-700 rounded-lg w-24 h-24 flex items-center justify-center text-4xl mb-4'>
        ☕
      </div>

      {/* Badge */}
      <div className='inline-block bg-neutral-900 text-neutral-300 text-xs font-semibold px-3 py-1 rounded-full mb-3'>
        NEW ARRIVAL
      </div>

      {/* Title */}
      <h2 className='text-xl font-bold mb-1'>Nitro Black Coffee</h2>

      {/* Description */}
      <p className='text-neutral-400 text-sm mb-4'>
        COLD BREW • NITROGEN INFUSED
      </p>

      {/* Price Section */}
      <div className='flex items-center gap-3 mb-4'>
        <span className='text-2xl font-bold'>$23</span>
        <span className='text-neutral-500 line-through'>$30</span>
        <span className='bg-red-600 text-white text-xs font-bold px-2 py-1 rounded'>
          SAVE 23%
        </span>
      </div>

      {/* Add to Cart Button */}
      <button
        type='button'
        onClick={onAddToCart}
        className='w-full bg-white text-neutral-900 font-bold py-3 rounded-lg hover:bg-neutral-100 transition-colors'>
        ADD TO CART →
      </button>
    </div>
  )
}
