import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ProgressRing from '../components/ProgressRing';
import AddMealModal from '../components/AddMealModal';
import {
  todayString,
  getDailyEntries,
  addDailyEntry,
  deleteDailyEntry,
  getMealsLibrary,
  getUserSettings,
  addMealToLibrary,
  DailyEntry,
  MealLibraryItem,
  UserSettings,
} from '../db/database';

export default function TodayScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [library, setLibrary] = useState<MealLibraryItem[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const today = todayString();
    const [e, lib, s] = await Promise.all([
      getDailyEntries(today),
      getMealsLibrary(),
      getUserSettings(),
    ]);
    setEntries(e);
    setLibrary(lib);
    setSettings(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalCals = entries.reduce((acc, e) => acc + e.calories, 0);
  const totalProt = entries.reduce((acc, e) => acc + e.protein, 0);
  const calProgress = settings ? totalCals / settings.calorie_goal : 0;
  const protProgress = settings ? totalProt / settings.protein_goal : 0;

  const handleAddFromLibrary = async (meal: MealLibraryItem, quantity: number) => {
    await addDailyEntry(todayString(), meal.name, meal.calories, meal.protein, quantity);
    await load();
  };

  const handleAddManual = async (name: string, calories: number, protein: number) => {
    await Promise.all([
      addDailyEntry(todayString(), name, calories, protein, 1),
      addMealToLibrary(name, calories, protein),
    ]);
    await load();
  };

const handleDelete = (entry: DailyEntry) => {
    Alert.alert('Supprimer', `Retirer "${entry.meal_name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteDailyEntry(entry.id);
          await load();
        },
      },
    ]);
  };

  const today = new Date();
  const dayLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const remaining = (settings?.calorie_goal ?? 0) - totalCals;
  const remainingProt = (settings?.protein_goal ?? 0) - totalProt;

  if (!settings) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Bonjour {settings.username} 👋</Text>
            <Text style={styles.date}>{dayLabel}</Text>
          </View>
          <View style={styles.avatar}>
            {settings.profile_picture ? (
              <Image source={{ uri: settings.profile_picture }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {settings.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Progress cards */}
        <View style={styles.progressCard}>
          <View style={styles.ringsRow}>
            <ProgressRing
              size={130}
              strokeWidth={10}
              progress={calProgress}
              color={Colors.orange}
              label="Calories"
              current={totalCals}
              goal={settings.calorie_goal}
              unit="kcal"
            />
            <View style={styles.ringsDivider} />
            <ProgressRing
              size={130}
              strokeWidth={10}
              progress={protProgress}
              color={Colors.blue}
              label="Protéines"
              current={totalProt}
              goal={settings.protein_goal}
              unit="g"
            />
          </View>

          <View style={styles.remainingRow}>
            <View style={styles.remainingItem}>
              <Text
                style={[
                  styles.remainingValue,
                  remaining < 0 && { color: Colors.orange },
                ]}
              >
                {remaining < 0 ? '+' : ''}{Math.abs(Math.round(remaining))}
              </Text>
              <Text style={styles.remainingLabel}>
                {remaining < 0 ? 'kcal au-dessus' : 'kcal restantes'}
              </Text>
            </View>
            <View style={styles.remainingDivider} />
            <View style={styles.remainingItem}>
              <Text
                style={[
                  styles.remainingValue,
                  remainingProt < 0 && { color: Colors.green },
                ]}
              >
                {remainingProt < 0 ? '+' : ''}{Math.abs(Math.round(remainingProt))}g
              </Text>
              <Text style={styles.remainingLabel}>
                {remainingProt < 0 ? 'prot au-dessus' : 'prot restantes'}
              </Text>
            </View>
          </View>
        </View>

        {/* Meals list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repas du jour</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="restaurant-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun repas ajouté</Text>
              <Text style={styles.emptySubtext}>Appuie sur + pour commencer</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <View style={styles.entryDot} />
                  <View>
                    <Text style={styles.entryName}>{entry.meal_name}</Text>
                    <Text style={styles.entryMacros}>
                      {Math.round(entry.calories)} kcal · {entry.protein.toFixed(1)}g prot
                      {entry.quantity !== 1 && ` · x${entry.quantity}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(entry)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Bottom spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={Colors.bg} />
      </TouchableOpacity>

      <AddMealModal
        visible={modalVisible}
        library={library}
        onClose={() => setModalVisible(false)}
        onAddFromLibrary={handleAddFromLibrary}
        onAddManual={handleAddManual}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginLeft: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.green,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  ringsDivider: {
    width: 1,
    height: 80,
    backgroundColor: Colors.separator,
  },
  remainingRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    paddingTop: 16,
  },
  remainingItem: {
    flex: 1,
    alignItems: 'center',
  },
  remainingDivider: {
    width: 1,
    backgroundColor: Colors.separator,
  },
  remainingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  remainingLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  entryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  entryName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  entryMacros: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
