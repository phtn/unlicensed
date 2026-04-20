export const CLIENT_STORAGE_VERSION = 'v1'

export const isVersionedStorageKey = (value: string) =>
  /:v\d+$/.test(value)

export const createHyfeStorageKey = (...segments: string[]) =>
  ['hyfe', ...segments, CLIENT_STORAGE_VERSION].join(':')
