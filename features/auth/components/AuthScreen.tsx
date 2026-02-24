"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(from_var(--primary)_l_c_h/0.12),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-2xl border bg-card/95 p-8 shadow-lg backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border bg-primary/10 p-2 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Tars Chat</h1>
            <p className="text-sm text-muted-foreground">Realtime messaging with presence</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to start private conversations and exchange realtime messages.
        </p>

        <div className="flex gap-3">
          <SignInButton mode="modal">
            <Button className="flex-1 shadow-sm">Log in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="secondary" className="flex-1 shadow-sm">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </div>
    </main>
  );
}
