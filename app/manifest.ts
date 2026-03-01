import type {MetadataRoute} from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rapid Fire',
    short_name: 'Rapid Fire',
    description:
      'Discover elevated THC flower, edibles, extracts, vapes, and pre-rolls curated for modern rituals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a1a',
    theme_color: '#1a1a1a',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/svg/rf-logo-round-204-latest.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/static/rf-logo-round-latest.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/svg/rf-logo-round-latest.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
