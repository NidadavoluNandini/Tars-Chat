"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    void syncCurrentUser({
      clerkId: user.id,
      name: user.fullName ?? "No Name",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      image: user.imageUrl,
    });
  }, [isLoaded, isSignedIn, user, syncCurrentUser]);

  return null;
}