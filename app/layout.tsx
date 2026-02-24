import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { isClerkConfigured } from "@/lib/env";
import SyncUser from "../components/SyncUser";
import "./globals.css";

export const metadata = {
  title: "Tars Chat",
  description: "Realtime Chat App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkConfigured = isClerkConfigured();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {clerkConfigured ? (
          <ClerkProvider>
            <ConvexClientProvider>
              <ThemeProvider>
                <SyncUser />
                {children}
              </ThemeProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <ConvexClientProvider withClerk={false}>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        )}
      </body>
    </html>
  );
}