import type {TestingLibraryMatchers} from '@testing-library/jest-dom/matchers'

declare module 'bun:test' {
  interface Matchers<T> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    /** Augmentation for @testing-library/jest-dom matchers */
    _testingLibrary?: unknown
  }
  interface AsymmetricMatchers extends TestingLibraryMatchers {
    /** Augmentation for @testing-library/jest-dom matchers */
    _testingLibrary?: unknown
  }
}
