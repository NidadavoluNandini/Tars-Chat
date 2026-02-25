"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthScreen() {
  return (
    <main className="relative min-h-dvh overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8 sm:py-10 md:flex md:items-center md:justify-center">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md md:grid-cols-2">
        {/* LEFT: illustration side (no real logic, just UI) */}
        <div className="flex flex-col justify-between border-b border-slate-100 bg-sky-50/60 p-7 md:border-b-0 md:border-r md:p-10">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure realtime messaging
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-300/80">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Tars Chat
                </h1>
                <p className="text-xs text-slate-500">
                  Fast team conversations with live presence
                </p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Move conversations from scattered tabs into one clean workspace
              with direct chats, group threads, and instant delivery.
            </p>

            {/* "image" area – illustrated chat card */}
            <div className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* light grid */}
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_55%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[size:18px_18px]" />
              </div>

              <div className="relative space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-semibold text-white">
                      T
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400 animate-[ping_1.4s_linear_infinite]" />
                    </span>
                    Team chat
                  </span>
                  <span>now</span>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm">
                    Morning team 👋 Ready for today&apos;s sync?
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-sky-500 px-3 py-2 text-xs text-white shadow-md shadow-sky-300/80">
                    Yes, updates are prepared. Sharing in 2 mins.
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm">
                    Perfect. Let&apos;s keep this thread as our source of truth.
                  </div>
                </div>

                {/* avatar strip – feels like an illustration */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <div className="flex -space-x-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400 text-[10px] font-semibold text-white">
                      A
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-400 text-[10px] font-semibold text-white">
                      R
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-semibold text-white">
                      S
                    </div>
                  </div>
                  <span>3 teammates online</span>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-7 space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Presence and typing indicators
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Private and group conversations
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Secure account access
            </li>
          </ul>
        </div>

        {/* RIGHT: login / signup card */}
        <div className="flex flex-col justify-center bg-white/90 p-7 md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome back
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Sign in to continue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your account to start chatting with your team in seconds.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SignInButton mode="modal">
              <Button className="h-10 w-full shadow-sm shadow-sky-200">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="h-10 w-full border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Sign up
              </Button>
            </SignUpButton>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Continue to your workspace with secure, organization‑managed access.
          </p>
        </div>
      </section>
    </main>
  );
}
