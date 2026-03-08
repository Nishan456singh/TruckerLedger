import { router } from "expo-router";
import { useEffect } from "react";

/**
 * Handles the OAuth failure redirect on web.
 * Appwrite redirects here when the provider is not configured
 * or the user denies access.
 */
export default function OAuthFailure() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 10);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}