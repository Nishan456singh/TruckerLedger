import GoogleSignInButton from "@/components/GoogleSignInButton";

import {
  Spacing,
  TypographyScale
} from "@/constants/theme";

import { useAuth } from "@/lib/auth/AuthContext";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";

import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require("@/assets/images/icon.png");

const ERROR_DISMISS_TIMEOUT = 5000;

// Legal document URLs - served from GitHub Pages docs/ folder
const TERMS_URL = "https://nishan456singh.github.io/TruckerLedger/TERMS.html";
const PRIVACY_URL = "https://nishan456singh.github.io/TruckerLedger/PRIVACY_POLICY.html";

export default function LoginScreen() {
  const { signInGoogle, signInApple } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const anyLoading = googleLoading || appleLoading;

  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), ERROR_DISMISS_TIMEOUT);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  const handleOpenLink = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setErrorMsg("Unable to open link.");
      }
    } catch (err) {
      setErrorMsg("Failed to open link.");
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    if (anyLoading) return;

    setGoogleLoading(true);
    setErrorMsg(null);

    try {
      await signInGoogle();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Google sign-in failed.";

      if (msg !== "Sign-in was cancelled.") {
        setErrorMsg(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [signInGoogle, anyLoading]);

  const handleAppleSignIn = useCallback(async () => {
    if (anyLoading) return;

    setAppleLoading(true);
    setErrorMsg(null);

    try {
      await signInApple();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Apple sign-in failed.";

      if (msg !== "Sign-in was cancelled.") {
        setErrorMsg(msg);
      }
    } finally {
      setAppleLoading(false);
    }
  }, [signInApple, anyLoading]);

  return (
    <LinearGradient
      colors={["#05060A", "#0E1016", "#181A21"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>

        {/* Background glow */}
        <View pointerEvents="none" style={styles.bgWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "transparent"]}
            style={styles.glowTop}
          />

          <LinearGradient
            colors={["rgba(255,255,255,0.10)", "transparent"]}
            style={styles.glowBottom}
          />

          <View style={styles.ringOne}/>
          <View style={styles.ringTwo}/>
        </View>

        <View style={styles.content}>

          {/* Logo */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.brandSection}
          >
            <View style={styles.logoShell}>
              <Image source={logo} style={styles.logoImage}/>
            </View>

            {/* <Text style={styles.appTitle}>
              TruckerLedger
            </Text> */}

            <Text style={styles.subtitle}>
              Simple expense tracking for professional drivers
            </Text>

          </Animated.View>

          {/* Sign in card */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.cardOuter}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.15)",
                "rgba(255,255,255,0.05)",
              ]}
              style={styles.cardBorder}
            >
              <View style={styles.card}>

                <Text style={styles.signTitle}>
                  Sign in to continue
                </Text>

                {errorMsg && (
                  <Animated.View
                    entering={FadeIn.duration(250)}
                    style={styles.errorBanner}
                  >
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </Animated.View>
                )}

                {Platform.OS === "ios" && (
                  <View style={{ height: 52 }}>
                    {appleLoading ? (
                      <View style={styles.appleLoading}>
                        <ActivityIndicator color="#fff"/>
                      </View>
                    ) : (
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonType={
                          AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                        }
                        buttonStyle={
                          AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                        }
                        cornerRadius={14}
                        style={styles.appleButton}
                        onPress={handleAppleSignIn}
                      />
                    )}
                  </View>
                )}

                <GoogleSignInButton
                  onPress={handleGoogleSignIn}
                  loading={googleLoading}
                  disabled={anyLoading}
                />

                <Text style={styles.legal}>
                  By continuing you agree to our{" "}
                  <Text
                    style={styles.link}
                    onPress={() => handleOpenLink(TERMS_URL)}
                  >
                    Terms
                  </Text>
                  {" "}and{" "}
                  <Text
                    style={styles.link}
                    onPress={() => handleOpenLink(PRIVACY_URL)}
                  >
                    Privacy Policy
                  </Text>
                </Text>

              </View>
            </LinearGradient>
          </Animated.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  bgWrap:{
    ...StyleSheet.absoluteFillObject,
  },

  glowTop:{
    position:"absolute",
    width:400,
    height:400,
    borderRadius:200,
    top:-80,
    right:-80,
  },

  glowBottom:{
    position:"absolute",
    width:380,
    height:380,
    borderRadius:200,
    bottom:-80,
    left:-80,
  },

  ringOne:{
    position:"absolute",
    width:600,
    height:600,
    borderRadius:300,
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.05)",
    top:80,
    left:-200
  },

  ringTwo:{
    position:"absolute",
    width:760,
    height:760,
    borderRadius:380,
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.03)",
    top:-140,
    right:-300
  },

  content:{
    flex:1,
    justifyContent:"center",
    paddingHorizontal:Spacing.xl
  },

  brandSection:{
    alignItems:"center",
    marginBottom:Spacing.xxxl
  },

  logoShell:{
    width:170,
    height:170,
    borderRadius:85,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"rgba(255,255,255,0.08)"
  },

  logoImage:{
    width:340,
    height:340,
    borderRadius:70
  },

  appTitle:{
    marginTop:Spacing.lg,
    marginBottom:Spacing.xxxxl,
    fontSize:34,
    fontWeight:"800",
    color:"#FFFFFF"
  },

  subtitle:{
    marginTop:Spacing.xxl,
    ...TypographyScale.small,
    color:"rgba(255,255,255,0.6)",
    textAlign:"center"
  },

  cardOuter:{
    width:"100%",
    marginTop:Spacing.xxxl,
  },

  cardBorder:{
    borderRadius:26,
    padding:1
  },

  card:{
    backgroundColor:"rgba(15,16,20,0.85)",
    borderRadius:25,
    paddingVertical:Spacing.xl,
    paddingHorizontal:Spacing.lg,
    gap:Spacing.md
  },

  signTitle:{
    textAlign:"center",
    fontSize:20,
    fontWeight:"700",
    color:"#fff"
  },

  appleLoading:{
    height:52,
    justifyContent:"center",
    alignItems:"center",
    borderRadius:14,
    backgroundColor:"#111"
  },

  appleButton:{
    width:"100%",
    height:42
  },

  errorBanner:{
    backgroundColor:"rgba(239,68,68,0.15)",
    borderRadius:12,
    borderWidth:1,
    borderColor:"rgba(239,68,68,0.3)",
    padding:Spacing.sm
  },

  errorText:{
    color:"#FCA5A5",
    textAlign:"center"
  },

  legal:{
    textAlign:"center",
    marginTop:Spacing.sm,
    color:"rgba(255,255,255,0.45)"
  },

  link:{
    color:"#fff",
    fontWeight:"600"
  }

});