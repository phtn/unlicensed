# Product Schema Documentation

## PotencyLevel Type

The `potencyLevel` field uses a union type with the following literal values:
- `'mild'`
- `'medium'`
- `'high'`

## Tier Type

The `tier` field uses a union type with the following literal values:
- `'B'`
- `'A'`
- `'AA'`
- `'AAA'`
- `'AAAA'`
- `'RARE'`
- `'Cured Resin'`
- `'Fresh Frozen'`
- `'Live Resin'`
- `'Full Melt'`
- `'Half Melt'`
- `'Distillate'`
- `'Liquid Diamonds'`
- `'Sauce'`
- `'Live Rosin'`
- `'Cured Rosin'`

## DealType Type

The `dealType` field uses a union type with the following literal values:
- `'withinTier'`
- `'acrossTiers'`

## Product Schema Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `name` | `string` | Optional | Product name |
| `slug` | `string` | Optional | URL-friendly product identifier |
| `categoryId` | `Id<'categories'>` | Optional | Reference to category document |
| `categorySlug` | `string` | Optional | Category slug identifier |
| `shortDescription` | `string` | Optional | Brief product description |
| `description` | `string` | Optional | Full product description |
| `priceCents` | `number` | Optional | Price in cents |
| `unit` | `string` | Optional | Unit of measurement (e.g., "g", "oz") |
| `availableDenominations` | `number[]` | Optional | Array of available denomination values |
| `popularDenomination` | `number[]` | Optional | Array of popular denomination values |
| `thcPercentage` | `number` | Optional | THC percentage content |
| `cbdPercentage` | `number \| undefined` | Optional | CBD percentage content (double optional) |
| `effects` | `string[]` | Optional | Array of effect descriptions |
| `terpenes` | `string[]` | Optional | Array of terpene names |
| `featured` | `boolean` | Optional | Whether product is featured |
| `available` | `boolean` | Optional | Product availability status |
| `stock` | `number` | Optional | Total stock quantity (legacy; prefer `stockByDenomination` when per-size inventory is used) |
| `stockByDenomination` | `Record<string, number>` | Optional | Per-denomination inventory. Key = denomination as string (e.g. `"0.125"`, `"1"`, `"3.5"`), value = count. |
| `rating` | `number` | Optional | Product rating value |
| `image` | `Id<'_storage'>` | Optional | Main product image storage ID |
| `gallery` | `(Id<'_storage'> \| string)[]` | Optional | Array of gallery images (storage IDs or URLs) |
| `consumption` | `string` | Optional | Consumption method/instructions |
| `flavorNotes` | `string[]` | Optional | Array of flavor note descriptions |
| `potencyLevel` | `PotencyLevel` | Optional | Potency level: 'mild', 'medium', or 'high' |
| `potencyProfile` | `string` | Optional | Detailed potency profile description |
| `weightGrams` | `number` | Optional | Product weight in grams |
| `brand` | `string` | Optional | Product brand name |
| `lineage` | `string` | Optional | Product lineage information |
| `noseRating` | `number` | Optional | Nose rating value |
| `variants` | `Array<{label: string, price: number}>` | Optional | Array of product variants with label and price |
| `tier` | `Tier` | Optional | Product tier for Flower, Extracts, and Vapes |
| `eligibleForRewards` | `boolean` | Optional | Whether this product is eligible for rewards points |
| `eligibleForDeals` | `boolean` | Optional | Whether this product is eligible for deals |
| `eligibleDenominationForDeals` | `number[]` | Optional | Array of denominations eligible for deals |
| `eligibleForUpgrade` | `boolean` | Optional | Whether this product is eligible for upgrade |
| `upgradePrice` | `number` | Optional | Upgrade price value |
| `dealType` | `DealType` | Optional | Deal type: 'withinTier' or 'acrossTiers' |

## Notes

- All fields in the product schema are optional
- The `cbdPercentage` field has a double optional type (`v.optional(v.optional(v.number()))`), meaning it can be `number`, `undefined`, or omitted entirely
- The `gallery` field accepts either storage IDs (`Id<'_storage'>`) or string URLs
- The `variants` field contains objects with `label` (string) and `price` (number) properties
