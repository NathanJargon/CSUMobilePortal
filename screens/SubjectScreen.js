import React, { useState, useEffect } from 'react';
import { TextInput, Image, TouchableOpacity, Modal, View, Text, StyleSheet, Dimensions, BackHandler } from 'react-native';
import { firebase } from './FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SubjectScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classCode, setClassCode] = useState(''); 
  const editIcon = require('../assets/icons/edit.png');

  useEffect(() => {
    const getSubjectFromStorage = async () => {
      try {
        const foundClassCode = await AsyncStorage.getItem('classCode');
        // Ensure classCode is treated as a string
        if (foundClassCode) setClassCode(foundClassCode.toString());
        console.log(foundClassCode)
      } catch (error) {
        console.error("Error retrieving subject from AsyncStorage:", error);
      }
    };
  
    getSubjectFromStorage();
  }, []);

  const fetchSubjectsAndStudents = async () => {
    const email = await AsyncStorage.getItem('email');
    if (!email) return;

    const querySnapshot = await firebase.firestore()
      .collection('subjects')
      .where('employeeId', '==', email)
      .get();

    const subjectsData = await Promise.all(querySnapshot.docs.map(async doc => {
      const subject = {
        id: doc.id,
        ...doc.data(),
      };

      if (subject.classCode === classCode) {
        console.log(subject);
        setSelectedSubjectId(subject.id);
      }

      // Fetch students for the subject based on its classCode
      try {
        const studentsSnapshot = await firebase.firestore()
          .collection('subjects')
          .doc(doc.id)
          .collection(classCode) // Use the classCode to specify the subcollection
          .get();
      
        let students = studentsSnapshot.empty ? [] : studentsSnapshot.docs.map(studentDoc => ({
          id: studentDoc.id,
          ...studentDoc.data(),
        }));
      
        // Sort students by name, case-insensitive
        students.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      
        return { ...subject, students };
      } catch (error) {
        return { ...subject, students: [] };
      }
    }));

    setSubjects(subjectsData);
  };

  useEffect(() => {
    fetchSubjectsAndStudents();
  }, [classCode]);

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Main'); // Navigate back to the Main screen
      return true; // Prevent default action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove(); 
  }, [navigation]); 

  const submitStudent = async () => {
    console.log(`Submitting student: Name - ${studentName}, Grade - ${studentGrade}, Subject ID - ${selectedSubjectId}`);
    try {
      await addStudentToSubjectBasedOnClassCode(studentName, studentGrade);
      setStudentName('');
      setStudentGrade('');
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to add student: ", error);
    }
  };
  
  const addStudentToSubjectBasedOnClassCode = async (studentName, studentGrade) => {
    if (!selectedSubjectId || studentName === '' || studentGrade === '') {
      console.error("All fields are required.");
      return;
    }
  
    try {
      const email = await AsyncStorage.getItem('email');
      console.log(`Email from AsyncStorage: ${email}`);
      if (!email) {
        console.error("No email found in AsyncStorage.");
        return;
      }

      const subjectsRef = firebase.firestore().collection('subjects');
      const subjectDoc = await subjectsRef.doc(selectedSubjectId).get();

      if (!subjectDoc.exists) {
        console.error("No matching subject found for the given ID.");
        return;
      }

      // This line will create the subcollection and document if they don't exist
      const docRef = await subjectsRef.doc(selectedSubjectId).collection(classCode).add({
        name: studentName,
        grade: studentGrade,
        classCode: classCode,
      });

      console.log("Student added successfully to the subject.");

      // Now docRef is defined, so we can use it
      await subjectsRef.doc(selectedSubjectId).collection(classCode).doc(docRef.id).update({
        documentId: docRef.id,
      });

      await fetchSubjectsAndStudents();
    } catch (error) {
      console.error("Error adding student to subject: ", error);
    }
  };

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    console.log("Student selected: ", student);
    setEditModalVisible(true);
  };

  const updateStudentInFirestore = async (newName, newGrade) => {
    console.log(`Selected Subject ID: ${selectedSubjectId}`);
    console.log(`Selected Student: `, selectedStudent);
    console.log(`Selected Student Document ID: ${selectedStudent ? selectedStudent.documentId : 'undefined'}`);

    if (!selectedStudent || !selectedStudent.documentId) {
      console.log("Missing information to update student.");
      return;
    }

    if (!classCode) {
      console.error("classCode is undefined or empty.");
      return;
    }

    const studentId = selectedStudent.documentId;

    try {
      const subjectsRef = firebase.firestore().collection('subjects');
      await subjectsRef
        .doc(selectedSubjectId)
        .collection(classCode)
        .doc(studentId)
        .update({
          name: newName,
          grade: newGrade,
          classCode: classCode,
        });

      console.log("Student updated successfully.");
      await fetchSubjectsAndStudents(); // Refresh your data
    } catch (error) {
      console.error("Error updating student: ", error);
    }
  };

  const updateStudentDetails = () => {
    if (!selectedStudent) {
      console.error("No student selected for update.");
      return;
    }

    updateStudentInFirestore(selectedStudent.name, selectedStudent.grade)
      .then(() => {
        setEditModalVisible(false); 
      })
      .catch((error) => {
        console.error("Failed to update student details: ", error);
      });
  };

  const handlePress = async () => {
    try {
      await AsyncStorage.setItem('classCode', classCode);
      navigation.navigate('Attendance', { subjects });
    } catch (error) {
      console.error('Error saving classCode to AsyncStorage:', error);
    }
  };

  return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>GRADES</Text>
    </View>
    <TouchableOpacity
      style={styles.addButton}
      onPress={handlePress}
    >
      <Text style={styles.addButtonText}>Check Attendance</Text>
    </TouchableOpacity>
    <View style={styles.headerRow}>
      <Text style={styles.nameTitle}>Name</Text>
      <Text style={styles.gradeTitle}>Grade</Text>
    </View>
    {subjects.map((subject) => (
      <View key={subject.id} style={styles.subjectContainer}>
        {subject.students.map((student) => (
          <TouchableOpacity key={student.id} onPress={() => handleStudentPress(student)}>
            <View style={styles.studentRow}>
              <Image source={editIcon} style={styles.editIcon} />
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentGrade}>{student.grade}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    ))}

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
            <TextInput
              placeholder="Student Name"
              value={studentName}
              onChangeText={setStudentName}
              style={styles.input}
            />
            <TextInput
              placeholder="Grade"
              value={studentGrade}
              onChangeText={setStudentGrade}
              style={styles.input}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitStudent}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => {
        setEditModalVisible(!editModalVisible);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TextInput
            placeholder="Student Name"
            value={selectedStudent ? selectedStudent.name : ''}
            onChangeText={(text) => setSelectedStudent({...selectedStudent, name: text})}
            style={styles.input}
          />
          <TextInput
            placeholder="Grade"
            value={selectedStudent ? String(selectedStudent.grade) : ''}
            onChangeText={(text) => setSelectedStudent({...selectedStudent, grade: text})}
            style={styles.input}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={updateStudentDetails}
          >
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setEditModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  editIcon: {
    width: 20, // Adjust the size as needed
    height: 20, // Adjust the size as needed
    marginRight: 10, // Adds some space between the icon and the name
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
  gradeTitle: {
    fontSize: 30,
    color: 'black',
    fontWeight: 'bold'
  },
  nameTitle: {
    fontSize: 30,
    color: 'black',
    fontWeight: 'bold'
  },
  headerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25, // Adjust padding as needed
    marginBottom: 10, // Space before the list starts
  },
  gradeProgress: {
    alignItems: 'flex-end',
  },
  gradeProgressText: { // New style for the text inside gradeProgress
    fontSize: height * 0.02, // Adjust the size as needed
    fontWeight: 'bold',
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
  addButton: {
    backgroundColor: '#1e69c4', // Example button color
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  addButtonText: {
    color: 'white', // Example text color
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50', // Example submit button color
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white', // Text color for submit button
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336', // Example cancel button color
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white', // Text color for cancel button
    fontWeight: 'bold',
  },
  subjectContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1, // Add a bottom border to each student row
    borderBottomColor: '#ddd', // Color of the border
  },
  studentName: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  classCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});