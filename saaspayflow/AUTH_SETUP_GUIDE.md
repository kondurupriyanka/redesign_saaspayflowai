# PayFlow AI - Supabase OAuth Authentication Setup Guide

This guide walks you through setting up Supabase OAuth authentication with Google login for PayFlow AI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Google OAuth Configuration](#google-oauth-configuration)
4. [Environment Variables](#environment-variables)
5. [Testing the Authentication](#testing-the-authentication)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- A Google Cloud Console account (free)
- A Supabase account (free tier available)
- The PayFlow AI project running locally

## Supabase Project Setup

### Step 1: Create or Access Your Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Sign in with your Supabase account
3. Click "New Project" or select an existing project
4. You should see your project URL and API keys

### Step 2: Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://hqbjtqpilpgbhddcmzgp.supabase.co`)
   - **anon public** key (starting with `sb_`)

3. Save these in your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Google OAuth Configuration

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "PayFlow AI" (or your preferred name)
5. Click "CREATE"
6. Wait for the project to be created, then select it

### Step 2: Enable Google OAuth 2.0

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click "CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. If prompted to configure the OAuth consent screen first:
   - Click "Configure Consent Screen"
   - Select "External" user type
   - Click "CREATE"
   - Fill in:
     - **App name**: "PayFlow AI"
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click "SAVE AND CONTINUE"
   - Skip scopes and click "SAVE AND CONTINUE"
   - Review and click "BACK TO DASHBOARD"

### Step 3: Create OAuth 2.0 Credentials

1. Go back to **APIs & Services** → **Credentials**
2. Click "CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:8082` (local development)
   - `http://localhost:3000` (if using different port)
   - `https://hqbjtqpilpgbhddcmzgp.supabase.co/auth/v1/callback` (replace with YOUR Supabase URL)
5. Click "CREATE"
6. Copy your **Client ID** and **Client Secret** (you'll need them next)

### Step 4: Configure Google OAuth in Supabase

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click "Google"
5. Enable Google by clicking the toggle
6. Paste your **Google Client ID** and **Client Secret**:
   - **Client ID**: From Google Cloud Console
   - **Client secret**: From Google Cloud Console
7. Click "Save"

### Step 5: Set Redirect URL in Supabase (Important!)

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:8082/auth/callback` (local development)
   - `https://yourdomain.com/auth/callback` (production - update when deployed)
3. Click "Save"

## Environment Variables

Your `.env.local` file should contain:

```env
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://hqbjtqpilpgbhddcmzgp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_IOVZ-a5NjG9nsYwf7Ah7HQ_NIoAZIkJ

# API
VITE_API_BASE_URL=http://localhost:8082
```

## Testing the Authentication

### Step 1: Start the Application

```bash
cd payflow-ai-get-paid-faster-main
npm install
npm run dev
```

The app should start on `http://localhost:8082` (or another available port)

### Step 2: Test Google Login

1. Navigate to `http://localhost:8082/auth`
2. Click "Continue with Google"
3. You should be redirected to Google's login
4. Sign in with your Google account
5. You should be redirected back to the dashboard
6. You should see your email and account info

### Step 3: Test Protected Routes

1. Navigate to `http://localhost:8082/dashboard`
2. You should see your dashboard (if logged in)
3. Click "Sign Out"
4. You should be redirected to the auth page
5. Try accessing `/dashboard` again - you should be redirected to auth

## Features Included

✅ **Google OAuth** - Sign in with your Google account
✅ **Email/Password Auth** - Traditional email signup and login
✅ **Protected Routes** - Dashboard is automatically protected
✅ **Persistent Sessions** - Stay logged in after refresh
✅ **Automatic Redirects** - Seamless OAuth flow
✅ **Error Handling** - User-friendly error messages
✅ **User Management** - View and manage account info

## Code Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client and auth functions
├── hooks/
│   └── useAuth.tsx          # Auth context and hooks
├── components/
│   └── AuthPage.tsx         # Login/signup page
├── pages/
│   ├── Dashboard.tsx        # Protected dashboard page
│   └── AuthCallback.tsx     # OAuth callback handler
└── App.tsx                  # Routes and auth provider
```

## Key Functions

### `signInWithGoogle()`
Initiates Google OAuth flow. Automatically redirects to Google login.

```typescript
import { signInWithGoogle } from '@/lib/supabase';

await signInWithGoogle();
// User is redirected to Google, then back to /auth/callback
```

### `useAuth()`
Get current user and auth state in components.

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, session, isLoading, isAuthenticated } = useAuth();

// In your component
if (!isAuthenticated) {
  return <Redirect to="/auth" />;
}
```

### `signOut()`
Sign out current user.

```typescript
import { signOut } from '@/lib/supabase';

await signOut();
// User is logged out and can redirect to /auth
```

## Troubleshooting

### Issue: "Redirect URI mismatch" error

**Solution**: Make sure your redirect URI in Supabase matches exactly:
1. Go to Supabase → Authentication → URL Configuration
2. Add `http://localhost:8082/auth/callback` if developing locally
3. The port must match where your app is running

### Issue: Google login button doesn't work

**Solution**: Check your browser console for errors:
1. Open DevTools (F12)
2. Go to Console tab
3. Try clicking Google login again
4. Look for error messages
5. Common issues:
   - Missing or invalid `VITE_SUPABASE_URL`
   - Missing or invalid `VITE_SUPABASE_ANON_KEY`
   - Incorrect redirect URI configuration

### Issue: "Invalid API key" error

**Solution**:
1. Check that your `VITE_SUPABASE_ANON_KEY` is correct (should start with `sb_`)
2. Make sure it's from the "anon" key, not the service role key
3. The key must be from the correct Supabase project
4. Don't forget to save changes in `.env.local`

### Issue: After Google login, page stays blank or redirects wrong

**Solution**: Make sure your redirect URLs are configured:
1. In Supabase, go to Authentication → URL Configuration
2. Ensure `http://localhost:8082/auth/callback` is listed
3. Restart your dev server
4. Clear browser cache and try again

### Issue: "useAuth must be used within AuthProvider" error

**Solution**: Make sure `AuthProvider` wraps all routes in `App.tsx`:
```typescript
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* your routes */}
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

## Security Notes

⚠️ **Important Security Practices**:

1. **Never expose service role key** in frontend code
2. **Only use anon key** in `VITE_SUPABASE_ANON_KEY`
3. **Environment variables should start with `VITE_`** to be available in browser
4. **OAuth flow is secure** - credentials are handled by Supabase
5. **Use HTTPS in production** - OAuth requires secure contexts

## Next Steps

1. ✅ Set up Supabase project with Google OAuth
2. ✅ Configure redirect URLs
3. ✅ Test local authentication flow
4. ⏭️ **Next**: Deploy to production and update redirect URLs
5. ⏭️ **Next**: Add additional OAuth providers (GitHub, etc.)
6. ⏭️ **Next**: Implement user profiles and custom data

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)

## Support

For issues or questions:
1. Check Supabase logs: Project Settings → Logs
2. Check browser console for errors
3. Review this guide's Troubleshooting section
4. Check the [Supabase Community](https://discord.supabase.io)
