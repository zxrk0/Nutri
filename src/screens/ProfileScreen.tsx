import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../contexts/AuthContext';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';
import {
  getUserSettings,
  updateUserSettings,
  updateProfilePicture,
  getWeightEntries,
  addWeightEntry,
  deleteWeightEntry,
  UserSettings,
  WeightEntry,
} from '../db/database';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 140;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Ionicons name="trending-up-outline" size={32} color={Colors.textTertiary} />
        <Text style={styles.chartPlaceholderText}>
          Ajoute au moins 2 mesures pour voir le graphique
        </Text>
      </View>
    );
  }

  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (entries.length - 1)) * innerW;
  const toY = (w: number) => PAD.top + ((maxW - w) / range) * innerH;

  const points = entries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ');

  // y-axis labels: min, mid, max
  const midW = (minW + maxW) / 2;
  const yLabels = [maxW, midW, minW];

  // x-axis: first, last, and maybe mid
  const xLabels = entries.length > 2
    ? [entries[0], entries[Math.floor(entries.length / 2)], entries[entries.length - 1]]
    : [entries[0], entries[entries.length - 1]];

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
      {/* Grid lines */}
      {yLabels.map((w) => (
        <Line
          key={w}
          x1={PAD.left}
          y1={toY(w)}
          x2={CHART_WIDTH - PAD.right}
          y2={toY(w)}
          stroke={Colors.separator}
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((w) => (
        <SvgText
          key={`label-${w}`}
          x={PAD.left - 6}
          y={toY(w) + 4}
          textAnchor="end"
          fill={Colors.textTertiary}
          fontSize="10"
          fontWeight="500"
        >
          {w.toFixed(1)}
        </SvgText>
      ))}

      {/* Line */}
      <Polyline
        points={points}
        fill="none"
        stroke={Colors.green}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {entries.map((e, i) => (
        <Circle
          key={e.id}
          cx={toX(i)}
          cy={toY(e.weight)}
          r="4"
          fill={Colors.green}
          stroke={Colors.card}
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {xLabels.map((e) => {
        const idx = entries.indexOf(e);
        const d = new Date(e.date + 'T00:00:00');
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return (
          <SvgText
            key={`x-${e.id}`}
            x={toX(idx)}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            fill={Colors.textTertiary}
            fontSize="10"
            fontWeight="500"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    calorie_goal: 2500,
    protein_goal: 150,
    username: 'Moi',
  });
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);

  // Settings form
  const [formName, setFormName] = useState('');
  const [formCals, setFormCals] = useState('');
  const [formProt, setFormProt] = useState('');

  // Weight form
  const [weightInput, setWeightInput] = useState('');
  const [weightDateInput, setWeightDateInput] = useState('');

  const load = useCallback(async () => {
    const [s, w] = await Promise.all([getUserSettings(), getWeightEntries()]);
    setSettings(s);
    setWeightEntries(w);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pickProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Active l'accès aux photos dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const dest = FileSystem.documentDirectory + 'profile_picture.jpg';
    await FileSystem.copyAsync({ from: uri, to: dest });
    await updateProfilePicture(dest);
    await load();
  };

  const openSettings = () => {
    setFormName(settings.username);
    setFormCals(settings.calorie_goal.toString());
    setFormProt(settings.protein_goal.toString());
    setSettingsModalVisible(true);
  };

  const saveSettings = async () => {
    const cals = parseFloat(formCals);
    const prot = parseFloat(formProt);
    if (!formName.trim() || isNaN(cals) || isNaN(prot)) return;
    await updateUserSettings({
      username: formName.trim(),
      calorie_goal: cals,
      protein_goal: prot,
    });
    setSettingsModalVisible(false);
    await load();
  };

  const openWeightModal = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setWeightDateInput(`${dd}/${mm}/${yyyy}`);
    setWeightInput('');
    setWeightModalVisible(true);
  };

  const saveWeight = async () => {
    const w = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(w) || w <= 0) return;

    // Parse date dd/mm/yyyy
    const parts = weightDateInput.split('/');
    let dateStr = new Date().toISOString().split('T')[0];
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const date = new Date(y, m, d);
        dateStr = date.toISOString().split('T')[0];
      }
    }
    await addWeightEntry(dateStr, w);
    setWeightModalVisible(false);
    await load();
  };

  const handleDeleteWeight = (entry: WeightEntry) => {
    Alert.alert('Supprimer', `Supprimer l'entrée ${entry.weight}kg ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteWeightEntry(entry.id);
          await load();
        },
      },
    ]);
  };

  const latestWeight =
    weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null;

  const weightDelta =
    weightEntries.length >= 2
      ? weightEntries[weightEntries.length - 1].weight -
        weightEntries[weightEntries.length - 2].weight
      : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <TouchableOpacity style={styles.editBtn} onPress={openSettings}>
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {settings.profile_picture ? (
              <Image source={{ uri: settings.profile_picture }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {settings.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{settings.username}</Text>
            <Text style={styles.profileGoals}>
              {settings.calorie_goal} kcal · {settings.protein_goal}g prot / jour
            </Text>
          </View>
        </View>

        {/* Weight stats */}
        <View style={styles.weightStatsRow}>
          <View style={styles.weightStatCard}>
            <Text style={styles.weightStatValue}>
              {latestWeight ? `${latestWeight}kg` : '—'}
            </Text>
            <Text style={styles.weightStatLabel}>Poids actuel</Text>
          </View>
          <View style={styles.weightStatCard}>
            <Text
              style={[
                styles.weightStatValue,
                weightDelta !== null && weightDelta > 0
                  ? { color: Colors.green }
                  : weightDelta !== null && weightDelta < 0
                  ? { color: Colors.orange }
                  : {},
              ]}
            >
              {weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)}kg`
                : '—'}
            </Text>
            <Text style={styles.weightStatLabel}>Évolution</Text>
          </View>
          <View style={styles.weightStatCard}>
            <Text style={styles.weightStatValue}>{weightEntries.length}</Text>
            <Text style={styles.weightStatLabel}>Mesures</Text>
          </View>
        </View>

        {/* Weight chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Évolution du poids</Text>
            <TouchableOpacity style={styles.addWeightBtn} onPress={openWeightModal}>
              <Ionicons name="add" size={18} color={Colors.bg} />
              <Text style={styles.addWeightBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
          <WeightChart entries={weightEntries} />
        </View>

        {/* Weight history */}
        {weightEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {[...weightEntries].reverse().map((entry) => {
              const d = new Date(entry.date + 'T00:00:00');
              const label = d.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              return (
                <View key={entry.id} style={styles.weightRow}>
                  <View>
                    <Text style={styles.weightRowValue}>{entry.weight} kg</Text>
                    <Text style={styles.weightRowDate}>{label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteWeight(entry)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Réglages</Text>
            <TouchableOpacity
              onPress={() => setSettingsModalVisible(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Section Profil */}
            <Text style={styles.sectionLabel}>Profil</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.photoRow} onPress={pickProfilePicture}>
                <View style={styles.photoPreview}>
                  {settings.profile_picture ? (
                    <Image source={{ uri: settings.profile_picture }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {formName.charAt(0).toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <Text style={styles.photoRowLabel}>Photo de profil</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
              <View style={styles.settingsDivider} />
              <View style={styles.settingsRow}>
                <Text style={styles.settingsRowLabel}>Prénom</Text>
                <TextInput
                  style={styles.settingsRowInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Ton prénom"
                  placeholderTextColor={Colors.textTertiary}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Section Objectifs */}
            <Text style={styles.sectionLabel}>Objectifs journaliers</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsRowLabel}>Calories</Text>
                <View style={styles.settingsRowRight}>
                  <TextInput
                    style={styles.settingsRowInput}
                    value={formCals}
                    onChangeText={setFormCals}
                    keyboardType="decimal-pad"
                    placeholder="2500"
                    placeholderTextColor={Colors.textTertiary}
                    textAlign="right"
                  />
                  <Text style={styles.settingsRowUnit}>kcal</Text>
                </View>
              </View>
              <View style={styles.settingsDivider} />
              <View style={styles.settingsRow}>
                <Text style={styles.settingsRowLabel}>Protéines</Text>
                <View style={styles.settingsRowRight}>
                  <TextInput
                    style={styles.settingsRowInput}
                    value={formProt}
                    onChangeText={setFormProt}
                    keyboardType="decimal-pad"
                    placeholder="150"
                    placeholderTextColor={Colors.textTertiary}
                    textAlign="right"
                  />
                  <Text style={styles.settingsRowUnit}>g</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Weight Modal */}
      <Modal
        visible={weightModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un poids</Text>
            <TouchableOpacity
              onPress={() => setWeightModalVisible(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="ex: 75.5"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Date (jj/mm/aaaa)</Text>
            <TextInput
              style={styles.input}
              value={weightDateInput}
              onChangeText={setWeightDateInput}
              placeholder="ex: 04/04/2026"
              placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.saveBtn, !weightInput && styles.saveBtnDisabled]}
              onPress={saveWeight}
              disabled={!weightInput}
            >
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.greenDim,
    borderWidth: 2,
    borderColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.green,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  profileGoals: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weightStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  weightStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  weightStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  weightStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  addWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addWeightBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.bg,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  chartPlaceholderText: {
    color: Colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  historySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  weightRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  weightRowDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  signOutBtn: {
    marginTop: 24,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  signOutText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: '600',
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
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  photoPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.greenDim,
    borderWidth: 1.5,
    borderColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoRowLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginLeft: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  settingsRowLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsRowInput: {
    fontSize: 15,
    color: Colors.text,
    minWidth: 60,
    maxWidth: 140,
    backgroundColor: Colors.card2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'right',
  },
  settingsRowUnit: {
    fontSize: 15,
    color: Colors.textTertiary,
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
