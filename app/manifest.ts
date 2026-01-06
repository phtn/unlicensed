import type {MetadataRoute} from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rapid Fire',
    short_name: 'Rapid Fire',
    description:
      'Discover elevated THC flower, edibles, concentrates, and drinks curated for modern rituals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a1a',
    theme_color: '#1a1a1a',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/svg/rf-icon-2.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
