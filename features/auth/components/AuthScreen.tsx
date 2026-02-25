"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(from_var(--primary)_l_c_h/0.15),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,oklch(from_var(--primary)_l_c_h/0.08),transparent_42%)]" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card/85 shadow-xl backdrop-blur md:grid-cols-2">
        <div className="flex flex-col justify-between border-b bg-card/70 p-7 md:border-b-0 md:border-r md:p-10">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Secure realtime messaging
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl border bg-primary/10 p-2 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Tars Chat</h1>
                <p className="text-sm text-muted-foreground">Fast team conversations with live presence</p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Move conversations from scattered tabs into one clean workspace with direct chats, group threads, and instant delivery.
            </p>

            <div className="relative mt-6 overflow-hidden rounded-2xl border bg-background/80 p-4">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(from_var(--primary)_l_c_h/0.15),transparent_55%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[18px_18px] opacity-40" />

              <div className="relative space-y-3">
                <div className="flex items-center justify-between rounded-lg border bg-card/85 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  <span>Team Chat</span>
                  <span>now</span>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-xs text-card-foreground shadow-sm">
                    Morning team 👋 Ready for today&apos;s sync?
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-xs text-primary-foreground shadow-sm">
                    Yes, updates are prepared. Sharing in 2 mins.
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-xs text-card-foreground shadow-sm">
                    Perfect. Let&apos;s keep this thread as our source of truth.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-7 space-y-3">
            <li className="flex items-center gap-2 text-sm text-card-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Presence and typing indicators
            </li>
            <li className="flex items-center gap-2 text-sm text-card-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Private and group conversations
            </li>
            <li className="flex items-center gap-2 text-sm text-card-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Secure account access
            </li>
          </ul>
        </div>

        <div className="flex flex-col justify-center p-7 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome back
          </div>

          <div>
            <h2 className="text-xl font-semibold">Sign in to continue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your account to start chatting with your team in seconds.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SignInButton mode="modal">
              <Button className="w-full shadow-sm">Log in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="secondary" className="w-full shadow-sm">
                Sign up
              </Button>
            </SignUpButton>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Continue to your workspace with secure, organization-managed access.
          </p>
        </div>
      </section>
    </main>
  );
}
