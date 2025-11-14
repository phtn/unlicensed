# Firebase Authentication Setup

This application uses Firebase Authentication for user management. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Enable the following sign-in methods:
   - **Email/Password**
   - **Google** (optional but recommended)

## 3. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app (if you haven't already)
5. Copy your Firebase configuration

## 4. Set Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration values.

## 5. Configure Authorized Domains (for Google Sign-In)

If you're using Google Sign-In:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain (e.g., `localhost`)
3. Add your production domain when deploying

## Features Implemented

- ✅ Email/Password authentication
- ✅ Google Sign-In
- ✅ User session management
- ✅ Automatic user sync with Convex
- ✅ Protected cart functionality
- ✅ User profile display in navbar

## Usage

Users can:
- Sign up with email/password
- Sign in with email/password
- Sign in with Google
- View their profile in the navbar
- Add items to cart (requires authentication)
- View and manage their cart

The authentication state is automatically synced with Convex, so user data is available in your backend.




