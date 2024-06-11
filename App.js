import React from 'react';
import { Image, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { firebase } from './screens/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './screens/MainScreen';
import StudentsScreen from './screens/StudentsScreen';
import LoginScreen from './screens/LoginScreen';
import ClassesScreen from './screens/ClassesScreen';
import SubjectScreen from './screens/SubjectScreen';
import ScheduleScreen from './screens/ScheduleScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SubjectStack = createStackNavigator();

const saveDtrRecord = async (email) => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // Format as HH:MM:SS
  const isMorning = now.getHours() < 12;

  let dtrUpdate = isMorning ? { amOut: time } : { pmOut: time };
  const documentName = `${email}-${date}`;
  const docRef = firebase.firestore().collection('dtr').doc(documentName);

  try {
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update(dtrUpdate);
      console.log('DTR record updated successfully with name:', documentName);
    } else {
      console.error('DTR record does not exist for today.');
    }
  } catch (error) {
    console.error('Error saving DTR record: ', error);
  }
};

function MyTabs() {
  const navigation = useNavigation(); 

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/home.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/schedule.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Classes" 
        component={ClassesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/calendar.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="Log Out"
        component={LoginScreen} 
        listeners={{
          tabPress: e => {
            e.preventDefault(); 
            Alert.alert(
              "Log Out", 
              "Are you sure you want to log out?", 
              [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", onPress: async () => {
                  try {
                    const userEmail = await AsyncStorage.getItem('email');
                    if (userEmail) {
                      await saveDtrRecord(userEmail);
                      navigation.navigate('Login');
                    } else {
                      console.error('No email found in AsyncStorage.');
                    }
                  } catch (error) {
                    console.error('Error during logout: ', error);
                  }
                }},
              ]
            );
          },
        }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/logout.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function SubjectStackScreen() {
  return (
    <SubjectStack.Navigator screenOptions={{ headerShown: false }}>
      <SubjectStack.Screen name="SubjectDetails" component={SubjectScreen} />
      {/* You can add more screens here that should be accessible from SubjectScreen */}
    </SubjectStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main" 
          component={MyTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Subject" 
          component={SubjectStackScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}