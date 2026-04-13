import type {AuthConfig} from 'convex/server'

const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

if (!firebaseProjectId) {
  throw new Error(
    'FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Convex Firebase auth.',
  )
}

export default {
  providers: [
    {
      domain: `https://securetoken.google.com/${firebaseProjectId}`,
      applicationID: firebaseProjectId,
    },
  ],
} satisfies AuthConfig
