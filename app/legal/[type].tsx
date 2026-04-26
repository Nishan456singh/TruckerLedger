import { getLegalDocMeta, isLegalDocType } from "@/lib/legal";

import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";

import React, { useCallback, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function LegalDocumentScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const docMeta = useMemo(() => {
    if (!type || !isLegalDocType(type)) return null;
    return getLegalDocMeta(type);
  }, [type]);

  const handleOpenInBrowser = async () => {
    if (!docMeta) return;
    await Linking.openURL(docMeta.url);
  };

  const handleHttpError = useCallback(
    (syntheticEvent: { nativeEvent: { statusCode: number } }) => {
      const { statusCode } = syntheticEvent.nativeEvent;
      if (statusCode >= 400 && docMeta?.localHtml) {
        // silently fall back to bundled local HTML
        setUseLocalFallback(true);
        setIsLoading(false);
        setLoadError(false);
      } else if (statusCode >= 400) {
        setLoadError(true);
        setIsLoading(false);
      }
    },
    [docMeta]
  );

  if (!docMeta) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Document not found</Text>
          <Text style={styles.errorText}>
            Please return and try opening the legal link again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{docMeta.title}</Text>
        <Pressable
          onPress={handleOpenInBrowser}
          style={styles.browserButton}
        >
          <Text style={styles.browserButtonText}>Open</Text>
        </Pressable>
      </View>

      <View style={styles.webContainer}>
        <WebView
          source={
            useLocalFallback && docMeta.localHtml
              ? { html: docMeta.localHtml }
              : { uri: docMeta.url }
          }
          onLoadStart={() => {
            setLoadError(false);
            setIsLoading(true);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setLoadError(true);
            setIsLoading(false);
          }}
          onHttpError={handleHttpError}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#111" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          )}
        />

        {loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Could not load this page in-app. Tap Open to read it in your browser.
            </Text>
          </View>
        )}

        {isLoading && !loadError && (
          <View style={styles.loadingOverlay} pointerEvents="none" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E5EA",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    minWidth: 56,
    height: 36,
    justifyContent: "center",
  },
  backText: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  browserButton: {
    minWidth: 56,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  browserButtonText: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "700",
  },
  webContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  loadingText: {
    color: "#4B5563",
    fontSize: 14,
  },
  errorBanner: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  errorTitle: {
    color: "#7F1D1D",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#7F1D1D",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
});