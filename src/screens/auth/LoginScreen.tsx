import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onGoRegister: () => void;
}

export default function LoginScreen({ onGoRegister }: Props) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    const err = await signIn(username.trim(), password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>NutriTrack</Text>
          <Text style={styles.subtitle}>Connecte-toi pour continuer</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Pseudo</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Ton pseudo"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.textTertiary}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, (!username || !password || loading) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={!username || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={styles.btnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={onGoRegister}>
            <Text style={styles.switchText}>
              Pas encore de compte ?{' '}
              <Text style={styles.switchLink}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  header: { marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.green, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 8 },
  form: { gap: 4 },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 16,
  },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, color: Colors.text, fontSize: 15 },
  error: { color: Colors.red, fontSize: 13, marginTop: 12 },
  btn: { backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: Colors.bg, fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { color: Colors.green, fontWeight: '600' },
});
