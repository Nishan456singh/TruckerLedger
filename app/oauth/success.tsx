import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth/AuthContext";

import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useRef } from "react";

import { ActivityIndicator, View } from "react-native";

/**
 * Handles the OAuth callback redirect on web.
 *
 * On native, expo-web-browser intercepts the redirect
 * before navigation happens.
 *
 * On web, Appwrite redirects to:
 *   /oauth/success?userId=...&secret=...
 */
export default function OAuthSuccess() {
  const params = useLocalSearchParams();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const secret = Array.isArray(params.secret)
    ? params.secret[0]
    : params.secret;

  const { refreshUser } = useAuth();

  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    handled.current = true;

    async function finish() {
      if (!userId || !secret) {
        router.replace("/login");
        return;
      }

      try {
        await account.createSession(userId, secret);

        await refreshUser();

        router.replace("/");
      } catch (err) {
        console.error("OAuth session creation failed:", err);

        router.replace("/login");
      }
    }

    finish();
  }, [userId, secret, refreshUser]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator />
    </View>
  );
}