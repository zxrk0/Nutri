import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getHistory, getUserSettings, DailySummary, UserSettings } from '../db/database';

const DAY_LABELS: Record<string, string> = {
  '0': 'Dimanche',
  '1': 'Lundi',
  '2': 'Mardi',
  '3': 'Mercredi',
  '4': 'Jeudi',
  '5': 'Vendredi',
  '6': 'Samedi',
};

function formatDate(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const day = DAY_LABELS[d.getDay().toString()];
  const date = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  return { day, date };
}

function computeStreak(entries: DailySummary[], settings: UserSettings): number {
  let streak = 0;
  for (const entry of entries) {
    const cals = Number(entry.total_calories);
    const calGoal = Number(settings.calorie_goal);
    const isGreen =
      Number(entry.total_protein) >= Number(settings.protein_goal) &&
      cals >= calGoal * 0.9 &&
      cals <= calGoal * 1.1;
    if (isGreen) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function WeeklyScreen() {
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    calorie_goal: 2500,
    protein_goal: 150,
    username: 'Moi',
  });

  const load = useCallback(async () => {
    const [entries, s] = await Promise.all([getHistory(), getUserSettings()]);
    setSettings(s);
    setHistory(entries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const streak = computeStreak(history, settings);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Historique</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color={Colors.orange} />
              <Text style={styles.streakText}>{streak} jour{streak > 1 ? 's' : ''} de suite</Text>
            </View>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun historique pour l'instant</Text>
            <Text style={styles.emptySubtext}>Commence à logger tes repas aujourd'hui !</Text>
          </View>
        ) : (
          history.map((entry) => {
            const isGreen =
              Number(entry.total_protein) >= Number(settings.protein_goal) &&
              Number(entry.total_calories) >= Number(settings.calorie_goal);
            const { day, date } = formatDate(entry.date);
            const calPct = Math.min((entry.total_calories / settings.calorie_goal) * 100, 100);
            const protPct = Math.min((entry.total_protein / settings.protein_goal) * 100, 100);
            const calColor = Colors.orange;
            const protColor = Colors.blue;

            return (
              <View key={entry.date} style={[styles.dayCard, isGreen ? styles.dayCardGreen : styles.dayCardRed]}>
                {/* Top row */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.dayName}>{day}</Text>
                    <Text style={styles.dayDate}>{date}</Text>
                  </View>
                  <Ionicons
                    name={isGreen ? 'checkmark-circle' : 'close-circle'}
                    size={28}
                    color={isGreen ? Colors.green : Colors.red}
                  />
                </View>

                {/* Macros */}
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(entry.total_calories)}</Text>
                    <Text style={styles.macroLabel}>/ {settings.calorie_goal} kcal</Text>
                  </View>
                  <View style={styles.macroDivider} />
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{entry.total_protein.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>/ {settings.protein_goal}g prot</Text>
                  </View>
                </View>

                {/* Progress bars */}
                <View style={styles.barsRow}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { width: `${calPct}%`, backgroundColor: calColor }]} />
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { width: `${protPct}%`, backgroundColor: protColor }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  dayCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dayCardGreen: {
    backgroundColor: Colors.card,
    borderColor: Colors.green + '30',
  },
  dayCardRed: {
    backgroundColor: Colors.card,
    borderColor: Colors.red + '30',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.separator,
    marginHorizontal: 16,
  },
  barsRow: {
    gap: 6,
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.card2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
});
