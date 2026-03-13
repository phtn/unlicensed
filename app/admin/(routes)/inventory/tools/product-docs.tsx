'use client'

const PRODUCT_FIELDS = [
  ['name', 'Yes', 'string', 'Blue Dream', 'Product name.'],
  ['slug', 'Yes', 'string', 'blue-dream', 'URL-safe product slug.'],
  ['base', 'Yes', 'string', 'Flower', 'Base or material classification.'],
  [
    'categoryId',
    'Yes',
    "Id<'categories'>",
    'abc123...',
    'Convex category document ID.',
  ],
  ['categorySlug', 'Yes', 'string', 'flower', 'Category slug.'],
  [
    'shortDescription',
    'Yes',
    'string',
    'Fruity hybrid with balanced effects.',
    'Short summary for lists and previews.',
  ],
  [
    'description',
    'Yes',
    'string',
    'Dense buds with sweet berry notes.',
    'Full product description.',
  ],
  ['priceCents', 'Yes', 'number', '3500', 'Base price stored in cents.'],
  ['unit', 'Yes', 'string', 'oz', 'Unit such as g, oz, or each.'],
  [
    'availableDenominations',
    'Yes',
    'number[]',
    '[0.5, 1, 3.5]',
    'Allowed selling sizes.',
  ],
  [
    'popularDenomination',
    'Yes',
    'number[]',
    '[3.5]',
    'Highlighted denomination values.',
  ],
  ['thcPercentage', 'Yes', 'number', '27', 'THC percentage.'],
  ['cbdPercentage', 'Yes', 'number', '1.2', 'CBD percentage.'],
  ['effects', 'Yes', 'string[]', "['relaxed', 'uplifted']", 'Effect tags.'],
  ['terpenes', 'Yes', 'string[]', "['myrcene', 'limonene']", 'Terpene tags.'],
  ['limited', 'Yes', 'boolean', 'true', 'Limited quantity flag.'],
  ['featured', 'Yes', 'boolean', 'false', 'Featured product flag.'],
  ['available', 'Yes', 'boolean', 'true', 'Availability flag.'],
  ['stock', 'Yes', 'number', '24', 'Legacy/general stock count.'],
  [
    'inventoryMode',
    'Yes',
    "'by_denomination' | 'shared_weight'",
    'shared_weight',
    'Inventory storage model.',
  ],
  [
    'masterStockQuantity',
    'Yes',
    'number',
    '10',
    'Shared inventory pool quantity.',
  ],
  [
    'masterStockUnit',
    'Yes',
    'string',
    'lb',
    'Shared inventory unit such as oz or lb.',
  ],
  [
    'stockByDenomination',
    'Yes',
    'Record<string, number>',
    '{"0.5": 12, "1": 6, "3.5": 2}',
    'Stock per denomination key like 0.125, 1, or 3.5.',
  ],
  [
    'priceByDenomination',
    'Yes',
    'Record<string, number>',
    '{"0.5": 1200, "1": 2200, "3.5": 6500}',
    'Price per denomination key.',
  ],
  ['rating', 'Yes', 'number', '4.8', 'Product rating.'],
  ['image', 'Yes', "Id<'_storage'>", 'k17abc...', 'Primary image storage ID.'],
  [
    'gallery',
    'Yes',
    "Array<Id<'_storage'> | string>",
    "['k17abc...', 'k17def...']",
    'Gallery image IDs or strings.',
  ],
  [
    'consumption',
    'Yes',
    'string',
    'Smoke',
    'Consumption method or usage details.',
  ],
  [
    'flavorNotes',
    'Yes',
    'string[]',
    "['berry', 'citrus']",
    'Flavor note tags.',
  ],
  [
    'potencyLevel',
    'Yes',
    "'mild' | 'medium' | 'high'",
    'high',
    'Potency bucket.',
  ],
  [
    'potencyProfile',
    'Yes',
    'string',
    'Fast onset with heavy body finish.',
    'Potency description.',
  ],
  ['weightGrams', 'Yes', 'number', '28.35', 'Weight in grams.'],
  ['brand', 'Yes', 'string[]', "['Hyfe']", 'Brand values.'],
  ['lineage', 'Yes', 'string', 'Blueberry x Haze', 'Genetics or lineage.'],
  ['noseRating', 'Yes', 'number', '9', 'Aroma or nose score.'],
  [
    'variants',
    'Yes',
    'Array<{ label: string; price: number }>',
    "[{ label: '3.5oz', price: 6500 }]",
    'Variant label and price pairs.',
  ],
  ['tier', 'Yes', 'string', 'AAA', 'Tier or class.'],
  [
    'eligibleForRewards',
    'Yes',
    'boolean',
    'true',
    'Eligible for rewards points.',
  ],
  ['eligibleForDeals', 'Yes', 'boolean', 'true', 'Eligible for deals.'],
  ['onSale', 'Yes', 'boolean', 'false', 'Sale flag.'],
  [
    'eligibleDenominationForDeals',
    'Yes',
    'number[]',
    '[1, 3.5]',
    'Denominations eligible for deal logic.',
  ],
  [
    'eligibleForUpgrade',
    'Yes',
    'boolean',
    'false',
    'Upgrade eligibility flag.',
  ],
  ['upgradePrice', 'Yes', 'number', '500', 'Upgrade price in cents.'],
  [
    'dealType',
    'Yes',
    "'withinTier' | 'acrossTiers'",
    'withinTier',
    'Deal behavior type.',
  ],
  ['productType', 'Yes', 'string', 'Indoor Flower', 'Product subtype.'],
  ['netWeight', 'Yes', 'number', '3.5', 'Packaged net weight.'],
  ['netWeightUnit', 'Yes', 'string', 'g', 'Net weight unit.'],
  ['subcategory', 'Yes', 'string', 'hybrid', 'Subcategory label or slug.'],
  ['batchId', 'Yes', 'string', '2403', 'Batch identifier.'],
  ['archived', 'Yes', 'boolean', 'false', 'Archive flag.'],
  [
    'highMargins',
    'Yes',
    'string[]',
    "['premium-flower']",
    'High-margin labels.',
  ],
  [
    'brandCollaborators',
    'Yes',
    'string[]',
    "['Partner Brand']",
    'Collaborator labels.',
  ],
  ['tags', 'Yes', 'string[]', "['seasonal', 'staff-pick']", 'Generic tags.'],
  ['packagingMode', 'Yes', "'bulk' | 'prepack'", 'bulk', 'Packaging model.'],
  ['stockUnit', 'Yes', 'string', 'oz', 'Unit used for bulk stock tracking.'],
  [
    'startingWeight',
    'Yes',
    'number',
    '160',
    'Initial bulk weight or starting stock amount.',
  ],
  [
    'remainingWeight',
    'Yes',
    'number',
    '124.5',
    'Current remaining bulk weight or stock amount.',
  ],
] as const

