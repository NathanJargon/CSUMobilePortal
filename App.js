import React from 'react';
import { Image, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import HomeScreen from './screens/MainScreen';
import StudentsScreen from './screens/StudentsScreen';
import LoginScreen from './screens/LoginScreen';
import ClassesScreen from './screens/ClassesScreen';
import SubjectScreen from './screens/SubjectScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SubjectStack = createStackNavigator();

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
        name="Classes" 
        component={ClassesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/calendar.png')} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image source={require('./assets/icons/user.png')} style={{ width: size, height: size, tintColor: color }} />
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
                { text: "Log Out", onPress: () => navigation.navigate('Login') },
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