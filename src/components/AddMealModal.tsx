import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { MealLibraryItem } from '../db/database';

interface Props {
  visible: boolean;
  library: MealLibraryItem[];
  onClose: () => void;
  onAddFromLibrary: (meal: MealLibraryItem, quantity: number) => void;
  onAddManual: (name: string, calories: number, protein: number) => void;
}

export default function AddMealModal({
  visible,
  library,
  onClose,
  onAddFromLibrary,
  onAddManual,
}: Props) {
  const [tab, setTab] = useState<'library' | 'manual'>('library');
  const [search, setSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealLibraryItem | null>(null);
  const [quantity, setQuantity] = useState('1');

  // Manual form
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProt, setManualProt] = useState('');

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setSelectedMeal(null);
      setQuantity('1');
      setManualName('');
      setManualCals('');
      setManualProt('');
      setTab('library');
    }
  }, [visible]);

  const filtered = library.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLibrary = () => {
    if (!selectedMeal) return;
    const q = parseFloat(quantity) || 1;
    onAddFromLibrary(selectedMeal, q);
    onClose();
  };

  const handleAddManual = () => {
    const cals = parseFloat(manualCals);
    const prot = parseFloat(manualProt);
    if (!manualName.trim() || isNaN(cals) || isNaN(prot)) return;
    onAddManual(manualName.trim(), cals, prot);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter un aliment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'library' && styles.tabActive]}
            onPress={() => setTab('library')}
          >
            <Text style={[styles.tabText, tab === 'library' && styles.tabTextActive]}>
              Bibliothèque
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'manual' && styles.tabActive]}
            onPress={() => setTab('manual')}
          >
            <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
              Manuel
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'library' ? (
          <View style={styles.content}>
            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {library.length === 0
                    ? 'Aucun repas sauvegardé.\nVa dans la bibliothèque pour en ajouter.'
                    : 'Aucun résultat'}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = selectedMeal?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.mealRow, isSelected && styles.mealRowSelected]}
                    onPress={() => setSelectedMeal(isSelected ? null : item)}
                  >
                    <View style={styles.mealRowLeft}>
                      <Text style={styles.mealRowName}>{item.name}</Text>
                      <Text style={styles.mealRowMacros}>
                        {item.calories} kcal · {item.protein}g prot
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.green} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {selectedMeal && (
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantité (portions)</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.addBtn, !selectedMeal && styles.addBtnDisabled]}
              onPress={handleAddLibrary}
              disabled={!selectedMeal}
            >
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Riz blanc cuit"
              placeholderTextColor={Colors.textSecondary}
              value={manualName}
              onChangeText={setManualName}
            />
            <Text style={styles.fieldLabel}>Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 350"
              placeholderTextColor={Colors.textSecondary}
              value={manualCals}
              onChangeText={setManualCals}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>Protéines (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 7"
              placeholderTextColor={Colors.textSecondary}
              value={manualProt}
              onChangeText={setManualProt}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[
                styles.addBtn,
                (!manualName || !manualCals || !manualProt) && styles.addBtnDisabled,
              ]}
              onPress={handleAddManual}
              disabled={!manualName || !manualCals || !manualProt}
            >
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
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
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.card2,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    lineHeight: 22,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  mealRowSelected: {
    borderWidth: 1.5,
    borderColor: Colors.green,
  },
  mealRowLeft: {
    flex: 1,
  },
  mealRowName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  mealRowMacros: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  quantityLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  quantityInput: {
    color: Colors.green,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 60,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  addBtnText: {
    color: Colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
