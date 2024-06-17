import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'; // Import TouchableOpacity
import { firebase } from './FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function ClassesScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const editIcon = require('../assets/icons/edit.png');

  useEffect(() => {
    const fetchSubjectsAndUpdateGradePercentage = async () => {
      const email = await AsyncStorage.getItem('email');
      if (!email) return;

      const querySnapshot = await firebase.firestore()
        .collection('subjects')
        .where('employeeId', '==', email)
        .get();

      let subjectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update subjectsData with gradeRatio for each subject
      subjectsData = await Promise.all(subjectsData.map(async (subject) => {
        const gradeRatio = await updateGradePercentage(subject.id, subject.classCode);
        return { ...subject, gradeRatio }; // Add gradeRatio to each subject
      }));

      setSubjects(subjectsData);
    };

    fetchSubjectsAndUpdateGradePercentage();
  }, []);

  const updateGradePercentage = async (selectedSubjectId, classCode) => {
    try {
      const studentsRef = firebase.firestore().collection('subjects').doc(selectedSubjectId).collection(classCode);
      const snapshot = await studentsRef.get();
      const totalDocuments = snapshot.docs.length;
      const documentsWithGrades = snapshot.docs.filter(doc => doc.data().grade && doc.data().grade.trim() !== '').length;
      const gradeRatio = `${documentsWithGrades}/${totalDocuments}`;
      console.log(`Grade ratio for subjectId: ${selectedSubjectId}, classCode: ${classCode} is ${gradeRatio}`);
      return gradeRatio; // Return the gradeRatio
    } catch (error) {
      console.error("Error calculating grade ratio: ", error);
      return '0/0'; // Return a default value in case of error
    }
  };

  const handlePress = async (subject) => {
    try {
      await AsyncStorage.setItem('classCode', subject.classCode); // Save classCode in AsyncStorage
      navigation.navigate('Subject'); 
    } catch (error) {
      console.error("Error saving classCode to AsyncStorage: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CLASSES</Text>
      </View>
        {subjects.map((subject) => (
          <TouchableOpacity 
            key={subject.id} 
            style={styles.subjectContainer} 
            onPress={() => handlePress(subject)} 
          >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingEnd: 5 }}>
            <Image source={editIcon} style={styles.editIcon} />
            <Text style={styles.classCode}>{subject.classCode}</Text>
          </View>
          <View style={styles.gradeProgress}>
            <Text style={styles.gradeProgressText}>Grade Progress</Text>
            <Text style={styles.gradeProgressText}>
              {(() => {
                const [earnedPoints, totalPoints] = subject.gradeRatio ? subject.gradeRatio.split('/').map(Number) : [0, 0];
                if (totalPoints === 0) return 'N/A';
                const percentage = (earnedPoints / totalPoints) * 100;
                return `${percentage.toFixed(0)}%`;
              })()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  editIcon: {
    marginTop: height * 0.01,
    marginLeft: width * 0.05,
    marginRight: width * 0.05,
    width: 20, // Adjust the size as needed
    height: 20, // Adjust the size as needed
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
  subjectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  classCode: {
    fontSize: height * 0.05,
    fontWeight: 'bold',
  },
  gradeProgress: {
    alignItems: 'flex-end',
  },
  gradeProgressText: { // New style for the text inside gradeProgress
    fontSize: height * 0.02, // Adjust the size as needed
    fontWeight: 'bold',
  },
});