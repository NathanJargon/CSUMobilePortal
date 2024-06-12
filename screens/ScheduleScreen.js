import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { firebase } from './FirebaseConfig';
import moment from 'moment';

const hours = [...Array(24).keys()]; 


const EventComponent = React.memo(({ items }) => (
  <View style={styles.eventContainer}>
    {items.map((item, index) => (
      <View key={index} style={styles.itemContainer}>
        <Text style={styles.eventTitle}>{item.subjectDescription}</Text>
        <Text style={styles.eventTitle}>{item.startTime} — {item.endTime}</Text>
        <Text style={styles.eventTitle}>Subject: {item.subjectCode}</Text>
        <Text style={styles.eventTitle}>Class: {item.classCode}</Text>
        <Text style={styles.eventTitle}>Course: {item.courseCode}</Text>
        <Text style={styles.eventTitle}>Period: {item.period}</Text>
        <Text style={styles.eventTitle}>Building: {item.building}</Text>
        <Text style={styles.eventTitle}>Room: {item.roomCode}</Text>
      </View>
    ))}
  </View>
));


export default function ScheduleScreen() {
  const [items, setItems] = useState([]);
  const dayMap = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'TH': 'Thursday',
    'F': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday'
  };
  
  useEffect(() => {
      const fetchSchedule = async () => {
        const scheduleCollection = firebase.firestore().collection('schedule');
        const snapshot = await scheduleCollection.get();
        console.log(snapshot.docs.map(doc => doc.data())); 
        let fetchedItems = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Check if the day field contains multiple days
          if (data.day.includes('/')) {
            // Split the day field and create an item for each day
            const days = data.day.toUpperCase().split('/');
            days.forEach(dayAbbreviation => {
              const fullDayName = dayMap[dayAbbreviation] || dayAbbreviation; // Convert to full name or keep as is if not found
              console.log(fullDayName); // Log the fullDayName
              fetchedItems.push({
                ...data,
                day: fullDayName,
              });
            });
          } else {
            // Handle single day items as before
            const fullDayName = dayMap[data.day.toUpperCase()] || data.day;
            console.log(fullDayName); // Log the fullDayName
            fetchedItems.push({
              ...data,
              day: fullDayName,
            });
          }
        });
        setItems(fetchedItems);
      };

      fetchSchedule();
    }, []);
  
  const groupEventsByDay = (events) => {
    return events.reduce((acc, event) => {
      const { day } = event;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(event);
      return acc;
    }, {});
  };
  
  const daysOfWeek = useMemo(() => (
    [...Array(7).keys()].map(offset => moment().startOf('week').add(offset, 'days'))
  ), []);

  const renderEvent = (event) => {
    const startTimeMoment = moment(event.startTime, 'HH:mm');
    const endTimeMoment = moment(event.endTime, 'HH:mm');
    const durationHours = endTimeMoment.diff(startTimeMoment, 'hours', true);
    const startHour = startTimeMoment.hour();
    const startMinutes = startTimeMoment.minutes();
    const topPosition = (startHour * 60) + startMinutes;
    const eventHeight = durationHours * 60; // Convert duration from hours to minutes for height

    // Mapping from full day names to day of the week indices
    const dayOfWeekIndexMap = {
      'Monday': 1, // Monday
      'Tuesday': 2, // Tuesday
      'Wednesday': 3, // Wednesday
      'Thursday': 4, // Thursday
      'Friday': 5, // Friday
      'Saturday': 6, // Saturday
      'Sunday': 0 // Sunday
    };

    // Use the mapping to get the day of the week index
    const dayOfWeekIndex = dayOfWeekIndexMap[event.day] || 0;

    console.log(`Event: ${event.classCode}, Start Date: ${event.startTime}, Day of Week: ${dayOfWeekIndex}`);

    return (
      <View key={event.classCode} style={[styles.event, { top: topPosition, height: eventHeight, left: dayOfWeekIndex * 100 }]}>
        <EventComponent items={[event]} />
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
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});
