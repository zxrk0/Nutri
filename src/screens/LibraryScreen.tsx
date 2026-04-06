import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  getMealsLibrary,
  addMealToLibrary,
  updateMealInLibrary,
  deleteMealFromLibrary,
  MealLibraryItem,
} from '../db/database';

export default function LibraryScreen() {
  const [meals, setMeals] = useState<MealLibraryItem[] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealLibraryItem | null>(null);

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const load = useCallback(async () => {
    const data = await getMealsLibrary();
    setMeals(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAdd = () => {
    setEditingMeal(null);
    setName('');
    setCalories('');
    setProtein('');
    setModalVisible(true);
  };

  const openEdit = (meal: MealLibraryItem) => {
    setEditingMeal(meal);
    setName(meal.name);
    setCalories(meal.calories.toString());
    setProtein(meal.protein.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    const cals = parseFloat(calories);
    const prot = parseFloat(protein);
    if (!name.trim() || isNaN(cals) || isNaN(prot)) return;

    if (editingMeal) {
      await updateMealInLibrary(editingMeal.id, name.trim(), cals, prot);
    } else {
      await addMealToLibrary(name.trim(), cals, prot);
    }
    setModalVisible(false);
    await load();
  };

  const handleDelete = (meal: MealLibraryItem) => {
    Alert.alert('Supprimer', `Supprimer "${meal.name}" de la bibliothèque ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteMealFromLibrary(meal.id);
          await load();
        },
      },
    ]);
  };

  const isValid = name.trim() && calories && protein &&
    !isNaN(parseFloat(calories)) && !isNaN(parseFloat(protein));

  if (meals === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bibliothèque</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Bibliothèque vide</Text>
            <Text style={styles.emptySubtitle}>
              Ajoute tes repas fréquents pour les retrouver rapidement
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.mealCard} onPress={() => openEdit(item)}>
            <View style={styles.mealLeft}>
              <View style={styles.mealIcon}>
                <Text style={styles.mealIconText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.mealName}>{item.name}</Text>
                <View style={styles.macrosRow}>
                  <View style={[styles.macroBadge, { backgroundColor: Colors.orangeDim }]}>
                    <Text style={[styles.macroBadgeText, { color: Colors.orange }]}>
                      {item.calories} kcal
                    </Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: Colors.blueDim }]}>
                    <Text style={[styles.macroBadgeText, { color: Colors.blue }]}>
                      {item.protein}g prot
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMeal ? 'Modifier' : 'Nouveau repas'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>Nom du repas</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: Blanc de poulet 150g"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 165"
                placeholderTextColor={Colors.textSecondary}
                value={calories}
                onChangeText={setCalories}
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>Protéines (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 31"
                placeholderTextColor={Colors.textSecondary}
                value={protein}
                onChangeText={setProtein}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!isValid}
              >
                <Text style={styles.saveBtnText}>
                  {editingMeal ? 'Enregistrer' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  mealIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.green,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  macroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 20,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveBtnText: {
    color: Colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
