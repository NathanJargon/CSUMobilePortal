import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { firebase } from './FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function DTRScreen({ navigation }) {
  const [dtrRecords, setDtrRecords] = useState([]);
  const [buttonText, setButtonText] = useState('Time In');

  useEffect(() => {
    fetchDtrRecords();
    updateButtonText();
  }, []);

  const fetchDtrRecords = async () => {
    const email = await AsyncStorage.getItem('email');
    console.log('Fetched email:', email);
    if (email) {
      const querySnapshot = await firebase.firestore().collection('dtr').get();
      const records = querySnapshot.docs
        .map(doc => doc.data())
        .filter(record => record.employeeId === email) 
        .sort((a, b) => b.date.localeCompare(a.date));
      console.log('Fetched records:', records);
      setDtrRecords(records);
    }
  };

  const updateButtonText = () => {
    const now = new Date();
    const isMorning = now.getHours() < 12;
    setButtonText(isMorning ? 'Time In: AM' : 'Time In: PM');
  };

  const saveDtrRecord = async () => {
    console.log('saveDtrRecord started');
    const email = await AsyncStorage.getItem('email');
    console.log('Email:', email);
    if (!email) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const isMorning = now.getHours() < 12;

    let dtrRecord = {
      employeeId: email,
      date: date,
    };

    const documentName = `${email}-${date}`;
    const docRef = firebase.firestore().collection('dtr').doc(documentName);
    try {
      const doc = await docRef.get();
      if (doc.exists) {
        const existingRecord = doc.data();
        if (isMorning && existingRecord.amIn && !existingRecord.amOut) {
          dtrRecord.amOut = time;
          alert('Successfully Timed Out for AM.');
          setButtonText('Time In: PM'); // Prepare for next possible action
        } else if (!isMorning && existingRecord.pmIn && !existingRecord.pmOut) {
          dtrRecord.pmOut = time;
          alert('Successfully Timed Out for PM.');
          setButtonText('Time In: AM'); // Assuming next action is next day's AM
        } else {
          alert('Error: Cannot time out without timing in first. You may have already timed in and out!');
          return;
        }
        await docRef.update(dtrRecord);
      } else {
        if (isMorning) {
          dtrRecord.amIn = time;
          alert('Successfully Timed In for AM.');
          setButtonText('Time Out: AM'); // Change button text to Time Out for AM
        } else {
          dtrRecord.pmIn = time;
          alert('Successfully Timed In for PM.');
          setButtonText('Time Out: PM'); // Change button text to Time Out for PM
        }
        await docRef.set(dtrRecord);
      }
      fetchDtrRecords(); // Refresh the records after saving
      updateButtonText(); // Update the button text based on the current time
    } catch (error) {
      console.error('Error saving DTR record: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={saveDtrRecord}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.historyContainer}>
        {dtrRecords.map((record, index) => {
          console.log('Rendering record:', record); 
          return (
            <View key={index} style={styles.recordItem}>
              <Text>Date: {record.date}</Text>
              <Text>AM In: {record.amIn || 'N/A'}</Text>
              <Text>AM Out: {record.amOut || 'N/A'}</Text> 
              <Text>PM In: {record.pmIn || 'N/A'}</Text>
              <Text>PM Out: {record.pmOut || 'N/A'}</Text>
              <Text>OT In: {record.otIn || 'N/A'}</Text> 
              <Text>OT Out: {record.otOut || 'N/A'}</Text> 
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center', 
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    maxHeight: 100, 
  },
  historyContainer: {
    flex: 2, // Take up 2/3 of the space
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    marginTop: 20,
    padding: 10,
    // Set explicit height and width for the button
    height: 60, 
    width: 125, // 
    // Set borderRadius to half of the height (or width, since they are equal)
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  recordItem: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 20,
    borderRadius: 5,
  },
});