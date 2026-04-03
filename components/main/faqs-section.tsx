// import {
//   AccordionHeader,
//   AccordionItem,
//   AccordionPanel,
//   AccordionRoot,
//   AccordionTrigger,
// } from './ui/accordion'

import {Accordion, AccordionItem} from '@/lib/heroui'

const faqs = [
  {
    value: 'about',
    question: 'About RapidFire',
    answer:
      'RapidFire is a cannabis online store that accepts crypto payments.',
  },
  {
    value: 'deals',
    question: 'What are the bundled deals?',
    answer: '',
  },
  {
    value: 'rewards',
    question: 'How do I earn rewards?',
    answer: 'Rewards are earned by purchases of our eligible products.',
  },
  {
    value: 'payments',
    question: 'How do I make payments?',
    answer:
      'We accept credit card, debit card, Google Pay, Apple Pay, Crypto payments, and CashAppl.',
  },
] as const

export function FaqSection() {
  return (
    <div className='mx-auto w-full max-w-7xl space-y-7 px-4 pt-16'>
      <div className='space-y-2'>
        <h2
          id='faqs-heading'
          className='text-3xl font-clash font-semibold text-neutral-900 dark:text-white sm:text-3xl'>
          FAQs
        </h2>
        <p className='max-w-6xl font-clash text-muted-foreground'>
          Good to know.
        </p>
      </div>
      <Accordion className='-space-y-px w-full rounded-xs bg-sidebar dark:bg-dark-table'>
        {faqs.map((item) => (
          <AccordionItem
            className='relative'
            key={item.value}
            value={item.value}
            title={
              <span className='font-semibold text-lg px-4'>
                {item.question}
              </span>
            }>
            <span className='text-balance font-okxs p-4'>{item.answer}</span>
          </AccordionItem>
        ))}
      </Accordion>
      <div className='h-12' />
    </div>
  )
}
