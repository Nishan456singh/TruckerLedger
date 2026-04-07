import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControlProps,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing
} from "@/constants/theme";

interface AppLayoutProps {
  // Hero section
  title: string;
  subtitle?: string;
  value?: string | number;
  valueSuffix?: string;

  // Navigation
  onBack?: () => void;
  rightAction?: ReactNode;

  // Content
  children: ReactNode;
  scroll?: boolean;

  // Styling
  gradientColors?: string[];
  headerVariant?: "default" | "centered";

  // Scroll behavior
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onScroll?: (event: any) => void;

  // Keyboard
  keyboardAvoiding?: boolean;
}

export default function AppLayout({
  title,
  subtitle,
  value,
  valueSuffix,
  onBack,
  rightAction,
  children,
  scroll = true,
  gradientColors = [Colors.secondary, "#5A8FB5"],
  headerVariant = "default",
  refreshControl,
  onScroll,
  keyboardAvoiding = false,
}: AppLayoutProps) {
  const ContentWrapper = scroll ? ScrollView : View;
  const contentProps = scroll
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: styles.scrollContent,
        refreshControl,
        onScroll,
        scrollEventThrottle: 16,
      }
    : { style: styles.scrollContent };

  const renderHero = () => {
    if (headerVariant === "centered") {
      return (
        <View style={styles.heroCentered}>
          {onBack && (
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.heroBackText}>✕</Text>
            </TouchableOpacity>
          )}

          <View style={styles.heroContent}>
            {subtitle && (
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
            )}

            <Text style={styles.heroTitle}>{title}</Text>

            {value && (
              <Text style={styles.heroValue}>
                {value}
                {valueSuffix && (
                  <Text style={styles.heroValueSuffix}>{valueSuffix}</Text>
                )}
              </Text>
            )}
          </View>

          {rightAction && (
            <View style={styles.heroRightAction}>{rightAction}</View>
          )}
        </View>
      );
    }

    // Default variant (default horizontal layout)
    return (
      <View style={styles.heroDefault}>
        <View style={styles.heroTopBar}>
          {onBack && (
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.heroBackText}>✕</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.heroTitle}>{title}</Text>

          {rightAction ? (
            rightAction
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {subtitle && (
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        )}

        {value && (
          <View style={styles.heroValueContainer}>
            <Text style={styles.heroValue}>
              {value}
              {valueSuffix && (
                <Text style={styles.heroValueSuffix}>{valueSuffix}</Text>
              )}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const layoutContent = (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={
            keyboardAvoiding && Platform.OS === "ios" ? "padding" : undefined
          }
        >
          <View style={styles.container}>
            {/* HERO */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {renderHero()}
            </LinearGradient>

            {/* FLOATING CARD */}
            <Animated.View
              style={styles.floatingCard}
              entering={FadeInDown.delay(100)}
            >
              <ContentWrapper {...contentProps}>
                {children}
              </ContentWrapper>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );

  return layoutContent;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  keyboardAvoid: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: "hidden",
  },

  heroDefault: {
    gap: Spacing.lg,
  },

  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBackText: {
    fontSize: FontSize.body + 8,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    flex: 1,
    textAlign: "center",
  },

  heroSubtitle: {
    fontSize: FontSize.caption,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  heroValueContainer: {
    alignItems: "center",
    paddingTop: Spacing.md,
  },

  heroValue: {
    fontSize: 44,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },

  heroValueSuffix: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
  },

  // Centered variant
  heroCentered: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  heroContent: {
    alignItems: "center",
    gap: Spacing.md,
  },

  heroRightAction: {
    position: "absolute",
    right: 0,
    top: 0,
  },

  // ─── FLOATING CARD ───────────────────────────────────────────

  floatingCard: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },
});
