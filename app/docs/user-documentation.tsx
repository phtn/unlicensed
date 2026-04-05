import {Accordion, AccordionItem} from '@heroui/react'
import Link from 'next/link'

const HOW_TO_GUIDES = [
  {
    title: 'Redeem rewards',
    steps: [
      'Add products to your cart.',
      'Open your cart or move to checkout.',
      'Apply your available rewards balance like cash.',
    ],
  },
  {
    title: 'Use your first-order deal',
    steps: [
      'Build an order over $49.',
      'Enter code FIRE25 at checkout.',
      'Receive $25 off plus free shipping on that first order.',
    ],
  },
  {
    title: 'Pay with crypto',
    steps: [
      'Choose Crypto at checkout.',
      'Copy the wallet address shown in the payment window.',
      'Send the exact order total from your wallet.',
    ],
  },
  {
    title: 'Pay with CashApp',
    steps: [
      'Choose CashApp during checkout.',
      'Use the provided $Cashtag in CashApp.',
      'Send the full order total and wait for agent confirmation.',
    ],
  },
] as const

const DOC_SECTIONS = [
  {
    id: 'rewards',
    eyebrow: 'FAQ',
    title: 'Rewards Program',
    description: 'Cash back rules, redemption timing, and expiration policy.',
    items: [
      {
        question: 'How do rewards work?',
        answer: (
          <>
            <p>Earn cash back on every order based on your cart total:</p>
            <ul className='mt-3 space-y-1 text-sm text-white/72'>
              <li>1.5% cash back under $99</li>
              <li>2% cash back on $99+</li>
              <li>3% cash back on $149+</li>
              <li>5% cash back on $249+</li>
            </ul>
          </>
        ),
      },
      {
        question: 'How do I redeem rewards?',
        answer:
          'Spend your rewards like real money from inside your cart or at checkout.',
      },
      {
        question: 'When do cash back rewards appear in my account?',
        answer:
          'Your cash back balance gets updated after your shipment is delivered.',
      },
      {
        question: 'Do rewards expire?',
        answer: 'Rewards expire after 12 months of account inactivity.',
      },
      {
        question: 'Do I earn rewards on all products?',
        answer:
          'All retail products earn cash back rewards. Certain Mix & Match deals are excluded, and wholesale orders do not earn cash back rewards.',
      },
    ],
  },
  {
    id: 'shipping',
    eyebrow: 'Docs',
    title: 'Shipping Fees',
    description: 'Rates, timelines, and coverage details.',
    items: [
      {
        question: 'How much is delivery?',
        answer: (
          <>
            <p>We offer free shipping on orders over $149.</p>
            <ul className='mt-3 space-y-1 text-sm text-white/72'>
              <li>$3.99 on orders between $99 and $149</li>
              <li>$12.99 on orders under $99</li>
            </ul>
          </>
        ),
      },
      {
        question: 'Is there a minimum order?',
        answer: 'No minimum.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Shipping timelines are estimates and may vary by location and other factors. Delivery dates are not guaranteed. All orders ship out the following business day.',
      },
      {
        question: 'Where do you deliver?',
        answer: 'No limitations.',
      },
    ],
  },
  {
    id: 'payments',
    eyebrow: 'How-To',
    title: 'Payment',
    description: 'Accepted payment methods and what happens at checkout.',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: (
          <div className='space-y-4'>
            <div>
              <p className='font-medium text-white'>Debit/Credit</p>
              <p>
                At the payment window, enter your credit or debit card info and
                follow the instructions provided to process payment.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>Crypto</p>
              <p>
                Choose the Crypto option and a wallet address will be provided.
                Next, access your wallet and send the payment.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>CashApp</p>
              <p>
                Select CashApp at checkout. You will be provided a $Cashtag.
                Proceed to CashApp, enter the address, send the order total, and
                an agent will confirm once payment has processed.
              </p>
            </div>
          </div>
        ),
      },
      {
        question: 'When do I pay for my order?',
        answer: 'At checkout.',
      },
      {
        question: 'Is payment secure?',
        answer:
          'Payments are processed securely through trusted US-based payment providers. Your payment information is protected using industry-standard encryption.',
      },
    ],
  },
  {
    id: 'first-order',
    eyebrow: 'Promo',
    title: 'First Order Offer',
    description: 'The intro offer, code, and combination rules.',
    items: [
      {
        question: 'What is the first order deal?',
        answer: 'Receive $25 off and free shipping on your first order.',
      },
      {
        question: 'How do I redeem the first order offer?',
        answer: 'Use coupon code FIRE25 at checkout.',
      },
      {
        question: 'Are there restrictions?',
        answer: 'Your order must be over $49.',
      },
      {
        question: 'Can it be combined with other deals?',
        answer: 'Yes.',
      },
    ],
  },
  {
    id: 'deals',
    eyebrow: 'Reference',
    title: 'Deals & Promotions',
    description: 'Permanent mix-and-match structures and stacking rules.',
    items: [
      {
        question: 'How do deals work?',
        answer: (
          <div className='space-y-4'>
            <div>
              <p className='font-medium text-white'>
                Build Your Own Oz (Flower)
              </p>
              <p>
                Pick 8 different eighths or 4 different quarters from the same
                tier and pay the oz rate. Limit 2 per strain. The total reflects
                the average value of each selection.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>Mix and Match 4 Oz</p>
              <p>
                Pick 4 different ounces from the same tier. The total reflects
                the average value of each selection. Limit 1 per strain.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>
                3 x 1G Mix & Match (Extracts)
              </p>
              <p>
                Pick 3 different grams of house extracts within the same tier
                and the total reflects the average value of each selection.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>
                7 x 1G Mix & Match (Extracts)
              </p>
              <p>
                Pick 7 different grams of house extracts within the same tier
                and the total reflects the average value of each selection.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>
                5 x 1 Unit Mix & Match (Pre-Rolls & Edibles)
              </p>
              <p>
                Pick 5 edibles or 5 pre-rolls and the total reflects the 5-unit
                pricing.
              </p>
            </div>
            <div>
              <p className='font-medium text-white'>
                10 x 1 Unit Mix & Match (Pre-Rolls & Edibles)
              </p>
              <p>
                Pick 10 edibles or 10 pre-rolls and the total reflects the
                10-unit pricing.
              </p>
            </div>
          </div>
        ),
      },
      {
        question: 'Can deals be combined?',
        answer:
          'Coupons and cash back rewards can be applied to deals, but deals themselves are not stackable.',
      },
      {
        question: 'How often do deals change?',
        answer:
          'Not often. Deals are meant to be permanent. If something is not popular, it may be removed or replaced.',
      },
      {
        question: 'How do I find current deals?',
        answer: (
          <p>
            See current{' '}
            <Link
              href='/lobby/deals'
              className='font-medium text-brand transition-opacity hover:opacity-80'>
              Deals & Bundles
            </Link>
            .
          </p>
        ),
      },
    ],
  },
  {
    id: 'products',
    eyebrow: 'Support',
    title: 'Product Questions',
    description: 'Selection standards, freshness, and how to choose.',
    items: [
      {
        question: 'How do you select your products?',
        answer:
          'We are serious quality snobs. Every product on the menu is sourced from trusted farms and carefully vetted for genetics, terpene profile, potency, and freshness. If it is not exceptional, it does not make the cut.',
      },
      {
        question: 'Are your products lab tested?',
        answer:
          'All California products have been tested for quality, safety, and compliance.',
      },
      {
        question: 'How fresh is your cannabis?',
        answer:
          "Fresher than a baby's bottom. We work direct with farms, no brokers, and implement strict storage procedures. Flower stays in tightly controlled temperature and humidity conditions away from light and oxygen. Extracts stay refrigerated, and everything else is handled with the same level of care.",
      },
      {
        question: 'What if I am not happy with a product?',
        answer:
          'We guarantee satisfaction and stand by every item on the menu. If you are not satisfied with something, we will make it right.',
      },
      {
        question: 'How do I choose the right product?',
        answer:
          'Each category is broken into clear tiers and subcategories so the menu stays consistent. Flower follows strict tier boundaries, while extracts, vapes, and edibles are organized by source material and process. If you still want guidance, start a chat and an agent will help you make a confident choice.',
      },
    ],
  },
  {
    id: 'security',
    eyebrow: 'Policy',
    title: 'Safety & Encryption',
    description: 'Security expectations for checkout and account activity.',
    items: [
      {
        question: 'How is my payment information protected?',
        answer:
          'Payments are processed through trusted US-based providers and protected with industry-standard encryption.',
      },
      {
        question: 'When are rewards posted to my account?',
        answer:
          'Rewards are added after delivery, which helps keep account balances tied to completed shipments.',
      },
    ],
  },
] as const

