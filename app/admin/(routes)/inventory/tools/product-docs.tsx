'use client'

import {CSV_DENOM_KEYS} from '../product/csv-import/constants'

const REQUIRED_CSV_FIELDS = [
  ['name', 'Required for every imported row. Must be at least 2 characters.'],
  [
    'categorySlug',
    'Required for every imported row. Must match an existing category slug.',
  ],
] as const

const CSV_VALUE_FORMATS = [
  [
    'Text',
    'Plain text cells. Quote the CSV cell when the value contains commas, quotes, or line breaks.',
    'Blue Dream',
  ],
  [
    'Number',
    'Raw numeric value. Currency fields such as priceCents and upgradePrice are stored in cents.',
    '3500',
  ],
  [
    'Boolean',
    'true, false, 1, and 0 are accepted. Blank cells leave the field unset.',
    'true',
  ],
  [
    'JSON array',
    'Array fields must be valid JSON arrays, not comma-separated plain text.',
    '["relaxed","uplifted"]',
  ],
  [
    'JSON record',
    'Denomination maps must be valid JSON objects with denomination keys and numeric values.',
    '{"1":2200,"3.5":6500}',
  ],
] as const

const CSV_WORKFLOW_STEPS = [
  {
    title: 'Start from the product export when possible',
    body: 'The importer expects the same header format produced by Export CSV in the products table. Keeping the exported header row avoids spelling drift and includes the supported denomination columns.',
  },
  {
    title: 'Use _id only when replacing an existing product',
    body: 'Rows with _id update that product. Rows without _id create a product. _creationTime can remain in exported files, but it is ignored by import.',
  },
  {
    title: 'Keep new product slugs unique',
    body: 'If a new row includes a blank slug cell, the preview derives one from name. Existing slug conflicts and duplicate slugs inside the upload are blocked before import.',
  },
  {
    title: 'Preview and fix all row issues',
    body: 'The uploader validates required fields, numeric fields, JSON array fields, enum-like values, category existence, and slug conflicts. Only rows with no errors are sent to Convex.',
  },
  {
    title: 'Import valid rows',
    body: 'The import creates an import record, creates or replaces products, and logs product activity. Server-side validation can still reject a row if category attributes or IDs are invalid.',
  },
] as const

const CSV_UPDATE_RULES = [
  'Rows with _id are treated as updates; rows without _id are treated as creates.',
  'For update rows, defined CSV values are merged over the existing product before the product is rebuilt and replaced.',
  'Blank cells usually become undefined and do not overwrite existing values on update.',
  '_creationTime is accepted from exported CSV files but ignored.',
  'If _id points to a missing product, that row fails during import.',
] as const

const CSV_INVENTORY_RULES = [
  'inventoryMode accepts by_denomination, shared, and legacy shared_weight. shared_weight is normalized to shared.',
  'For by_denomination inventory, use stockByDenomination or stock_* denomination columns for stock.',
  'For shared inventory, provide masterStockQuantity and masterStockUnit unless the exported row already carries denomination stock input.',
  'priceByDenomination can be supplied as a JSON record, through price_* columns, or both.',
  'When both priceByDenomination and price_* columns are present, the denomination columns win for matching keys.',
  'New by_denomination rows receive default stock_ columns with 0 when stock is omitted in the preview helper.',
] as const

const CSV_VALIDATION_RULES = [
  'name is required and must be at least 2 characters.',
  'categorySlug is required and must exist in the category list.',
  'priceCents must be non-negative when provided.',
  'rating must be between 0 and 5.',
  'noseRating must be between 0 and 10.',
  'inventoryMode must be by_denomination or shared.',
  'packagingMode must be bulk or prepack.',
  'dealType must be withinTier or acrossTiers.',
] as const

const CSV_ARRAY_FIELDS = [
  'availableDenominations',
  'popularDenomination',
  'effects',
  'terpenes',
  'gallery',
  'flavorNotes',
  'variants',
  'eligibleDenominationForDeals',
  'highMargins',
  'brandCollaborators',
  'tags',
] as const

const CSV_NUMERIC_FIELDS = [
  'priceCents',
  'thcPercentage',
  'cbdPercentage',
  'stock',
  'masterStockQuantity',
  'rating',
  'weightGrams',
  'noseRating',
  'upgradePrice',
  'netWeight',
  'packSize',
  'startingWeight',
  'remainingWeight',
] as const

