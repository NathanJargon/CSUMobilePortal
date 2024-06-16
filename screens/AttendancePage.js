import React, { useState, useEffect } from 'react';
import { Modal, TextInput, View, StyleSheet, Text, FlatList, TouchableOpacity, BackHandler, Dimensions, Platform } from 'react-native';
import { firebase } from './FirebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Provider, Menu, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';


const { width, height } = Dimensions.get('window');

export default function AttendancePage({ navigation, route }) {
  const { subjects } = route.params;
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [schedule, setSchedule] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(''); 
  const [menuVisible, setMenuVisible] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [totalModalVisible, setTotalModalVisible] = useState(false);
  const [selectedTotalType, setSelectedTotalType] = useState(null); 
  const [totalInputValue, setTotalInputValue] = useState('');
  const [totalAbsences, setTotalAbsences] = useState(0);
  const [totalDaysPresent, setTotalDaysPresent] = useState(0);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('subjects')
          .where('classCode', '==', classCode).get();

        if (!querySnapshot.empty) {
          const subjectDoc = querySnapshot.docs[0].data(); 
          setTotalAbsences(subjectDoc.totalAbsences || 0);
          setTotalDaysPresent(subjectDoc.totalDaysPresent || 0);
        } else {
          console.log('No subject found with the classCode:', classCode);
        }
      } catch (error) {
        console.error("Error fetching subject totals:", error);
      }
    };

    fetchTotals();
  }, [classCode]); 

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (subjects.length > 0 && subjects[0].students) {
      setStudents(subjects[0].students);
      const initialRecords = {};
      subjects[0].students.forEach(student => {
        initialRecords[student.name] = 'absent'; 
      });
      setAttendanceRecords(initialRecords);
    }
  }, [subjects]);

  useEffect(() => {
    const classCode = subjects[0]?.classCode;
    if (classCode) {
      const scheduleQuery = firebase.firestore().collection('schedule').where('classCode', '==', classCode);
      scheduleQuery.get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          const period = data.period;
          const { name, classCode } = subjects[0];
          setClassCode(classCode);
          setSchedule({
            ...data,
            period,
            name,
            classCode,
          });
        } else {
          const { name, classCode } = subjects[0];
          setSchedule({ name, classCode });
        }
      }).catch((error) => {
        console.error("Error getting documents:", error);
      });
    }
  }, [subjects]);

  const setStatus = (studentName, status) => {
    setSelectedStudent({ name: studentName, status });
    console.log("Setting status for", studentName, status);
    setModalVisible(true);
  };  

  const submitAttendance = async () => {
    if (!selectedStudent) return;

    // Query the subjects collection for documents where the classCode field matches the provided classCode
    const querySnapshot = await firebase.firestore().collection('subjects')
      .where('classCode', '==', classCode).get();

    if (!querySnapshot.empty) {
      const subjectDoc = querySnapshot.docs[0];
      const studentsCollectionRef = subjectDoc.ref.collection(classCode);

      const studentQuerySnapshot = await studentsCollectionRef.where('name', '==', selectedStudent.name).get();

      if (!studentQuerySnapshot.empty) {
        const studentDoc = studentQuerySnapshot.docs[0];
        const studentDocRef = studentDoc.ref;
        let attendance = studentDoc.data().attendance || [0, 0, 0, 0];

        // Map status to index: present -> 0, absent -> 1, excuse -> 2, late -> 3
        const statusIndexMap = { present: 0, absent: 1, excuse: 2, late: 3 };
        const index = statusIndexMap[selectedStudent.status];

        // Increment the specific index based on the status
        if (index !== undefined) {
          attendance[index] += 1;
        }

        studentDocRef.update({
          attendance: attendance
        }).then(() => {
          console.log('Attendance updated for', selectedStudent.name);
          setModalVisible(false);
        }).catch((error) => {
          console.error("Error updating document:", error);
        });
      } else {
        console.log('No student found with the name:', selectedStudent.name);
      }
    } else {
      console.log('No subject found with the classCode:', classCode);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'excuse': return 'blue';
      case 'late': return 'yellow';
      default: return 'grey';
    }
  };

  const fetchDataAndGenerateTextFile = async () => {
      try {
        // Step 1: Fetch class and subject details
        const querySnapshot = await firebase.firestore().collection('subjects')
          .where('classCode', '==', classCode).get();
        
        if (querySnapshot.empty) {
          console.log('No subject found with the classCode:', classCode);
          return;
        }

        const subjectDoc = querySnapshot.docs[0].data();
        const studentsCollectionRef = querySnapshot.docs[0].ref.collection(classCode);
        const studentDocsSnapshot = await studentsCollectionRef.get();
        const students = [];

        // Fetch each student's document from the subcollection
        studentDocsSnapshot.forEach(doc => {
          let studentData = doc.data();
          studentData.attendance = studentData.attendance || ["0", "0", "0", "0"]; // Default attendance if not present
          students.push(studentData);
        });

        const totalAbsences = subjectDoc.totalAbsences || 0;
        const totalDaysPresent = subjectDoc.totalDaysPresent || 0;

        // Step 2: Process fetched data for text file content
        const header = `Class Code: ${classCode}\nPeriod: ${schedule.period}\nInstructor: ${subjectDoc.name}\n\n`;
        const sortedStudents = students.sort((a, b) => a.name.localeCompare(b.name));
        const attendanceRecordsString = sortedStudents.map(student => {
          const records = student.attendance.join(', '); // No need to check for 'No records' as we default to ["0", "0", "0", "0"]
          return `${student.name}: ${records}`;
        }).join('\n');
        const totals = `\n\nTotal No. of Absences: ${totalAbsences}\nTotal No. of Days Present: ${totalDaysPresent}`;
        const legend = `\n\nLegend:\ngreen (1st element) - present\nred (2nd element) - absent\nblue (3rd element) - excuse\nyellow (4th element) - late`;
        const content = `${header}${attendanceRecordsString}${totals}${legend}`;

        console.log("Header:", header);
        console.log("Attendance Records:", attendanceRecordsString);
        console.log("Totals:", totals);
        console.log("Legend:", legend);

        // Step 3: Generate the text file
        const fileUri = `${FileSystem.documentDirectory}attendance.txt`;
        await FileSystem.writeAsStringAsync(fileUri, content);

        // Step 4: Share or save the text file
        await Sharing.shareAsync(fileUri);
        console.log('Text file generated and shared successfully.');
      } catch (error) {
        console.error("Error fetching data or generating text file:", error);
      }
    };

  return (
    <Provider>
      <FlatList
        data={students}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            <View style={{ backgroundColor: 'blue', borderRadius: 10, paddingTop: 10, margin: 15 }}>
              <Text style={[styles.headerText, { textAlign: 'center', fontSize: width * 0.05, color: 'white' }]}>
                Students Attendance Record
              </Text>
            </View>
            <Text style={styles.headerText}>Class Code: {schedule.classCode}</Text>
            <Text style={styles.headerText}>Period: {schedule.period}</Text>
            <Text style={styles.headerText}>Instructor: {schedule.name}</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <Text style={styles.studentName}>{item.name}</Text>
            <View style={styles.statusButtons}>
              {['present', 'absent', 'excuse', 'late'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, { backgroundColor: getStatusColor(status) }]}
                  onPress={() => setStatus(item.name, status)}
                >
                  <Text style={styles.statusText}>{status.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            <TouchableOpacity onPress={() => { setTotalModalVisible(true); setSelectedTotalType('absences'); }} style={styles.buttonStyle}>
              <Text style={[styles.headerText, { marginBottom: 0, color: 'white' }]}>Total No. of Absences: {totalAbsences}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setTotalModalVisible(true); setSelectedTotalType('present'); }} style={styles.buttonStyle}>
              <Text style={[styles.headerText, { marginBottom: 0, color: 'white' }]}>Total No. of Days Present: {totalDaysPresent}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={fetchDataAndGenerateTextFile}>
              <Text style={styles.buttonText}>Generate Text File</Text>
            </TouchableOpacity>
          </>
        }
        
        contentContainerStyle={styles.container}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Student {selectedStudent?.status} on week:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setSelectedWeek}
              value={selectedWeek}
              keyboardType="numeric"
              maxLength={1} 
              placeholder="Enter Week No."
            />
            <TouchableOpacity style={styles.submitButton} onPress={submitAttendance}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={totalModalVisible}
        onRequestClose={() => {
          setTotalModalVisible(!totalModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Enter Total Number of {selectedTotalType === 'absences' ? 'Absences' : 'Days Present'}:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setTotalInputValue}
              value={totalInputValue}
              keyboardType="numeric"
              placeholder="Enter Number"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                updateSubjectTotals(totalInputValue, selectedTotalType === 'absences' ? 'absences' : 'present');
                setTotalModalVisible(false);
                setTotalInputValue('');
              }}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  buttonStyle: {
    backgroundColor: '#007bff', // Bootstrap primary button color
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center', // Center the text inside the button
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  studentName: {
    fontSize: 16,
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: 150,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white", // Ensure modal background is white
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center", // Ensure modal is centered vertically
    alignItems: "center", // Ensure modal is centered horizontally
    marginTop: 22
  },
  submitButton: {
    backgroundColor: "#2196F3", // Example button color
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});
