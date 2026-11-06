import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useBooks } from '../context/BookContext';

const DAYS_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];
const CATEGORY_FILTERS = ['Semua', 'Kubro', 'Mujahadah', 'Pengajian'];

// Hari dalam bulan November 2026:
// 1 Nov 2026 = Ahad (Sunday, index 6 jika Sen = 0)
// 30 hari total
const NOVEMBER_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const EMPTY_START_DAYS = [null, null, null, null, null, null]; // 6 slot kosong sebelum hari Ahad

export const CalendarScreen = () => {
  const { events } = useBooks();
  const [selectedDay, setSelectedDay] = useState(6); // Default 6 Nov 2026 seperti pada tangkapan layar
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Tanggal yang memiliki agenda kegiatan
  const eventDays = [1, 8, 15, 22, 29];

  const filteredEvents = events.filter((ev) => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Kubro') return ev.category === 'Kubro';
    if (activeFilter === 'Mujahadah') return ev.category === 'Mujahadah';
    if (activeFilter === 'Pengajian')
      return ev.category === 'Pengajian' || ev.category === 'Bimbingan';
    return true;
  });

  const getDayName = (day) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    // 1 Nov 2026 adalah hari Ahad (0)
    const dayOfWeek = (day - 1) % 7;
    // 0 = Ahad/Minggu, 1 = Sen, 2 = Sel, 3 = Rab, 4 = Kam, 5 = Jum, 6 = Sab
    const map = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return map[dayOfWeek];
  };

  const selectedDateEvents = events.filter((ev) => {
    // Cek apakah tanggal event cocok
    const dayStr = String(selectedDay).padStart(2, '0');
    return ev.event_date === `2026-11-${dayStr}`;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1:1 Card Kalender Bulanan */}
      <View style={styles.calendarCard}>
        {/* Header Bulan & Navigasi */}
        <View style={styles.calendarHeader}>
          <Text style={styles.monthTitle}>November 2026</Text>

          <View style={styles.navGroup}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => setSelectedDay(6)}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>Hari ini</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.arrowButton} activeOpacity={0.7}>
              <Feather name="chevron-left" size={16} color={theme.colors.inkSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.arrowButton} activeOpacity={0.7}>
              <Feather name="chevron-right" size={16} color={theme.colors.inkSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Baris Nama Hari */}
        <View style={styles.daysHeaderRow}>
          {DAYS_HEADER.map((d) => (
            <Text key={d} style={styles.dayHeaderText}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid Tanggal */}
        <View style={styles.gridContainer}>
          {EMPTY_START_DAYS.map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.gridCell} />
          ))}

          {NOVEMBER_DAYS.map((day) => {
            const isSelected = day === selectedDay;
            const hasEvent = eventDays.includes(day);

            return (
              <TouchableOpacity
                key={day}
                style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    hasEvent && !isSelected && styles.dayTextHasEvent,
                  ]}
                >
                  {day}
                </Text>
                {hasEvent && (
                  <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Agenda / Mujahadah Wahidiyah</Text>
        </View>
      </View>

      {/* 1:1 Panel Tanggal Terpilih */}
      <View style={styles.selectedDateCard}>
        <Text style={styles.selectedDateCaption}>TANGGAL TERPILIH</Text>
        <Text style={styles.selectedDateTitle}>
          {getDayName(selectedDay)}, {selectedDay} November 2026
        </Text>

        {selectedDateEvents.length > 0 ? (
          selectedDateEvents.map((ev) => (
            <View key={ev.id} style={styles.selectedDateEventItem}>
              <Text style={styles.selectedEventTitle}>{ev.title}</Text>
              <Text style={styles.selectedEventTime}>
                🕒 {ev.time_start} - {ev.time_end} WIB • {ev.location}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.selectedDateEmpty}>
            Tidak ada agenda majelis khusus pada tanggal ini
          </Text>
        )}
      </View>

      {/* 1:1 Agenda Besar Wahidiyah */}
      <View style={styles.agendaSection}>
        <View style={styles.agendaHeader}>
          <Text style={styles.agendaTitle}>Agenda Besar Wahidiyah</Text>
          <Text style={styles.agendaSublink}>Semua Jadwal Resmi</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Daftar Kartu Agenda */}
        <View style={styles.eventList}>
          {filteredEvents.map((item) => (
            <View key={item.id} style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.eventDateText}>{item.dateDisplay}</Text>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>

              <View style={styles.eventBottomRow}>
                <View style={styles.locationWrap}>
                  <Text style={styles.locationText}>{item.location}</Text>
                  <TouchableOpacity
                    style={styles.mapsButton}
                    onPress={() => item.mapsUrl && Linking.openURL(item.mapsUrl)}
                    activeOpacity={0.7}
                  >
                    <Feather name="navigation" size={10} color={theme.colors.primary} />
                    <Text style={styles.mapsButtonText}>Rute Maps</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeWrap}>
                  <Feather name="clock" size={11} color={theme.colors.inkMuted} />
                  <Text style={styles.timeText}>
                    {item.time_start} - {item.time_end}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F3',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  // Kalender Card
  calendarCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    backgroundColor: '#FBF8F3',
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D1B17',
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    backgroundColor: '#FBF8F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeaderText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#8C857B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gridCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  gridCellSelected: {
    backgroundColor: '#14523A', // Solid Dark Green
  },
  dayText: {
    fontSize: 13,
    color: '#1D1B17',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextHasEvent: {
    fontWeight: 'bold',
    color: '#14523A',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#14523A',
    position: 'absolute',
    bottom: 4,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#14523A',
  },
  legendText: {
    fontSize: 11,
    color: '#5A544C',
  },

  // Tanggal Terpilih
  selectedDateCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 16,
    marginBottom: 20,
  },
  selectedDateCaption: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C857B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedDateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D1B17',
    marginTop: 2,
    marginBottom: 8,
  },
  selectedDateEmpty: {
    fontSize: 12,
    color: '#8C857B',
    fontStyle: 'italic',
  },
  selectedDateEventItem: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
  },
  selectedEventTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#14523A',
  },
  selectedEventTime: {
    fontSize: 11,
    color: '#5A544C',
    marginTop: 2,
  },

  // Agenda Besar Wahidiyah
  agendaSection: {
    marginBottom: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agendaTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D1B17',
  },
  agendaSublink: {
    fontSize: 11,
    color: '#5A544C',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    backgroundColor: '#FBF8F3',
  },
  filterPillActive: {
    backgroundColor: '#14523A',
    borderColor: '#14523A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A544C',
  },
  filterPillTextActive: {
    color: '#FBF8F3',
    fontWeight: 'bold',
  },
  eventList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4D9C6',
    padding: 14,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DCEDE4',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14523A',
  },
  eventDateText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C857B',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D1B17',
    lineHeight: 18,
    marginBottom: 10,
  },
  eventBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0E8DA',
    paddingTop: 8,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#5A544C',
    fontWeight: '600',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F0E8DA',
  },
  mapsButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#14523A',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#8C857B',
  },
});