const CSV_EXAMPLE_ROWS = [
  {
    scenario: 'New bulk flower',
    headers:
      'name,slug,categorySlug,brand,tier,inventoryMode,masterStockQuantity,masterStockUnit,price_3.5,availableDenominations,packagingMode',
    row: 'Blue Dream,,flower,["RapidFire"],AAA,shared,16,oz,6500,[3.5],bulk',
  },
  {
    scenario: 'New denomination product',
    headers:
      'name,slug,categorySlug,brand,inventoryMode,price_1,stock_1,price_3.5,stock_3.5,availableDenominations',
    row: 'Grape Gas,,flower,["Partner Brand"],by_denomination,2200,10,6500,4,[1,3.5]',
  },
  {
    scenario: 'Update existing product price',
    headers: '_id,name,categorySlug,price_3.5,onSale',
    row: 'jx7abc123...,Blue Dream,flower,6000,true',
  },
] as const

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
    "'by_denomination' | 'shared'",
    'shared',
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
  [
    'salePriceByDenomination',
    'Yes',
    'Record<string, number>',
    '{"0.5": 1000, "1": 2000, "3.5": 6000}',
    'Sale price per denomination key.',
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
  ['brand', 'Yes', 'string[]', "['RapidFire']", 'Brand values.'],
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
  [
    'strainType',
    'Yes',
    'string',
    'indica-dominant',
    'Category-driven strain type value or slug.',
  ],
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
  ['packSize', 'Yes', 'number', '10', 'Package count or size value.'],
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
    name: 'InventoryMode',
    definition: "'by_denomination' | 'shared'",
  },
  {
    name: 'StrainType',
    definition: 'string',
  },
  {
    name: 'ProductType',
    definition: 'Infer<typeof productSchema>',
  },
] as const

