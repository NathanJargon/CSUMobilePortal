import React, { useState, useEffect } from 'react';
import { Image, View, TextInput, Text, StyleSheet, TouchableOpacity, Modal, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { firebase } from './FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ScheduleScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [newSchedule, setNewSchedule] = useState({  startDate: '', endDate: '', classSection: '', scheduleTime: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [fetchedSchedule, setFetchedSchedule] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editSchedule, setEditSchedule] = useState({ startDate: '', endDate: '', classSection: '', scheduleTime: '' });
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const editIcon = require('../assets/icons/edit.png');

  function generateMarkedDates(schedules) {
      let markedDates = {};

      schedules.forEach(schedule => {
        const { startDate, endDate } = schedule;
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateString = d.toISOString().split('T')[0];

          if (dateString === startDate) {
            markedDates[dateString] = { marked: true, dotColor: 'blue' };
          } else if (dateString === endDate) {
            if (!markedDates[dateString]) {
              markedDates[dateString] = { marked: true, dotColor: 'red' };
            } else {
              markedDates[dateString] = { ...markedDates[dateString], dotColor: 'purple' };
            }
          } else {
            if (!markedDates[dateString]) {
              markedDates[dateString] = { marked: true, dotColor: 'green' };
            } else {
              markedDates[dateString] = { ...markedDates[dateString], dotColor: 'orange' };
            }
          }
        }
      });

      return markedDates;
    }

  const fetchSchedule = async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      console.log("Email:", email);
      if (email) {
        const db = firebase.firestore();
        const scheduleSnapshot = await db.collection('schedule').where('email', '==', email).get();
        let fetchedMarkedDates = {};
        let fetchedScheduleData = []; // Temporary array to hold fetched schedule
        scheduleSnapshot.forEach(doc => {
          const data = doc.data();
          fetchedScheduleData.push(data); // Add each schedule to the array
          const { startDate, endDate } = data;
          // Existing logic to mark dates
          if (!fetchedMarkedDates[startDate]) {
            fetchedMarkedDates[startDate] = { marked: true, dotColor: 'blue' };
          }
          if (!fetchedMarkedDates[endDate]) {
            fetchedMarkedDates[endDate] = { marked: true, dotColor: 'red' };
          } else {
            fetchedMarkedDates[endDate] = { ...fetchedMarkedDates[endDate], dotColor: 'purple' };
          }
        });
        setMarkedDates(fetchedMarkedDates);
        setFetchedSchedule(fetchedScheduleData); // Update state with fetched schedule
        console.log('Updated schedule:', fetchedScheduleData);
      }
    } catch (error) {
      console.log(error);
      alert('Failed to fetch schedule.');
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAddSchedule = async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      console.log("Email: " + email);
      if (email) {
        const db = firebase.firestore();
        // Step 1: Add the document without the ID
        const docRef = await db.collection('schedule').add({
          email,
          ...newSchedule
        });
        // Step 2: Firestore generates an ID, which can be accessed with docRef.id
        // Step 3: Update the document with its generated ID
        await db.collection('schedule').doc(docRef.id).update({
          documentId: docRef.id // Adding the document ID to the document
        });
        setModalVisible(false);
        setNewSchedule({ documentId: '', startDate: '', endDate: '', classSection: '', scheduleTime: '' });
        fetchSchedule(); // Fetch the updated schedule
      }
    } catch (error) {
      console.log(error);
      alert('Failed to add schedule.');
    }
  };
    
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false); // Hide the date picker regardless of the mode
    setShowEndDatePicker(false); // Hide the end date picker as well

    if (datePickerMode === 'start') {
      setNewSchedule(prevState => ({
        ...prevState,
        startDate: currentDate.toISOString().split('T')[0]
      }));
    } else if (datePickerMode === 'end') {
      const startDate = newSchedule.startDate;
      const endDate = currentDate.toISOString().split('T')[0];
      if (startDate && new Date(endDate) < new Date(startDate)) {
        // If the end date is before the start date, reset the end date or set it to the start date
        alert('End date cannot be before start date.');
        setNewSchedule(prevState => ({
          ...prevState,
          endDate: startDate // or '' to reset
        }));
      } else {
        setNewSchedule(prevState => ({
          ...prevState,
          endDate: endDate
        }));
      }
    }
  };

  async function updateSchedule(scheduleId, updatedSchedule) {
    try {
      const db = firebase.firestore();
      const scheduleRef = db.collection('schedule').doc(scheduleId);
      const doc = await scheduleRef.get();

      if (!doc.exists) {
        console.log("No such document!");
        alert('No such schedule found.');
      } else {
        await scheduleRef.update(updatedSchedule);
        alert('Schedule updated successfully.');
        setEditSchedule({ documentId: '', startDate: '', endDate: '', classSection: '', scheduleTime: '' });
        fetchSchedule(); // Refresh the schedules
      }
    } catch (error) {
      console.error("Error updating schedule: ", error);
      alert('Failed to update schedule.');
    }
  }

  // Example method to delete a schedule
  async function deleteSchedule(scheduleId) {
    try {
      const db = firebase.firestore();
      await db.collection('schedule').doc(scheduleId).delete();
      alert('Schedule deleted successfully.');
      fetchSchedule(); // Refresh the schedules
    } catch (error) {
      console.error("Error deleting schedule: ", error);
      alert('Failed to delete schedule.');
    }
  }

  useEffect(() => {
    // When the modal is opened or the selected schedule changes, populate the modal with the current schedule's details
    if (isUpdateModalVisible && selectedSchedule) {
      setEditSchedule({
        startDate: selectedSchedule.startDate,
        endDate: selectedSchedule.endDate,
        classSection: selectedSchedule.classSection,
        scheduleTime: selectedSchedule.scheduleTime,
      });
      console.log(selectedSchedule);
    }
  }, [isUpdateModalVisible, selectedSchedule]);


  // Function to format date from YYYY-MM-DD to "Month day, Year"
  function formatDate(dateString) {
    const options = { month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SCHEDULE</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Schedule</Text>
        </TouchableOpacity>

        <View style={styles.scheduleInfoContainer}>
          {fetchedSchedule.length > 0 ? (
            fetchedSchedule.map((schedule, index) => (
            <TouchableOpacity
              key={index}
              style={styles.scheduleBox}
              onPress={() => {
                setSelectedSchedule(schedule);
                setIsScheduleModalVisible(true);
              }}
            >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={editIcon} style={styles.editIcon} />
              <Text style={styles.scheduleInfoText}>
                {`${schedule.classSection} (${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}) - ${schedule.scheduleTime}`}
              </Text>
            </View>
            </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.scheduleInfoText}>No schedule information available</Text>
          )}
        </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isUpdateModalVisible}
        onRequestClose={() => {
          setIsUpdateModalVisible(!isUpdateModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
            style={styles.addButton3}
            onPress={() => {
              setDatePickerMode('start');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {editSchedule.startDate ? `Start Date: ${editSchedule.startDate}` : 'Select Start Date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && datePickerMode === 'start' && (
            <DateTimePicker
              value={new Date()}
              mode={'date'}
              display="default"
              onChange={onChangeDate}
            />
          )}
          <TouchableOpacity
            style={styles.addButton3}
            onPress={() => {
              setDatePickerMode('end');
              setShowEndDatePicker(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {editSchedule.endDate ? `End Date: ${editSchedule.endDate}` : 'Select End Date'}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && datePickerMode === 'end' && (
            <DateTimePicker
              value={new Date()}
              mode={'date'}
              display="default"
              onChange={onChangeDate}
            />
          )}

            <TextInput
              style={styles.input}
              placeholder="Class Section"
              value={editSchedule.classSection}
              onChangeText={(text) => setEditSchedule({ ...editSchedule, classSection: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Schedule Time"
              value={editSchedule.scheduleTime}
              onChangeText={(text) => setEditSchedule({ ...editSchedule, scheduleTime: text })}
            />

            <TouchableOpacity
              style={styles.addButton2} // Ensure this style is appropriate for the update context
              onPress={() => {
                if (selectedSchedule && selectedSchedule.documentId) { // Check if documentId is present
                  const updatedSchedule = {
                    documentId: selectedSchedule.documentId, // Use documentId from selectedSchedule
                    startDate: editSchedule.startDate,
                    endDate: editSchedule.endDate,
                    classSection: editSchedule.classSection,
                    scheduleTime: editSchedule.scheduleTime
                  };
                  updateSchedule(updatedSchedule.documentId, updatedSchedule); // Pass documentId and updatedSchedule to updateSchedule function
                  setIsUpdateModalVisible(false);
                  setIsScheduleModalVisible(false);
                } else {
                  alert('No schedule selected for update.');
                }
              }}
            >
            <Text style={styles.addButtonText2}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton2} 
              onPress={() => setIsUpdateModalVisible(false)}
            >
              <Text style={styles.addButtonText2}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isScheduleModalVisible}
        onRequestClose={() => {
          setIsScheduleModalVisible(!isScheduleModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedSchedule && (
              <>
                <Calendar
                  current={selectedSchedule.startDate}
                  markedDates={generateMarkedDates([selectedSchedule])}
                  onDayPress={(day) => {console.log('selected day', day)}}
                  monthFormat={'MMMM yyyy'}
                  hideArrows={false}
                  hideExtraDays={true}
                  disableMonthChange={false}
                  firstDay={1}
                />
                <Text style={styles.modalText}>{selectedSchedule.classSection} — {selectedSchedule.scheduleTime}</Text>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => {
                    setIsUpdateModalVisible(true); 
                  }}
                >
                  <Text style={styles.updateButtonText}>Update Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton} 
                  onPress={() => {
                    deleteSchedule(selectedSchedule.documentId); 
                    setIsScheduleModalVisible(false); 
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete Schedule</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.addButton2}
              onPress={() => setIsScheduleModalVisible(false)}
            >
              <Text style={styles.addButtonText2}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>

          <TouchableOpacity
            style={styles.addButton3}
            onPress={() => {
              setDatePickerMode('start');
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {newSchedule.startDate ? `Start Date: ${newSchedule.startDate}` : 'Select Start Date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && datePickerMode === 'start' && (
            <DateTimePicker
              value={new Date()}
              mode={'date'}
              display="default"
              onChange={onChangeDate}
            />
          )}
          <TouchableOpacity
            style={styles.addButton3}
            onPress={() => {
              setDatePickerMode('end');
              setShowEndDatePicker(true);
            }}
          >
            <Text style={styles.addButtonText}>
              {newSchedule.endDate ? `End Date: ${newSchedule.endDate}` : 'Select End Date'}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && datePickerMode === 'end' && (
            <DateTimePicker
              value={new Date()}
              mode={'date'}
              display="default"
              onChange={onChangeDate}
            />
          )}

            <TextInput
              style={styles.input}
              placeholder="Class Section"
              value={newSchedule.classSection}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, classSection: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Schedule Time"
              value={newSchedule.scheduleTime}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, scheduleTime: text })}
            />

            <TouchableOpacity
              style={styles.addButton2}
              onPress={handleAddSchedule}
            >
              <Text style={styles.addButtonText2}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: '18%',
    width: '100%',
    backgroundColor: '#1e69c4',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 30,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 20,
  },
  editIcon: {
    width: 20, // Adjust the size as needed
    height: 20, // Adjust the size as needed
    marginRight: 10, // Adds some space between the icon and the name
  },
  scheduleBox: {
    marginBottom: 10, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 5, 
    backgroundColor: '#f9f9f9', 
  },
  scheduleInfoContainer: {
    padding: 10,
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  scheduleInfoText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1e69c4',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  addButton3: {
    width: 200, // Set your desired width
    backgroundColor: '#1e69c4',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 5,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: 200,
  },
  modalText: {
    fontSize: 18,
    color: '#333',
    margin: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  updateButton: {
  backgroundColor: '#4CAF50', // Green background for the update button
  borderRadius: 20,
  padding: 10,
  elevation: 2,
  marginVertical: 5, // Adds space above and below the button
  },
  updateButtonText: {
    color: 'white', // White text color for contrast
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#f44336', // Red background for the delete button
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5, // Adds space above and below the button
  },
  deleteButtonText: {
    color: 'white', // White text color for contrast
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton2: {
    backgroundColor: '#2196F3', // Blue background for the close button
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10, // Adds space above the button
  },
  addButtonText2: {
    color: 'white', // White text color for contrast
    fontWeight: 'bold',
    textAlign: 'center',
  },
});