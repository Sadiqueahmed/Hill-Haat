import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Join Hill-Haat</h1>
          <p className="text-muted-foreground mt-2">Create your account to start buying or selling</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white shadow-xl border-0",
              headerTitle: "text-emerald-700",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-emerald-200 hover:bg-emerald-50",
              socialButtonsBlockButtonText: "text-foreground",
              dividerLine: "bg-emerald-200",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500",
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
              footerActionLink: "text-emerald-600 hover:text-emerald-700",
            },
          }}
          redirectUrl="/"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
