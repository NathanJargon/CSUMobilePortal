import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, Modal, View, Text, StyleSheet, Dimensions, BackHandler } from 'react-native';
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
  
  useEffect(() => {
    const checkIfSubjectBelongsToUser = async () => {
      const userEmail = await AsyncStorage.getItem('email');
      if (!userEmail) {
        console.log("User email not found.");
        return;
      }

      const querySnapshot = await firebase.firestore()
        .collection('subjects')
        .where('employeeId', '==', userEmail)
        .get();

      if (querySnapshot.empty) {
        console.log("No subjects found for this user.");
        return;
      }

      for (const doc of querySnapshot.docs) {
        console.log(`Subject ID: ${doc.id}, Name: ${doc.data().name}, Class Code: ${doc.data().classCode} belongs to the user.`);
        setSelectedSubjectId(doc.id);
        // Assuming you have a state setter for classCode
        setClassCode(doc.data().classCode);
        console.log("Class Code:", classCode);
        break; // This will only set the classCode for the first subject found, remove break if you want to set it for the last
      }
    };

    checkIfSubjectBelongsToUser();
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

      // Fetch students from the subcollection named after classCode
      try {
        const studentsSnapshot = await firebase.firestore()
          .collection('subjects')
          .doc(doc.id)
          .collection(subject.classCode)
          .get();

        const students = studentsSnapshot.empty ? [] : studentsSnapshot.docs.map(studentDoc => ({
          id: studentDoc.id,
          ...studentDoc.data(),
        }));

        return { ...subject, students };
      } catch (error) {
        console.error("Error fetching students for subject:", subject.id, error);
        return { ...subject, students: [] };
      }
    }));

    setSubjects(subjectsData);
  };

  useEffect(() => {
    fetchSubjectsAndStudents();
  }, []);

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

      // Use the class code as the name of the subcollection
      const classCode = subjectDoc.data().classCode;

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
    setEditModalVisible(true);
  };

  const updateStudentInFirestore = async (newName, newGrade) => {
    if (!selectedSubjectId || !selectedStudent || !selectedStudent.documentId) {
      console.error("Missing information to update student.");
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

  // Update the updateStudentDetails function to use updateStudentInFirestore
  const updateStudentDetails = () => {
    if (!selectedStudent) {
      console.error("No student selected for update.");
      return;
    }

    // Assuming you have inputs in your modal that update selectedStudent's name and grade
    updateStudentInFirestore(selectedStudent.name, selectedStudent.grade)
      .then(() => {
        setEditModalVisible(false); // Close the modal on success
      })
      .catch((error) => {
        console.error("Failed to update student details: ", error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GRADES</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add Student</Text>
      </TouchableOpacity>
      {subjects.map((subject) => (
        <View key={subject.id} style={styles.subjectContainer}>
          {subject.students.map((student) => (
            <TouchableOpacity key={student.id} onPress={() => handleStudentPress(student)}>
              <View style={styles.studentRow}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentGrade}>{student.grade}%</Text>
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