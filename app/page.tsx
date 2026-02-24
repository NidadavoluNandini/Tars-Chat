import { SignedIn, SignedOut } from "@clerk/nextjs";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { ChatShell } from "@/features/chat/components/ChatShell";
import { isClerkConfigured } from "@/lib/env";
import { Button } from "@/components/ui/button";

export default function Home() {
  const clerkConfigured = isClerkConfigured();

  if (!clerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Configure Clerk to start chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add real Clerk API keys in <code>.env.local</code> and restart the dev server.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
            <li>CLERK_SECRET_KEY</li>
            <li>CLERK_JWT_ISSUER_DOMAIN</li>
          </ul>
          <Button className="mt-4" asChild>
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Clerk Dashboard
            </a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <AuthScreen />
      </SignedOut>
      <SignedIn>
        <ChatShell />
      </SignedIn>
    </>
  );
}
