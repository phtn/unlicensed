import {Content} from './content'

export default async function Page() {
  return (
    <div className='mt-8 md:mt-10 pb-10'>
      <div className='px-4 sm:px-6 lg:px-6 mb-6'>
        <h1 className='text-2xl sm:text-3xl font-polysans font-semibold tracking-tight'>
          Orders
        </h1>
        <p className='text-sm text-default-500'>
          Search by order number, date, amount, or date range.
        </p>
      </div>
      <Content />
    </div>
  )
}
