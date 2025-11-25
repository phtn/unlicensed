interface Props {
  title: string
  effectiveDate: string
  lastUpdated: string
}

export const TitleHeader = ({title, effectiveDate, lastUpdated}: Props) => (
  <div className='flex items-center justify-between w-full h-36'>
    <h1 className='text-3xl md:text-4xl capitalize font-bold font-figtree text-foreground tracking-tighter'>
      {title}
    </h1>
    <div className='font-figtree text-right text-sm'>
      <div className='hidden'>
        <span className='font-semibold mr-2'>Effective Date:</span>{' '}
        {effectiveDate}
      </div>
      <div className=' md:max-w-full max-w-[13ch] md:flex'>
        <p className='font-semibold md:mr-2'>Last Updated:</p>
        <p>{lastUpdated}</p>
      </div>
    </div>
  </div>
)

export const Headline = () => (
  <div className='font-figtree w-full flex items-center justify-center h-96 leading-relaxed md:my-4 my-16'>
    <div className='max-w-3xl p-6 md:p-8 rounded-4xl border-3 border-indigo-300 bg-indigo-200/15 text-justify'>
      {`Welcome to Rapid Fire! Also known as "rapidfire.com", ("we," "our," "us"). By accessing or using our web application ("App") or any of our services, you agree to comply with and be bound by these Terms of Use. These terms govern your use of our App and services, including any content, features, and functionality offered. If you do not agree with these terms, do not use our app and website, nor purchase any products or services offered on our site. We are committed to providing a safe and enjoyable experience for all users. Please read these Terms of Use carefully to understand your rights and responsibilities when using our App.`}
    </div>
  </div>
)
