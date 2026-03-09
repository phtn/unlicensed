'use client'

import {CtaSection} from '@/components/main/cta-section'
import {NewFooter} from '@/components/main/new-footer'
import {FireManifesto} from './fire-manifesto'
import {Principles} from './principles'
import {QuickLinks} from './quick-links'

const YOUTUBE_VIDEO_ID = 'pwuFTsvJL34'

export const Content = () => {
  return (
    <main className='relative overflow-x-hidden bg-background pt-16 text-foreground md:pt-24'>
      <Principles />
      <FireManifesto />
      <section className='px-4 pb-6 sm:px-6 md:pb-10'>
        <div className='mx-auto max-w-7xl overflow-hidden rounded-xs border border-foreground/10 bg-black'>
          <div className='aspect-video w-full'>
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              title='Rapid Fire YouTube video'
              className='h-full w-full'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              referrerPolicy='strict-origin-when-cross-origin'
              allowFullScreen
            />
          </div>
        </div>
      </section>
      <CtaSection />
      <QuickLinks />
      <div className='flex-1 h-64' />
      <NewFooter />
    </main>
  )
}

/*
const STATS = [
  {
    value: 'Fast',
    label: 'Same-day delivery focus across the local store experience',
  },
  {
    value: 'Curated',
    label: 'Only menu items that fit the quality bar make the cut',
  },
  {
    value: 'Flexible',
    label: 'Mix-and-match bundles built for real shopping habits',
  },
]
*/
// const Comps = () => {
//   return (
//     <>
//       <section className='hidden relative isolate border-b border-foreground/10 px-3 pb-14 pt-8 sm:px-6 md:pb-20 md:pt-12'>
//         <div className='absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-brand/10 via-terpenes/8 to-transparent' />
//         <div className='absolute -right-20 top-10 -z-10 h-56 w-56 rounded-full bg-brand/12 blur-3xl' />
//         <div className='absolute -left-16 top-32 -z-10 h-48 w-48 rounded-full bg-terpenes/12 blur-3xl' />

//         <div className='mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end'>
//           <div className='space-y-6'>
//             <div className='inline-flex rounded-full border border-foreground/15 bg-foreground/5 px-4 py-1.5 font-polysans text-xs font-semibold uppercase tracking-[0.35em]'>
//               About Rapid Fire
//             </div>
//             <ViewTransition>
//               <h1 className='max-w-[11ch] font-bone text-6xl leading-none tracking-tight sm:text-7xl md:text-8xl'>
//                 Built for fast minds.
//               </h1>
//             </ViewTransition>
//             <p className='max-w-2xl font-polysans text-base leading-7 text-foreground/72 md:text-lg'>
//               Rapid Fire is a cannabis storefront shaped around speed, clarity,
//               and better repeat shopping. The goal is simple: make it easier to
//               find quality product, build smarter bundles, and check out without
//               digging through clutter.
//             </p>
//             <div className='flex flex-wrap gap-3 pt-2'>
//               <Button
//                 as={Link}
//                 href='/lobby'
//                 radius='full'
//                 className='h-12 bg-foreground px-6 font-polysans text-sm font-semibold uppercase tracking-[0.18em] text-background'>
//                 Shop the store
//               </Button>
//               <Button
//                 as={Link}
//                 href='/lobby/deals'
//                 radius='full'
//                 variant='bordered'
//                 className='h-12 border-foreground/20 bg-transparent px-6 font-polysans text-sm font-semibold uppercase tracking-[0.18em]'>
//                 Explore deals
//               </Button>
//             </div>
//           </div>

//           <div className='relative overflow-hidden rounded-[2rem] border border-foreground/15 bg-linear-to-br from-slate-200 via-background to-background p-6 dark:from-dark-table/80 dark:via-background dark:to-background md:p-8'>
//             <div className="absolute inset-0 bg-[url('/svg/noise.svg')] opacity-10 pointer-events-none" />
//             <div className='relative space-y-8'>
//               <div className='space-y-2'>
//                 <p className='font-clash text-sm uppercase tracking-[0.3em] text-foreground/55'>
//                   What we optimize for
//                 </p>
//                 <p className='max-w-md font-polysans text-sm leading-6 text-foreground/72 md:text-base'>
//                   Better product discovery, better bundles, and fewer dead ends
//                   between browsing and checkout.
//                 </p>
//               </div>
//               <div className='grid gap-3'>
//                 {STATS.map((item) => (
//                   <div
//                     key={item.label}
//                     className='rounded-[1.5rem] border border-foreground/10 bg-background/80 p-4 backdrop-blur-sm dark:bg-black/20'>
//                     <div className='font-clash text-2xl font-semibold tracking-tight'>
//                       {item.value}
//                     </div>
//                     <p className='mt-1 max-w-sm font-polysans text-sm leading-6 text-foreground/68'>
//                       {item.label}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className='hidden px-3 py-14 sm:px-6 md:py-20'>
//         <div className='mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
//           <div className='rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] p-6 md:p-8'>
//             <p className='font-clash text-sm uppercase tracking-[0.3em] text-foreground/55'>
//               The approach
//             </p>
//             <h2 className='mt-4 max-w-[14ch] font-polysans text-3xl font-semibold tracking-tight md:text-5xl'>
//               Digital-first retail with less drag.
//             </h2>
//           </div>
//           <div className='grid gap-4 md:grid-cols-3'>
//             {PRINCIPLES.map((principle) => (
//               <article
//                 key={principle.title}
//                 className='rounded-[2rem] border border-foreground/10 bg-linear-to-b from-background to-foreground/[0.03] p-6'>
//                 <p className='font-clash text-xs uppercase tracking-[0.28em] text-brand'>
//                   {principle.eyebrow}
//                 </p>
//                 <h3 className='mt-4 font-polysans text-xl font-semibold tracking-tight'>
//                   {principle.title}
//                 </h3>
//                 <p className='mt-3 font-polysans text-sm leading-6 text-foreground/68'>
//                   {principle.body}
//                 </p>
//               </article>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className='hidden px-3 pb-20 sm:px-6'>
//         <div className='mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] px-6 py-10 text-center md:px-10'>
//           <p className='font-clash text-sm uppercase tracking-[0.3em] text-foreground/55'>
//             Next move
//           </p>
//           <h2 className='mt-4 max-w-[14ch] font-polysans text-3xl font-semibold tracking-tight md:text-5xl'>
//             Browse the menu, build a bundle, and see how the store is meant to
//             feel.
//           </h2>
//           <div className='mt-8 flex flex-wrap justify-center gap-3'>
//             <Button
//               as={Link}
//               href='/lobby'
//               radius='full'
//               className='h-12 bg-brand px-6 font-polysans text-sm font-semibold uppercase tracking-[0.18em] text-white'>
//               Start shopping
//             </Button>
//             <Button
//               as={Link}
//               href='/lobby/deals'
//               radius='full'
//               variant='light'
//               className='h-12 px-6 font-polysans text-sm font-semibold uppercase tracking-[0.18em] text-foreground'>
//               Go to bundles
//             </Button>
//           </div>
//         </div>
//       </section>
//     </>
//   )
// }
