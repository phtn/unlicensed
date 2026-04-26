const US_STATE_NAME_BY_CODE = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
} as const

export function normalizeLocationKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const US_STATE_LOOKUP = Object.fromEntries(
  Object.entries(US_STATE_NAME_BY_CODE).flatMap(([code, name]) => [
    [normalizeLocationKey(code), name],
    [normalizeLocationKey(name), name],
  ]),
) as Record<string, string>

export function isUnitedStatesCountry(country?: string | null) {
  if (!country) {
    return false
  }

  const normalizedCountry = normalizeLocationKey(country)
  return (
    normalizedCountry === 'us' ||
    normalizedCountry === 'usa' ||
    normalizedCountry === 'united states' ||
    normalizedCountry === 'united states of america' ||
    normalizedCountry.includes('united states')
  )
}

export function normalizeUsState(location?: string | null) {
  if (!location) {
    return null
  }

  const locationParts = location.split(',')
  const lastLocationPart = locationParts[locationParts.length - 1] ?? ''
  const candidates = [location, lastLocationPart]

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeLocationKey(candidate)

    if (!normalizedCandidate) {
      continue
    }

    const stateName = US_STATE_LOOKUP[normalizedCandidate]
    if (stateName) {
      return stateName
    }
  }

  return null
}