export const UserDocumentation = () => {
  return (
    <section className='px-4 py-14 sm:px-6 md:py-20'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <div className='grid gap-4 lg:grid-cols-5 lg:gap-6'>
          <div className='rounded-xs border border-foreground/10 bg-foreground/3 p-5 sm:p-6 md:p-8 lg:col-span-3'>
            <p className='font-clash text-xs uppercase tracking-[0.24em] text-foreground/55 sm:text-sm sm:tracking-[0.3em]'>
              Help Center
            </p>
            <h2 className='mt-4 max-w-[12ch] font-bone text-3xl tracking-tight sm:max-w-[16ch] sm:text-5xl md:text-6xl'>
              FAQ
            </h2>
            <p className='mt-4 max-w-md font-polysans text-sm leading-6 text-foreground/68 md:text-base'>
              Find answers about our rewards program, payment methods, and
              deals, along with other common questions.
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1'>
            <article className='border border-foreground/10 bg-background p-4 sm:p-5'>
              <p className='font-clash text-xs uppercase tracking-[0.28em] text-brand'>
                Rewards
              </p>
              <p className='mt-3 font-clash text-3xl font-semibold tracking-tight'>
                5%
              </p>
              <p className='mt-2 text-sm leading-6 text-foreground/62'>
                Top cash back tier on carts of $249 and up.
              </p>
            </article>
            <article className='border border-foreground/10 bg-background p-4 sm:p-5'>
              <p className='font-clash text-xs uppercase tracking-[0.28em] text-brand'>
                Shipping
              </p>
              <p className='mt-3 font-clash text-3xl font-semibold tracking-tight'>
                $149+
              </p>
              <p className='mt-2 text-sm leading-6 text-foreground/62'>
                Orders above this threshold ship free.
              </p>
            </article>
            <article className='border border-foreground/10 bg-background p-4 sm:p-5'>
              <p className='font-clash text-xs uppercase tracking-[0.28em] text-brand'>
                First Order
              </p>
              <p className='mt-3 font-clash text-3xl font-semibold tracking-tight'>
                FIRE25
              </p>
              <p className='mt-2 text-sm leading-6 text-foreground/62'>
                Enter this code at checkout.
              </p>
              <p className='mt-2 text-sm leading-6 text-foreground/62'>
                $25 off and free shipping for qualifying first orders.
              </p>
            </article>
          </div>
        </div>

        <div className='hidden _grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {HOW_TO_GUIDES.map((guide) => (
            <article
              key={guide.title}
              className='border border-foreground/10 bg-linear-to-b from-background to-foreground/3 p-4 sm:p-5'>
              <p className='font-clash text-[11px] uppercase tracking-[0.22em] text-brand sm:text-xs sm:tracking-[0.28em]'>
                How-To
              </p>
              <h3 className='mt-3 font-clash text-lg font-semibold sm:text-xl'>
                {guide.title}
              </h3>
              <ol className='mt-4 space-y-2 text-sm leading-6 text-foreground/68'>
                {guide.steps.map((step, index) => (
                  <li key={step}>
                    <span className='mr-2 font-clash text-brand'>
                      {index + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <div className='hidden -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
          <div className='flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap'>
            {DOC_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className='border border-foreground/10 bg-background px-3 py-2 font-clash text-[11px] uppercase tracking-[0.22em] text-foreground/62 transition-colors hover:border-foreground/20 hover:text-foreground sm:px-4 sm:text-xs sm:tracking-[0.26em]'>
                {section.title}
              </a>
            ))}
          </div>
        </div>

        <div className='grid gap-4'>
          {DOC_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className='border border-foreground/10 bg-background'>
              <Accordion
                variant='default'
                className='w-full'
                // itemClasses={{
                //   base: 'shadow-none',
                //   title: 'w-full',
                //   trigger: 'px-4 py-4 sm:px-5 sm:py-5 md:px-6',
                //   content: 'px-0 pb-0',
                // }}
              >
                <AccordionItem key={section.id} aria-label={section.title}>
                  {/*
                      title={
                                          <div className='pr-6 text-left'>
                                            <p className='hidden font-clash text-[11px] uppercase tracking-[0.22em] text-brand sm:text-xs sm:tracking-[0.28em]'>
                                              {section.eyebrow}
                                            </p>
                                            <div className='mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                                              <div>
                                                <h3 className='font-clash text-xl font-semibold sm:text-2xl md:text-3xl'>
                                                  {section.title}
                                                </h3>
                                                <p className='hidden mt-2 max-w-2xl text-sm leading-6 text-foreground/62'>
                                                  {section.description}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        }
                      */}
                  <div className='border-t border-foreground/10'>
                    <Accordion
                      variant='default'
                      className='px-1 py-1 sm:px-2 sm:py-2 md:px-3'
                      // itemClasses={{
                      //   base: 'border-b border-foreground/10 last:border-b-0',
                      //   title:
                      //     'font-clash text-sm font-medium leading-6 text-foreground sm:text-base',
                      //   content:
                      //     'pb-4 text-sm leading-6 text-foreground/68 px-3 sm:px-4 sm:pb-5 sm:leading-7',
                      //   trigger: 'px-2 py-3 sm:px-3 sm:py-4',
                      // }}
                    >
                      {section.items.map((item) => (
                        <AccordionItem
                          key={item.question}
                          aria-label={item.question}>
                          {typeof item.answer === 'string' ? (
                            <p>{item.answer}</p>
                          ) : (
                            item.answer
                          )}
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </AccordionItem>
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