const TRAINING_NOTES = [
  'Every field in the current Convex product schema is optional.',
  'Use inventoryMode = shared with masterStockQuantity and masterStockUnit.',
  'Use inventoryMode = by_denomination with stockByDenomination.',
  'CSV import still accepts legacy shared_weight values and normalizes them to shared.',
  'priceCents and upgradePrice are numeric currency fields stored in cents.',
  'productType is a freeform string field, while strainType stores the selected category strain-type string value.',
  'packSize is a numeric packaging field used alongside packagingMode, stockUnit, and netWeight fields.',
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
          <h2 className='font-okxs font-semibold text-2xl text-foreground'>
            Product CSV Import Guide, Format, Schema And Workflow
          </h2>
          <p className='max-w-7xl text-sm leading-5 text-foreground/70 text-balance'>
            Product CSV import is designed around the product table export
            format. The safest workflow is to export products first, edit the
            CSV, then upload it through Product CSV Import. The preview step
            normalizes helper columns, checks row-level issues, and sends only
            valid rows to Convex.
          </p>
        </div>
      </header>

      <section className='space-y-5'>
        <div className='grid gap-4 lg:grid-cols-5'>
          {CSV_WORKFLOW_STEPS.map((step, index) => (
            <article
              key={step.title}
              className='relative rounded-md border border-sidebar bg-foreground/3 p-4'>
              <div className='absolute top-0 right-1 font-mono text-lg text-foreground/30'>
                {String(index + 1).padStart(2, '0')}
              </div>
              <h4 className='font-okxs font-medium text-base text-foreground text-balance'>
                {step.title}
              </h4>
              <p className='mt-2 text-sm leading-6 text-foreground/70 text-balance'>
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <div className='grid gap-5 lg:grid-cols-2'>
          <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              Minimum Required Columns
            </h4>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full border-collapse text-left text-sm'>
                <thead className='text-xs uppercase tracking-[0.16em] text-foreground/50'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>Column</th>
                    <th className='px-3 py-2 font-medium'>Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_CSV_FIELDS.map(([field, requirement]) => (
                    <tr
                      key={field}
                      className='border-t border-default-200/50 align-top'>
                      <td className='px-3 py-2 font-mono text-xs text-foreground'>
                        {field}
                      </td>
                      <td className='px-3 py-2 text-sm leading-6 text-foreground/75 text-balance'>
                        {requirement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className='mt-4 text-sm leading-6 text-foreground/70 text-balance'>
              Most product fields are optional in the schema, but import still
              requires a usable name and category so products can be built,
              validated, listed, and linked correctly.
            </p>
          </section>

          <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              Create vs Update
            </h4>
            <ul className='mt-4 space-y-2 text-sm leading-6 text-foreground/75'>
              {CSV_UPDATE_RULES.map((rule) => (
                <li
                  key={rule}
                  className='rounded-sm bg-background/45 p-3 wrap-break-word text-balance'>
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
          <h4 className='font-okxs font-medium text-base text-foreground'>
            Cell Formats
          </h4>
          <div className='mt-4 overflow-x-auto'>
            <table className='min-w-full border-collapse text-left text-sm'>
              <thead className='text-xs uppercase tracking-[0.16em] text-foreground/50'>
                <tr>
                  <th className='px-3 py-2 font-medium'>Kind</th>
                  <th className='px-3 py-2 font-medium'>Rule</th>
                  <th className='px-3 py-2 font-medium'>Example Cell</th>
                </tr>
              </thead>
              <tbody>
                {CSV_VALUE_FORMATS.map(([kind, rule, example]) => (
                  <tr
                    key={kind}
                    className='border-t border-default-200/50 align-top'>
                    <td className='px-3 py-2 font-medium text-foreground'>
                      {kind}
                    </td>
                    <td className='px-3 py-2 text-sm leading-6 text-foreground/75'>
                      {rule}
                    </td>
                    <td className='px-3 py-2 font-mono text-xs text-foreground/75'>
                      {example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className='grid gap-5 lg:grid-cols-3'>
          <section className='rounded-md col-span-2 border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              Inventory And Denominations
            </h4>
            <ul className='mt-4 space-y-2 text-sm leading-6 text-foreground/75'>
              {CSV_INVENTORY_RULES.map((rule) => (
                <li key={rule} className='rounded-sm bg-background/45 p-3'>
                  {rule}
                </li>
              ))}
            </ul>
            <div className='mt-4 rounded-sm bg-background/45 p-3'>
              <p className='font-okxs font-medium text-xs uppercase tracking-[0.18em] text-foreground/45'>
                Supported denomination keys
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {CSV_DENOM_KEYS.map((key) => (
                  <span
                    key={key}
                    className='rounded-sm border border-default-200/60 bg-background px-2 py-1 font-mono text-xs text-foreground/75'>
                    {key}
                  </span>
                ))}
              </div>
              <p className='mt-3 text-sm leading-6 text-foreground/70'>
                Each key can be represented as{' '}
                <span className='font-mono text-xs'>price_{'{key}'}</span> and{' '}
                <span className='font-mono text-xs'>stock_{'{key}'}</span>
                columns.
              </p>
            </div>
          </section>

          <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              Validation Rules
            </h4>
            <ul className='mt-4 space-y-2 text-sm leading-6 text-foreground/75'>
              {CSV_VALIDATION_RULES.map((rule) => (
                <li key={rule} className='rounded-sm bg-background/45 p-3'>
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className='grid gap-5 lg:grid-cols-2'>
          <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              JSON Array Fields
            </h4>
            <p className='mt-2 text-sm leading-6 text-foreground/70 text-balance'>
              These fields must be valid JSON arrays when present. The importer
              rejects plain comma-separated values for these columns.
            </p>
            <div className='mt-4 flex flex-wrap gap-2'>
              {CSV_ARRAY_FIELDS.map((field) => (
                <span
                  key={field}
                  className='rounded-sm border border-default-200/60 bg-background px-2 py-1 font-mono text-xs text-foreground/75'>
                  {field}
                </span>
              ))}
            </div>
          </section>

          <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
            <h4 className='font-okxs font-medium text-base text-foreground'>
              Numeric Fields
            </h4>
            <p className='mt-2 text-sm leading-6 text-foreground/70'>
              These fields must parse as finite numbers when present. Blank
              numeric cells are treated as unset.
            </p>
            <div className='mt-4 flex flex-wrap gap-2'>
              {CSV_NUMERIC_FIELDS.map((field) => (
                <span
                  key={field}
                  className='rounded-sm border border-default-200/60 bg-background px-2 py-1 font-mono text-xs text-foreground/75'>
                  {field}
                </span>
              ))}
            </div>
          </section>
        </div>

        <section className='rounded-md border border-default-200/50 bg-foreground/3 p-4'>
          <h4 className='font-okxs font-medium text-base text-foreground'>
            Examples
          </h4>
          <div className='mt-4 grid gap-3'>
            {CSV_EXAMPLE_ROWS.map((example) => (
              <article
                key={example.scenario}
                className='rounded-sm bg-background/45 p-3'>
                <h5 className='font-ios text-sm text-foreground'>
                  {example.scenario}
                </h5>
                <div className='mt-3 space-y-2 overflow-x-auto'>
                  <pre className='min-w-max rounded-sm bg-background p-3 font-mono text-xs leading-5 text-foreground/75'>
                    {example.headers}
                    {'\n'}
                    {example.row}
                  </pre>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className='rounded-lg border border-default-200/60 bg-background/60'>
        <div className='border-b border-default-200/50 p-4'>
          <h3 className='font-okxs font-medium text-xl text-foreground'>
            Product Field Reference
          </h3>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-foreground/70'>
            Complete product schema field list. CSV files may include these
            fields plus denomination helper columns.
          </p>
        </div>
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
          <h3 className='font-okxs font-medium text-lg text-foreground'>
            Supporting Types
          </h3>
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
          <h3 className='font-okxs font-medium text-lg text-foreground'>
            Training Notes
          </h3>
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
