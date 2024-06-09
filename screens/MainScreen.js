import React, { useState, useEffect } from 'react';
import { Button, Modal, Alert, ImageBackground, View, TouchableOpacity, Text, StyleSheet, Dimensions, Image, BackHandler } from 'react-native';
import { TextInput } from 'react-native-paper';
import { firebase } from './FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars'; 

const { width, height } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const backAction = async () => {
      Alert.alert("Hold on!", "Are you sure you want to log out?", [
        {
          text: "No",
          onPress: () => null,
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            await firebase.auth().signOut();
            navigation.navigate('Login');
          }
        }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    const fetchEmail = async () => {
      const email = await AsyncStorage.getItem('email'); 
      setUserEmail(email || 'No Email'); 
    };

    fetchEmail();

    return () => backHandler.remove();
  }, []);

  const handleDayPress = (day) => {
    console.log('selected day', day);
    setSelectedDayEvents(["Event 1", "Event 2"]);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={styles.userSection}>
          <Image source={require('../assets/icons/profilelogo.png')} style={styles.userImage} />
          <Text style={styles.userName}>{userEmail}</Text>
        </View>
      </View>
      <View style={styles.schoolYearContainer}>
        <Text style={styles.schoolYearTitle}>SCHOOL YEAR</Text>
        <Text style={styles.schoolYear}>2023 - 2024</Text>
      </View>

      <Calendar
        style={{ marginTop: 20 }}
        onDayPress={handleDayPress}
        markedDates={{
          '2023-05-16': {selected: true, marked: true, selectedColor: 'blue'},
        }}
      />

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
            <Text style={styles.modalText}>Events:</Text>
            {selectedDayEvents.map((event, index) => (
              <Text key={index} style={styles.eventText}>{event}</Text>
            ))}
            <Button
              title="Close"
              onPress={() => setModalVisible(!isModalVisible)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain unchanged

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    header: {
      height: '18%',
      width: '100%',
      backgroundColor: '#1e69c4',
      borderRadius: 15,
    },
    headerTitle: {
      fontSize: width * 0.05,
      color: 'white',
      alignSelf: 'flex-start', 
      marginLeft: width * 0.05,
      marginTop: height * 0.05, 
    },
    userSection: {
      flexDirection: 'row', 
      marginLeft: width * 0.075,
      marginTop: 5,
    },
    userImage: {
      width: 50, 
      height: 50,
      borderRadius: 30, 
      marginRight: 10, 
    },
    userName: {
      fontSize: width * 0.05,
      marginTop: height * 0.005,
      color: '#000',
      backgroundColor: 'white',
      fontWeight: 'bold',
      padding: 10,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    schoolYearContainer: {
      backgroundColor: 'white',
      alignItems: 'center',
      padding: 20,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    schoolYearTitle: {
      fontSize: width * 0.09,
      color: '#000',
      fontWeight: 'bold',
    },
    schoolYear: {
      fontSize: width * 0.07,
      color: '#737373',
      marginTop: 5,
    },
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 50,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    modalText: {
      fontSize: width * 0.05,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: "center"
    },
    eventText: {
      fontSize: 16,
      marginBottom: 15,
    }
  });