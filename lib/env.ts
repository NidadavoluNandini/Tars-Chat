const PLACEHOLDER_MARKERS = ["replace_me", "xxx"];

function hasPlaceholder(value: string) {
  return PLACEHOLDER_MARKERS.some((marker) => value.includes(marker));
}

export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    return false;
  }

  const hasValidPrefix =
    (publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_")) &&
    (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"));

  if (!hasValidPrefix) {
    return false;
  }

  if (hasPlaceholder(publishableKey) || hasPlaceholder(secretKey)) {
    return false;
  }

  return true;
}
