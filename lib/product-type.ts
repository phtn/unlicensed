export const TEST_PRODUCT_TYPE = 'RFTEST'

export const isTestProductType = (value: string | null | undefined) =>
  value?.trim().toUpperCase() === TEST_PRODUCT_TYPE
