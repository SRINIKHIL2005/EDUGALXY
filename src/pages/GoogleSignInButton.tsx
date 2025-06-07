// GoogleSignInButton.tsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

const GoogleSignInButton = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        if (credentialResponse.credential) {
          signInWithGoogle(credentialResponse.credential);
        }
      }}
      onError={() => {
        console.error("Google Sign-In failed");
      }}
    />
  );
};

export default GoogleSignInButton;
