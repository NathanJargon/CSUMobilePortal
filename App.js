import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 

import HomeScreen from './screens/MainScreen';
import CalendarScreen from './screens/CalendarScreen';
import StudentsScreen from './screens/StudentsScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs() {
  const navigation = useNavigation(); 

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Students" component={StudentsScreen} />
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
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}