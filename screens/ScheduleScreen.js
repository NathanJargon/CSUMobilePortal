import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import moment from 'moment';

// Optimized EventComponent with React.memo
const EventComponent = React.memo(({ title, startDate, endDate }) => (
  <View style={styles.eventContainer}>
    <Text style={styles.eventTitle}>{title}</Text>
    <Text>{moment(startDate).format('HH:mm')} - {moment(endDate).format('HH:mm')}</Text>
  </View>
));

const hours = [...Array(24).keys()]; // Generate array of 0-23 for hours

export default function ScheduleScreen() {
  const daysOfWeek = useMemo(() => (
    [...Array(7).keys()].map(offset => moment().startOf('week').add(offset, 'days'))
  ), []);

  // Dynamically generate events for demonstration
  const items = useMemo(() => [
    {
      title: 'Morning Meeting',
      startDate: moment().hour(9).minute(0).toDate(),
      endDate: moment().hour(10).minute(0).toDate(),
    },
    {
      title: 'Lunch Break',
      startDate: moment().hour(12).minute(30).toDate(),
      endDate: moment().hour(13).minute(30).toDate(),
    },
  ].sort((a, b) => a.startDate - b.startDate), []);

  const renderEvent = (event) => {
    const startHour = moment(event.startDate).hour();
    const dayOfWeek = moment(event.startDate).day();
    return (
      <View key={event.title} style={[styles.event, { top: startHour * 60, left: dayOfWeek * 100 }]}>
        <EventComponent {...event} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} horizontal>
      <View>
        <View style={styles.headerRow}>
          <View style={styles.timeColumnHeader}></View>
          {daysOfWeek.map((day, index) => (
            <View key={index} style={styles.dayColumnHeader}>
              <Text>{day.format('dddd')}</Text>
            </View>
          ))}
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.timeColumn}>
            {hours.map(hour => (
              <View key={hour} style={styles.timeCell}>
                <Text>{moment({ hour }).format('HH:mm')}</Text>
              </View>
            ))}
          </View>
          <View style={styles.eventColumns}>
            {items.map(renderEvent)}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    height: 40,
  },
  timeColumnHeader: {
    width: 60,
  },
  dayColumnHeader: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
  },
  scrollContent: {
    flexDirection: 'row',
    flexGrow: 1,
    minHeight: 24 * 60, // Ensures the content is at least 24 hours tall
  },
  timeColumn: {
    width: 60,
    backgroundColor: '#f0f0f0',
  },
  timeCell: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventColumns: {
    flexDirection: 'row',
    position: 'relative',
    flex: 1,
    minHeight: 24 * 60, // Ensures the content is at least 24 hours tall
  },
  event: {
    position: 'absolute',
    width: 100,
    height: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  eventContainer: {
    padding: 5,
  },
  eventTitle: {
    fontWeight: 'bold',
  },
});
