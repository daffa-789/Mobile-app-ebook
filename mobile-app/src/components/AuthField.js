import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Field formulir bersama (ikon kiri, opsional aksi kanan & toggle kata sandi)
 * untuk layar masuk, daftar, verifikasi OTP, dan pemulihan kata sandi.
 */
export const AuthField = ({
  label,
  rightAction = null,
  icon,
  iconSize = 16,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = '#A8A199',
  editable = true,
  secureToggle = false,
  compact = true,
  inputStyle,
  ...inputProps
}) => {
  const [hidden, setHidden] = useState(secureToggle);

  return (
    <View style={compact ? styles.fieldGroupCompact : styles.fieldGroupRoomy}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={compact ? styles.labelCompact : styles.labelRoomy}>{label}</Text>
          {rightAction}
        </View>
      ) : null}

      <View style={[styles.inputWrap, !compact && styles.inputWrapRoomy]}>
        {icon ? <Feather name={icon} size={iconSize} color="#7C756C" style={styles.icon} /> : null}
        <TextInput
          style={[styles.textInput, !compact && styles.textInputRoomy, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          editable={editable}
          secureTextEntry={secureToggle ? hidden : false}
          {...inputProps}
        />
        {secureToggle ? (
          <TouchableOpacity
            onPress={() => setHidden((prev) => !prev)}
            style={styles.eyeBtn}
            disabled={!editable}
            activeOpacity={0.7}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={iconSize} color="#7C756C" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldGroupCompact: {
    gap: 5,
  },
  fieldGroupRoomy: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2823',
  },
  labelRoomy: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C756C',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapRoomy: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1D1B17',
    fontWeight: '500',
  },
  textInputRoomy: {
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
});
