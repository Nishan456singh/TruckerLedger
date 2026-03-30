import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ImageViewerModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  title?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ImageViewerModal({
  visible,
  uri,
  onClose,
  title,
}: ImageViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);

  const handleImageLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handleDoubleTap = useCallback(() => {
    setScale(scale > 1.5 ? 1 : 2);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale }],
  }));

  if (!visible || !uri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        {/* Title (optional) */}
        {title && (
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}

        {/* Image viewer */}
        <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            {!error ? (
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                onLoadStart={handleImageLoadStart}
                onLoadEnd={handleImageLoadEnd}
                onError={handleImageError}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>📄</Text>
                <Text style={styles.errorText}>Image unavailable</Text>
              </View>
            )}

            {/* Loading spinner */}
            {loading && !error && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Help text */}
        <View style={styles.helpText}>
          <Text style={styles.helpTextContent}>
            {scale > 1.5 ? '👆 Double tap to zoom out' : '✌️ Double tap to zoom'}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  closeIcon: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: FontWeight.bold,
  },

  header: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: 54 + Spacing.lg,
  },

  title: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },

  imageContainer: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },

  errorIcon: {
    fontSize: 48,
  },

  errorText: {
    fontSize: FontSize.body,
    color: '#FFF',
  },

  helpText: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  helpTextContent: {
    fontSize: FontSize.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: FontWeight.medium,
  },
});