const SUPPORTING_TYPES = [
  {
    name: 'PotencyLevel',
    definition: "'mild' | 'medium' | 'high'",
  },
  {
    name: 'ProductType',
    definition: 'Infer<typeof productSchema>',
  },
] as const

const TRAINING_NOTES = [
  'Every field in the current Convex product schema is optional.',
  'Use inventoryMode = shared_weight with masterStockQuantity and masterStockUnit.',
  'Use inventoryMode = by_denomination with stockByDenomination.',
  'priceCents and upgradePrice are numeric currency fields stored in cents.',
  'stock is a legacy/general stock field that exists alongside the newer inventory model.',
] as const

export const ProductDocs = () => {
  return (
    <section className='flex min-w-0 flex-col gap-6 rounded-lg bg-sidebar p-4 md:p-6'>
      <header className='space-y-2'>
        <p className='font-okxs text-xs uppercase tracking-[0.24em] text-foreground/50'>
          Training Material
        </p>
        <div className='space-y-1'>
          <h2 className='font-ios text-2xl text-foreground'>Products Schema</h2>
          <p className='max-w-3xl text-sm text-foreground/70'>
            Reference for the Convex product document shape defined in
            <span className='mx-1 rounded-sm bg-foreground/5 px-1.5 py-0.5 font-mono text-xs'>
              convex/products/d.ts
            </span>
            and used across admin inventory tooling.
          </p>
        </div>
      </header>

      <section className='rounded-lg border border-default-200/60 bg-background/60'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left text-sm'>
            <thead className='bg-foreground/3 text-xs uppercase tracking-[0.18em] text-foreground/55'>
              <tr>
                <th className='px-4 py-3 font-medium'>Field</th>
                <th className='px-4 py-3 font-medium'>Optional</th>
                <th className='px-4 py-3 font-medium'>Type</th>
                <th className='px-4 py-3 font-medium'>Example</th>
                <th className='px-4 py-3 font-medium'>Notes</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_FIELDS.map(([field, optional, type, example, notes]) => (
                <tr
                  key={field}
                  className='border-t border-default-200/50 align-top'>
                  <td className='px-4 py-3 font-mono text-xs text-foreground'>
                    {field}
                  </td>
                  <td className='px-4 py-3 text-xs text-foreground/70'>
                    {optional}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-foreground/80'>
                    {type}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-foreground/70'>
                    {example}
                  </td>
                  <td className='px-4 py-3 text-sm text-foreground/75'>
                    {notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_40rem]'>
        <section className='rounded-lg border border-default-200/60 bg-background/60 p-4'>
          <h3 className='font-ios text-lg text-foreground'>Supporting Types</h3>
          <div className='mt-4 overflow-x-auto'>
            <table className='min-w-full border-collapse text-left text-sm'>
              <thead className='bg-foreground/3 text-xs uppercase tracking-[0.18em] text-foreground/55'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Type</th>
                  <th className='px-4 py-3 font-medium'>Definition</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTING_TYPES.map((row) => (
                  <tr
                    key={row.name}
                    className='border-t border-default-200/50 align-top'>
                    <td className='px-4 py-3 font-mono text-xs text-foreground'>
                      {row.name}
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-foreground/80'>
                      {row.definition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='rounded-lg border border-default-200/60 bg-background/60 p-4'>
          <h3 className='font-ios text-lg text-foreground'>Training Notes</h3>
          <ul className='mt-4 space-y-3 text-sm text-foreground/75'>
            {TRAINING_NOTES.map((note) => (
              <li
                key={note}
                className='rounded-md bg-foreground/3 p-3 overflow-scroll'>
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
