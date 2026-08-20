'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[GoogleProvider] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. ' +
        'Google Sign-In will be disabled. ' +
        'Add it to your .env.local file.'
      );
    }
    // Render children without GoogleOAuthProvider so the rest of the app still works
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
