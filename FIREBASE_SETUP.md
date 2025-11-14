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

## 4. Get Your Google OAuth Client ID (for Google One Tap)

To enable Google One Tap sign-in, you need to get your OAuth 2.0 Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or the associated Google Cloud project)
3. Navigate to **APIs & Services** > **Credentials**
4. Find your **OAuth 2.0 Client ID** (it should be listed under "Web client" or "Web application")
5. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

Alternatively, you can find it in Firebase Console:
1. Go to **Authentication** > **Settings** > **Authorized domains**
2. The OAuth client ID is shown in the configuration

### ⚠️ Important: Configure Authorized JavaScript Origins

**This is critical to prevent CORS errors!** After getting your Client ID:

1. In Google Cloud Console, click on your **OAuth 2.0 Client ID** to edit it
2. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for development)
   - `http://localhost:3001` (if you use a different port)
   - Your production domain (e.g., `https://yourdomain.com`)
3. Under **Authorized redirect URIs**, make sure these are set:
   - `http://localhost:3000` (for development)
   - Your production domain
   - Firebase auth handler: `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`
4. Click **Save**

**Common CORS Error Fix:**
If you see "Server did not send the correct CORS headers" or "ERR_FAILED" errors:
- Make sure your domain is in the **Authorized JavaScript origins** list
- The origin must match exactly (including `http://` vs `https://` and port numbers)
- Wait a few minutes after saving for changes to propagate

## 5. Set Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Replace the placeholder values with your actual Firebase configuration values.

## 6. Configure Authorized Domains (for Google Sign-In)

If you're using Google Sign-In:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain (e.g., `localhost`)
3. Add your production domain when deploying

**Important for Google One Tap:**
- Make sure your domain is added to the authorized domains list in **both** Firebase and Google Cloud Console
- Google One Tap requires HTTPS in production (localhost works for development)
- The One Tap prompt will automatically appear for users who haven't signed in
- If you see CORS errors, check that your domain is in **Authorized JavaScript origins** in Google Cloud Console (see section 4 above)
- One Tap will automatically cancel when users click "Continue with Google" button to prevent conflicts

### ⚠️ About FedCM Errors

You may see console errors like "FedCM get() rejects with IdentityCredentialError" - **these are harmless and can be ignored**. They occur when:
- Modern browsers (especially Chrome) try to use FedCM (Federated Credential Management) automatically
- FedCM is not properly configured (which is fine - we're using the traditional method)
- The errors don't affect functionality - Google One Tap will fall back to the standard method

**The code automatically suppresses these errors** so they won't clutter your console. If you see them, they're being filtered out and won't impact your app's functionality.

## Features Implemented

- ✅ Email/Password authentication
- ✅ Google Sign-In (popup method)
- ✅ Google One Tap (automatic sign-in prompt)
- ✅ User session management
- ✅ Automatic user sync with Convex
- ✅ Protected cart functionality
- ✅ User profile display in navbar

## Usage

Users can:
- Sign up with email/password
- Sign in with email/password
- Sign in with Google (via popup button in auth modal)
- Sign in with Google One Tap (automatic prompt appears on page load)
- View their profile in the navbar
- Add items to cart (requires authentication)
- View and manage their cart

### Google One Tap

Google One Tap provides a seamless sign-in experience:
- The One Tap prompt automatically appears when users visit your site (if not already signed in)
- Users can sign in with one click without opening a popup
- The prompt is non-intrusive and can be dismissed
- If One Tap is dismissed or not available, users can still use the "Continue with Google" button in the auth modal

The authentication state is automatically synced with Convex, so user data is available in your backend.




