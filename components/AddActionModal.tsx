import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { pressHaptic } from '@/lib/hapticUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface AddActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddReceipt: () => void;
  onAddBOL: () => void;
}

export default function AddActionModal({
  visible,
  onClose,
  onAddReceipt,
  onAddBOL,
}: AddActionModalProps) {
  const handleAddReceipt = useCallback(() => {
    pressHaptic();
    onClose();
    onAddReceipt();
  }, [onClose, onAddReceipt]);

  const handleAddBOL = useCallback(() => {
    pressHaptic();
    onClose();
    onAddBOL();
  }, [onClose, onAddBOL]);

  const handleBackdropPress = useCallback(() => {
    pressHaptic();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Semi-transparent backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        {/* Prevent touches from passing through the modal content */}
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <Animated.View
            style={styles.content}
            entering={FadeInUp.duration(400).springify()}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>What would you like to add?</Text>
            </View>

            {/* Options Grid */}
            <View style={styles.grid}>
              {/* Add Receipt Card */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleAddReceipt}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FFE5B4', '#FFD99B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionIcon}>🧾</Text>
                    <Text style={styles.optionLabel}>Add Receipt</Text>
                    <Text style={styles.optionSubtext}>Scan expense receipt</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Add BOL Card */}
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleAddBOL}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#E5F4FF', '#D4EAFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionIcon}>📄</Text>
                    <Text style={styles.optionLabel}>Add BOL</Text>
                    <Text style={styles.optionSubtext}>Scan bill of lading</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Cancel Button */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleBackdropPress}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxxl,
    ...Shadow.card,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
  },
  optionGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 140,
  },
  optionIcon: {
    fontSize: 44,
  },
  optionLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionSubtext: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
});
