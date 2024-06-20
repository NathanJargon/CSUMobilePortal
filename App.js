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
import DTRScreen from './screens/DTRScreen';
import PDSScreen from './screens/PDSScreen';
import PersonalInformationPage from './screens/PersonalInformation';
import FamilyBackgroundPage from './screens/FamilyBackground';
import ChildrenPage from './screens/ChildrenPage';
import EducationPage from './screens/EducationPage';
import CivilPage from './screens/CivilPage';
import WorkPage from './screens/WorkPage';
import VoluntaryPage from './screens/VoluntaryPage';
import LearningPage from './screens/LearningPage';
import OtherPage from './screens/OtherPage';
import AttendancePage from './screens/AttendancePage';
import PDFViewer from './screens/PDFViewer';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SubjectStack = createStackNavigator();
const PDSStack = createStackNavigator();

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
        name="DTR" 
        component={DTRScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/dtr.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />

      <Tab.Screen 
        name="PDS" 
        component={PDSScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/information-button.png')} style={{ width: size, height: size, tintColor: color }} />
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
      <SubjectStack.Screen name="Attendance" component={AttendancePage} />
      <SubjectStack.Screen name="PDFViewer" component={PDFViewer} />
    </SubjectStack.Navigator>
  );
}

function PDSStackScreen({ route }) {
  const initialRouteName = route.params?.screen || 'Personal Information';
  console.log("Route Name:", initialRouteName);

  return (
    <PDSStack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <PDSStack.Screen name="Personal Information" component={PersonalInformationPage} />
      <PDSStack.Screen name="Family Background" component={FamilyBackgroundPage} />
      <PDSStack.Screen name="Name of Children" component={ChildrenPage} />
      <PDSStack.Screen name="Educational Background" component={EducationPage} />
      <PDSStack.Screen name="Civil Service Eligibility" component={CivilPage} />
      <PDSStack.Screen name="Work Experience" component={WorkPage} />
      <PDSStack.Screen name="Voluntary Work or Involvement" component={VoluntaryPage} />
      <PDSStack.Screen name="Learning and Development" component={LearningPage} />
      <PDSStack.Screen name="Other Information" component={OtherPage} />
      {/* Add more screens here */}
    </PDSStack.Navigator>
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
        <Stack.Screen 
          name="PDSDetail" 
          component={PDSStackScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}