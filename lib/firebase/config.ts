import {initializeApp} from 'firebase/app'
import {Auth, getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const
  const missingFields = requiredFields.filter((field) => !config[field])
  if (missingFields.length > 0) {
    console.warn(
      `Firebase config missing required fields: ${missingFields.join(', ')}`,
    )
  }
}

// Initialize Firebase
const app = initializeApp(config)
export const auth: Auth = getAuth(app)
export const firestore = getFirestore(app)
