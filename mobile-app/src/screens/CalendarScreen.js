import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';

export const CalendarScreen = () => {
  const { events } = useBooks();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>AGENDA KEGIATAN</Text>
        <Text style={styles.title}>Kalender Wahidiyah</Text>
        <Text style={styles.desc}>
          Jadwal pelaksanaan Mujahadah Kubro, Usbuiyyah, dan peringatan haul akbar.
        </Text>
      </View>

      <View style={styles.eventList}>
        {events.map((ev) => (
          <View key={ev.id} style={styles.eventCard}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{ev.date}</Text>
            </View>

            <Text style={styles.eventTitle}>{ev.title}</Text>

            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>📍 {ev.location}</Text>
            </View>

            <Text style={styles.eventDesc}>{ev.description}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: theme.typography.serif,
  },
  desc: {
    fontSize: 12,
    color: theme.colors.inkSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  eventList: {
    gap: 12,
    marginTop: theme.spacing.sm,
  },
  eventCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary50,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dateBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ink,
    marginTop: 2,
  },
  locationRow: {
    marginVertical: 2,
  },
  locationLabel: {
    fontSize: 11,
    color: theme.colors.inkSecondary,
    fontWeight: '600',
  },
  eventDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    lineHeight: 18,
  },
});
