import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HighContrastCard from './HighContrastCard';

interface FuelEfficiencyProps {
  monthlyFuelCost: number;
  monthlyIncome: number;
  tripCount: number;
  averageFuelPerTrip: number;
  fuelAsPercentage: number;
}

export default React.memo(function FuelEfficiencyCard({
  monthlyFuelCost,
  monthlyIncome,
  tripCount,
  averageFuelPerTrip,
  fuelAsPercentage,
}: FuelEfficiencyProps) {
  // Determine fuel efficiency status
  let efficiencyStatus = '✅ Good';
  let efficiencyColor = Colors.primary;

  if (fuelAsPercentage > 40) {
    efficiencyStatus = '⚠️ High';
    efficiencyColor = Colors.warning;
  } else if (fuelAsPercentage > 30) {
    efficiencyStatus = '📊 Moderate';
    efficiencyColor = Colors.accent;
  }

  return (
    <HighContrastCard>
      <View style={styles.header}>
        <Text style={styles.title}>⛽ Fuel Efficiency</Text>
        <Text style={[styles.status, { color: efficiencyColor }]}>
          {efficiencyStatus}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.label}>Monthly Fuel</Text>
          <Text style={styles.value}>
            ${monthlyFuelCost.toFixed(0)}
          </Text>
          <Text style={styles.subtitle}>{tripCount} trips</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.label}>Per Trip Avg</Text>
          <Text style={styles.value}>
            ${averageFuelPerTrip.toFixed(2)}
          </Text>
          <Text style={styles.subtitle}>fuel cost</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.label}>% of Income</Text>
          <Text style={[styles.value, { color: efficiencyColor }]}>
            {fuelAsPercentage.toFixed(1)}%
          </Text>
          <Text style={styles.subtitle}>of total income</Text>
        </View>
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightText}>
          💡 You're spending{' '}
          <Text style={{ fontWeight: FontWeight.bold }}>
            {fuelAsPercentage.toFixed(1)}%
          </Text>
          {' '}of your income on fuel. Typical is{' '}
          <Text style={{ fontWeight: FontWeight.bold }}>20-30%</Text>.
        </Text>
      </View>
    </HighContrastCard>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  status: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metric: {
    flex: 1,
    backgroundColor: Colors.cardStrong,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  value: {
    fontSize: FontSize.body + 2,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSize.caption - 1,
    color: Colors.textMuted,
  },
  insight: {
    backgroundColor: Colors.cardStrong,
    borderRadius: 8,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.fuel,
  },
  insightText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
