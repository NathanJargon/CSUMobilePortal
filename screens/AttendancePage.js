import React, { useState, useEffect } from 'react';
import { Alert, Modal, TextInput, View, StyleSheet, Text, FlatList, TouchableOpacity, BackHandler, Dimensions, Platform } from 'react-native';
import { firebase } from './FirebaseConfig';
import { Provider, Menu, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');

export default function AttendancePage({ navigation, route }) {
  const { subjects } = route.params;
  const [students, setStudents] = useState([]);
  const [fullName, setFullName] = useState('');
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
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState('');
  const [periodValue, setPeriodValue] = useState('');


  const addPeriodValue = async (value) => {
    if (value !== '') {
      setPeriod(value); 
      try {
        const storedClassCode = await AsyncStorage.getItem('classCode');
        if (storedClassCode !== null) {
          const querySnapshot = await firebase.firestore().collection('subjects')
            .where('classCode', '==', storedClassCode).get();
          if (!querySnapshot.empty) {
            const classDocRef = querySnapshot.docs[0].ref; 
            await classDocRef.update({ period: value }); 
            console.log('Period updated in Firestore:', value);
            await AsyncStorage.setItem('period', value);
          } else {
            console.log('No document found for classCode:', storedClassCode);
          }
        } else {
          console.log('No classCode found in AsyncStorage');
        }
      } catch (error) {
        console.error('Failed to update period in Firestore:', error);
      }
    }
  };

  useEffect(() => {
    const fetchClassCodeAndPeriodFromStorage = async () => {
      try {
        const storedClassCode = await AsyncStorage.getItem('classCode');
        const storedFullName = await AsyncStorage.getItem('fullName');
        if (storedFullName) setFullName(storedFullName);

        if (storedClassCode !== null) {
          setClassCode(storedClassCode);
          console.log(storedClassCode);

          // Corrected to query 'subjects' collection and properly handle querySnapshot
          const querySnapshot = await firebase.firestore().collection('subjects')
            .where('classCode', '==', storedClassCode).get();
          if (!querySnapshot.empty) { // Correctly check if the query returned any documents
            const classDoc = querySnapshot.docs[0]; // Assuming you want the first document
            const period = classDoc.data().period;
            if (period) { // Check if period exists
              await AsyncStorage.setItem('period', period);
              setPeriod(period);
              console.log('Period set in AsyncStorage:', period);
            } else {
              console.log('Period does not exist in the document.');
            }
          } else {
            console.log('No document found for classCode:', storedClassCode);
          }
        } else {
          console.log('No classCode found in AsyncStorage');
        }
      } catch (error) {
        console.error('Failed to fetch classCode from AsyncStorage:', error);
      }
    };

    fetchClassCodeAndPeriodFromStorage();
  }, []);

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

  const submitFinalAttendanceForAll = async () => {
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit the final attendance for all students?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Submission cancelled"),
          style: "cancel"
        },
        { text: "OK", onPress: () => submitFinalAttendance() }
      ]
    );
  };

  const submitFinalAttendance = async () => {
    const querySnapshot = await firebase.firestore().collection('subjects')
      .where('classCode', '==', classCode).get();

    if (!querySnapshot.empty) {
      const subjectDoc = querySnapshot.docs[0];
      const studentsCollectionRef = subjectDoc.ref.collection(classCode);

      const studentQuerySnapshot = await studentsCollectionRef.get();

      if (!studentQuerySnapshot.empty) {
        studentQuerySnapshot.docs.forEach(async (studentDoc) => {
          const studentDocRef = studentDoc.ref;
          let finalAttendance = studentDoc.data().finalAttendance || {};
        
          let attendance = studentDoc.data().attendance || [0, 0, 0, 0];
          // Use the existing period state as the key
          const periodKey = period; // Assuming 'period' is a state variable available in this scope
          // attendance.push(period);
          // Replace the attendance record for the period
          finalAttendance[periodKey] = attendance;
        
          // Update the document with the new finalAttendance and reset the attendance
          await studentDocRef.update({
            finalAttendance: finalAttendance, // Using the updated object
            attendance: [0, 0, 0, 0] // Reset attendance for the next period
          }).then(() => {
            console.log('Final attendance updated for', studentDoc.data().name);
          }).catch((error) => {
            console.error("Error updating document for", studentDoc.data().name, ":", error);
          });
        });
        
        Alert.alert('Success', 'Final attendance submitted successfully.');
      } else {
        console.log('No students found in the class:', classCode);
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

const fetchDataAndGeneratePDF = async () => {
    let totalClassAbsences = 0;
    let totalClassPresence = 0;

    try {
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

      studentDocsSnapshot.forEach(doc => {
        let studentData = doc.data();
        // Convert finalAttendance from an object to a Map if it's not already a Map
        let finalAttendanceMap = studentData.finalAttendance instanceof Map
          ? studentData.finalAttendance
          : new Map(Object.entries(studentData.finalAttendance || {}));

        let processedAttendance = new Map();
        finalAttendanceMap.forEach((value, key) => {
          // Log the current key and value for debugging
          console.log(`Key: ${key}, Value:`, value);

          // Assuming value is the array to be processed
          // Process the array except the last element (date string)
          let attendanceNumbers = value.slice(0, -1).map(Number);
          // Add the date string back to the end of the array
          attendanceNumbers.push(value[value.length - 1]);
          processedAttendance.set(key, attendanceNumbers);
        });
        studentData.finalAttendance = processedAttendance;

        students.push(studentData);
      });

      const header = `<h1 style="text-align:center;">Class Code: ${classCode}</h1><h3 style="text-align:center;">Instructor: ${fullName}</h3><br>`;
      const style = `<style>
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        th, td {
          border: 1px solid black;
          text-align: center;
          padding: 8px;
        }
        tr:nth-child(even) {background-color: #f2f2f2;}
      </style>`;
      students.sort((a, b) => a.name.localeCompare(b.name));

      // Step 1: Group students by period index
      let periodGroups = {};

      students.forEach(student => {
        student.finalAttendance.forEach((attendanceArray, periodIndex) => {
          if (!periodGroups[periodIndex]) {
            periodGroups[periodIndex] = [];
          }
          periodGroups[periodIndex].push({
            name: student.name,
            attendance: attendanceArray
          });
        });
      });

      // Step 2: Create tables for each period group
      let tablesForPeriods = {};

      Object.keys(periodGroups).forEach(periodIndex => {
        let group = periodGroups[periodIndex];
        group.forEach(student => {
          let {name, attendance} = student;
          let studentPresence = attendance[0] || 0;
          let studentAbsence = attendance[1] || 0;
          let studentExcuse = attendance[2] || 0;
          let studentLate = attendance[3] || 0;

          // Update class totals
          totalClassAbsences += studentAbsence;
          totalClassPresence += studentPresence;

          // Generate table row for the student for this period
          const records = `<td>${studentPresence}</td><td>${studentAbsence}</td><td>${studentExcuse}</td><td>${studentLate}</td><td>${studentPresence}</td><td>${studentAbsence}</td><td>${studentExcuse}</td><td>${studentLate}</td>`;
          const row = `<tr><td>${name}</td>${records}</tr>`;

          // Check if the table for this period exists, if not create it
          if (!tablesForPeriods[periodIndex]) {
            tablesForPeriods[periodIndex] = {
              rows: [],
              totalClassPresence: 0,
              totalClassAbsences: 0
            };
          }

          // Add the row to the table for this period
          tablesForPeriods[periodIndex].rows.push(row);
          tablesForPeriods[periodIndex].totalClassPresence += studentPresence;
          tablesForPeriods[periodIndex].totalClassAbsences += studentAbsence;
        });
      });
    
      // Generate HTML for each period's table
      let allTablesHTML = Object.entries(tablesForPeriods).map(([periodIndex, tableData]) => {
        // Directly use periodIndex as a string in the header, without parsing it to an integer
        const attendanceTableHeader = `<h2>Period: ${periodIndex}</h2><table><tr><th>Student Name</th><th>Present</th><th>Absent</th><th>Excuse</th><th>Late</th><th>Total No. of Present</th><th>Total No. of Absence</th><th>Total No. of Excuse</th><th>Total No. of Late</th></tr>`;
        const attendanceTableRows = tableData.rows.join('');
        const classTotalsRow = `<tr style="font-weight:bold;"><td>Total</td><td>${tableData.totalClassPresence}</td><td>${tableData.totalClassAbsences}</td><td></td><td></td><td>${tableData.totalClassPresence}</td><td>${tableData.totalClassAbsences}</td><td></td><td></td></tr>`;
        const attendanceTableFooter = `</table>`;
        return `${attendanceTableHeader}${attendanceTableRows}${attendanceTableFooter}`;
      }).join('');
    
      // Combine all tables HTML with the rest of the content
      const htmlContent = `${style}${header}${allTablesHTML}`;
    

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);

      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(`attendance_files/${classCode}_attendance_record.pdf`);
      await fileRef.put(blob);
      await Print.printAsync({ uri });

      Alert.alert('Success', 'Attendance PDF generated and uploaded to Firebase Storage successfully.');
    } catch (error) {
      console.error("Error fetching data or generating PDF:", error);
      Alert.alert('Error', 'There was an issue generating or uploading the attendance PDF.');
    }
  };

  const fetchCurrentData = async () => {
    let totalClassAbsences = 0;
    let totalClassPresence = 0;
  
    try {
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
  
      studentDocsSnapshot.forEach(doc => {
        let studentData = doc.data();
        studentData.attendance = studentData.attendance ? studentData.attendance.map(Number) : [0, 0, 0, 0];
        students.push(studentData);
      });
  
      const totalAbsences = subjectDoc.totalAbsences || 0;
      const totalDaysPresent = subjectDoc.totalDaysPresent || 0;
      const fullName = await AsyncStorage.getItem('fullName');
  
      const header = `<h1 style="text-align:center;">Class Code: ${classCode}</h1><h2 style="text-align:center;">Day and Month: ${period}</h2><h3 style="text-align:center;">Instructor: ${fullName}</h3><br>`;
      const style = `<style>
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        th, td {
          border: 1px solid black;
          text-align: center;
          padding: 8px;
        }
        tr:nth-child(even) {background-color: #f2f2f2;}
      </style>`;
      students.sort((a, b) => a.name.localeCompare(b.name));
  
      const attendanceTableHeader = `<table><tr><th>Student Name</th><th>Present</th><th>Absent</th><th>Excuse</th><th>Late</th><th>Total No. of Present</th><th>Total No. of Absence</th><th>Total No. of Excuse</th><th>Total No. of Late</th></tr>`;
  
      const attendanceTableRows = students.map(student => {
        let studentPresence = Number(student.attendance[0]) || 0;
        let studentAbsence = Number(student.attendance[1]) || 0;
        let studentExcuse = Number(student.attendance[2]) || 0;
        let studentLate = Number(student.attendance[3]) || 0;
  
        totalClassAbsences += studentAbsence;
        totalClassPresence += studentPresence;
  
        const records = `<td>${studentPresence}</td><td>${studentAbsence}</td><td>${studentExcuse}</td><td>${studentLate}</td><td>${studentPresence}</td><td>${studentAbsence}</td><td>${studentExcuse}</td><td>${studentLate}</td>`;
        return `<tr><td>${student.name}</td>${records}</tr>`;
      }).join('');
  
      const classTotalsRow = `<tr style="font-weight:bold;"><td>Total</td><td>${totalClassPresence}</td><td>${totalClassAbsences}</td><td></td><td></td><td>${totalClassPresence}</td><td>${totalClassAbsences}</td><td></td><td></td></tr>`;
  
      const attendanceTableFooter = `</table>`;
      const attendanceTable = `${attendanceTableHeader}${attendanceTableRows}${attendanceTableFooter}`;
  
      const totals = `<br><p style="text-align:center;">Total No. of Absences: ${totalClassAbsences}</p><p style="text-align:center;">Total No. of Days Present: ${totalClassPresence}</p>`;
  
      const legend = `<br><p style="text-align:center;">Legend:</p><ul style="list-style-type:none; text-align:center;"><li>1 - present</li><li>0 - absent</li><li>Excuse and Late are marked accordingly</li></ul>`;
      const htmlContent = `${style}${header}${attendanceTable}`;
  
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
  
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(`attendance_files/${classCode}_attendance_record.pdf`);
      await fileRef.put(blob);
      
      // Fetch the download URL
      const downloadURL = await fileRef.getDownloadURL();
  
      console.log('PDF uploaded and accessible at:', downloadURL);
      await AsyncStorage.setItem('pdfUrl', downloadURL); 
      
      await Print.printAsync({ uri });
      // navigation.navigate('PDFViewer');
  
    } catch (error) {
      console.error("Error fetching data or generating PDF:", error);
      Alert.alert('Error', 'There was an issue generating or uploading the attendance PDF.');
    }
  };
  

  const updateSubjectTotals = async (newValue, type) => {
    try {
      // Fetch the subject document using the classCode
      const querySnapshot = await firebase.firestore().collection('subjects')
        .where('classCode', '==', classCode).get();

      if (!querySnapshot.empty) {
        const subjectDocRef = querySnapshot.docs[0].ref;

        // Prepare the update object based on the type parameter
        const updateObject = {};
        if (type === 'absences') {
          updateObject.totalAbsences = parseInt(newValue, 10);
        } else if (type === 'present') {
          updateObject.totalDaysPresent = parseInt(newValue, 10);
        }

        // Update the document
        await subjectDocRef.update(updateObject);
        type === 'absences' ? setTotalAbsences(newValue) : setTotalDaysPresent(newValue);
        console.log(`Successfully updated total number of ${type}.`);
      } else {
        console.log('No subject found with the classCode:', classCode);
      }
    } catch (error) {
      console.error("Error updating subject totals:", error);
    }
  };

  const setStatus = (studentName, status) => {
    setSelectedStudent({ name: studentName, status });
    console.log("Setting status for", studentName, status);
    submitAttendance(status);
  };  

  const submitAttendance = async (status) => {
      console.log(`Starting attendance submission process for status: ${status}`);
  
      if (!selectedStudent) {
        console.log('No student selected for attendance submission.');
        return;
      }
      console.log(`Selected student for attendance submission: ${selectedStudent.name}`);
      const querySnapshot = await firebase.firestore().collection('subjects')
        .where('classCode', '==', classCode).get();

      console.log(`Query for subjects with classCode ${classCode} returned ${querySnapshot.size} results`);

      if (!querySnapshot.empty) {
        const subjectDoc = querySnapshot.docs[0];
        console.log(`Subject found: ${subjectDoc.id}`);
        const studentsCollectionRef = subjectDoc.ref.collection(classCode);

        const studentQuerySnapshot = await studentsCollectionRef.where('name', '==', selectedStudent.name).get();

        console.log(`Query for student with name ${selectedStudent.name} returned ${studentQuerySnapshot.size} results`);

        if (!studentQuerySnapshot.empty) {
          const studentDoc = studentQuerySnapshot.docs[0];
          console.log(`Student document found: ${studentDoc.id}`);
          const studentDocRef = studentDoc.ref;
          let attendance = studentDoc.data().attendance || [0, 0, 0, 0];

          console.log(`Current attendance data: ${attendance}`);
          const statusIndexMap = { present: 0, absent: 1, excuse: 2, late: 3 };
          const index = statusIndexMap[status];

          if (index !== undefined) {
            const existingIndex = attendance.findIndex(value => value === 1);
            console.log(`Existing attendance index: ${existingIndex}`);
            if (existingIndex !== -1 && existingIndex !== index) {
              console.log('Attempting to change attendance status.');
              // Use React Native Alert instead of confirm
              Alert.alert(
                'Change Attendance', // Alert Title
                'You want to change attendance?', // Alert Message
                [
                  {
                    text: 'Cancel',
                    onPress: () => console.log('User canceled attendance change.'),
                    style: 'cancel',
                  },
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('User confirmed attendance change.');
                      attendance[existingIndex] = 0; // Reset previous attendance
                      attendance[index] = 1; // Set new attendance
                      // Proceed to update the document
                      studentDocRef.update({
                        attendance: attendance
                      });
                    },
                  },
                ],
                { cancelable: false }
              );
            } else if (existingIndex === index) {
              Alert.alert('Attendance Update', 'Attendance is already updated.');
              console.log('Attendance already set to the selected status.');
              return;
            } else {
              console.log('Updating attendance to the selected status.');
              attendance[index] = 1; // No existing 1, so just update
            }

            // Proceed to update the document
            studentDocRef.update({
              attendance: attendance
            }).then(() => {
              alert('Attendance updated successfully.');
              setSelectedWeek('');
            }).catch((error) => {
              console.error("Error updating document:", error);
            });
          } else {
            console.log('Invalid status provided:', status);
          }
        } else {
          console.log('No student found with the name:', selectedStudent.name);
        }
      } else {
        console.log('No subject found with the classCode:', classCode);
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
            <Text style={styles.headerText}>Class Code: {classCode}</Text>

            <Text style={styles.headerText}>Day & Month: {period}</Text>

            <Text style={styles.headerText}>Instructor: {fullName}</Text>
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
                  onPress={() => {
                    console.log('Status button pressed: ' + status);
                    if (!item.statusChanged) {
                      setStatus(item.name, status);
                    } else {
                      Alert.alert(
                        "Change Attendance Record",
                        "Change the student's attendance record?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { text: "OK", onPress: () => setStatus(item.name, status) }
                        ]
                      );
                    }
                  }}
                >
                  <Text style={styles.statusText}>{status.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            <TouchableOpacity style={styles.button} onPress={() => setShowModal(!showModal)}>
              <Text style={styles.buttonText}>Set Day and Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={fetchDataAndGeneratePDF}>
              <Text style={styles.buttonText}>Generate and Print PDF File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={fetchCurrentData}>
              <Text style={styles.buttonText}>View Record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={submitFinalAttendanceForAll}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        }
        
        contentContainerStyle={styles.container}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => {
          setShowModal(!showModal);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Day and Month:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setPeriodValue} 
              value={periodValue} 
              placeholder="E.g. June 26"
            />
            <TouchableOpacity
              style={[styles.submitButton]}
              onPress={() => {
                console.log("Submitted Day:", periodValue, );
                addPeriodValue(periodValue);
                setShowModal(!showModal);
              }}
            >
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
