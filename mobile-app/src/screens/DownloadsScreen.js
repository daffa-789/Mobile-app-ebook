import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DownloadsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buku Terunduh</Text>
      <Text style={styles.subtitle}>Daftar naskah buku yang tersimpan secara offline.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FDFBF7',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14523A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default DownloadsScreen;
