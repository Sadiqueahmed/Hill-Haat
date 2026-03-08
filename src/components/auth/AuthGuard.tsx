'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Lock, User } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function AuthGuard({ 
  children, 
  fallbackTitle = "Authentication Required",
  fallbackDescription = "Please sign in to access this feature."
}: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-200" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Show auth prompt if not signed in
  if (!isSignedIn) {
    return (
      <Card className="border-0 shadow-lg max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <Lock className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{fallbackTitle}</h3>
          <p className="text-muted-foreground mb-6">{fallbackDescription}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton mode="modal">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User is authenticated, show the content
  return <>{children}</>;
}
