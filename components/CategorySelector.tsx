import {
    BorderRadius,
    CATEGORIES,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
    type Category,
} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface CategorySelectorProps {
  selected: Category;
  onChange: (category: Category) => void;
}

function CategoryChip({
  category,
  selected,
  onPress,
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
}) {
  const meta = CategoryMeta[category];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSpring(0.92, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    Haptics.selectionAsync();
    onPress();
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.chip,
          selected && { backgroundColor: meta.color + '22', borderColor: meta.color },
          !selected && styles.chipUnselected,
        ]}
      >
        <Text style={styles.chipIcon}>{meta.icon}</Text>
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? meta.color : Colors.textSecondary },
          ]}
        >
          {meta.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CategorySelector({
  selected,
  onChange,
}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            category={cat}
            selected={selected === cat}
            onPress={() => onChange(cat)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scroll: {
    gap: Spacing.sm,
    paddingHorizontal: 1,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipUnselected: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
});
