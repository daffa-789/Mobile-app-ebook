import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, type, fonts } from '../theme';

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize, keyboardType, error, editable = true }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ui.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'none'}
        keyboardType={keyboardType}
        editable={editable}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <View style={styles.alert} accessibilityRole="alert">
      <Text style={styles.alertText}>{message}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <Text
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
    >
      {loading ? 'Memproses…' : title}
    </Text>
  );
}

export function LinkButton({ title, onPress }) {
  return (
    <Text onPress={onPress} accessibilityRole="link" accessibilityLabel={title} style={styles.link}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.ui.textPrimary, marginBottom: 6 },
  input: {
    fontFamily: fonts.sans, fontSize: type.body, color: colors.ui.textPrimary,
    backgroundColor: colors.ui.card, borderColor: colors.ui.border, borderWidth: 1,
    borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48,
  },
  inputError: { borderColor: colors.semantic.danger },
  err: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.semantic.danger, marginTop: 4 },
  alert: {
    backgroundColor: colors.semantic.dangerLight, borderColor: colors.semantic.danger,
    borderWidth: 1, borderRadius: radius.md, padding: 12, marginBottom: 12,
  },
  alertText: { fontFamily: fonts.sans, fontSize: type.small, color: colors.semantic.danger, fontWeight: '600' },
  button: {
    fontFamily: fonts.sans, fontWeight: '700', fontSize: type.body,
    color: '#FFF', backgroundColor: colors.brand[700], textAlign: 'center',
    borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 18,
    minHeight: 48, textAlignVertical: 'center', overflow: 'hidden',
  },
  buttonDisabled: { opacity: 0.5 },
  link: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.brand[700], paddingVertical: 8 },
});
