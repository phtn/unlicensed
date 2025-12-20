import {initializeApp, getApps, cert, type App} from 'firebase-admin/app'
import {getAuth, type Auth} from 'firebase-admin/auth'

/**
 * Initialize Firebase Admin SDK (server-side only)
 * 
 * This can be initialized in two ways:
 * 1. Using a service account JSON (recommended for production)
 * 2. Using Application Default Credentials (for Cloud environments)
 * 
 * Set FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string in your environment variables,
 * or use Application Default Credentials if running on Google Cloud.
 */
let adminApp: App | undefined
let adminAuth: Auth | undefined

function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp
  }

  // Check if already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    adminAuth = getAuth(adminApp)
    return adminApp
  }

  // Try to initialize with service account key
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey)
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error)
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format')
    }
  } else {
    // Fall back to Application Default Credentials
    // This works automatically on Google Cloud, Cloud Run, etc.
    try {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error)
      throw new Error(
        'Firebase Admin initialization failed. Set FIREBASE_SERVICE_ACCOUNT_KEY or use Application Default Credentials.',
      )
    }
  }

  adminAuth = getAuth(adminApp)
  return adminApp
}

/**
 * Get Firebase Admin Auth instance
 * Initializes the app if not already initialized
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeAdminApp()
  }
  if (!adminAuth) {
    throw new Error('Failed to initialize Firebase Admin Auth')
  }
  return adminAuth
}

/**
 * Get Firebase Admin App instance
 * Initializes the app if not already initialized
 */
export function getAdminApp(): App {
  if (!adminApp) {
    initializeAdminApp()
  }
  if (!adminApp) {
    throw new Error('Failed to initialize Firebase Admin App')
  }
  return adminApp
}

