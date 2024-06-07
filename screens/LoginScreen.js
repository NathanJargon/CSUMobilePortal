import React, { useState, useEffect } from 'react';
import { Image, ImageBackground, View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Checkbox, TextInput } from 'react-native-paper';
import { firebase } from './FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import loginbg from '../assets/loginbg.jpg'; 
import logo from '../assets/logo.png';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const savedEmail = await AsyncStorage.getItem('email');
      const savedPassword = await AsyncStorage.getItem('password');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRemember(true);
        firebase
          .auth()
          .signInWithEmailAndPassword(savedEmail, savedPassword)
          .then((response) => {
            navigation.navigate('Home');
          })
          .catch((error) => {
            // Handle login error here
          });
      }
    };
    checkLogin();

    const authListener = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        navigation.navigate('Home');
      }
    });

    return () => authListener();
  }, []);

  
  const onLogin = () => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((response) => {
        if (remember) {
          AsyncStorage.setItem('email', email);
          AsyncStorage.setItem('password', password);
        } else {
          AsyncStorage.removeItem('email');
          AsyncStorage.removeItem('password');
        }
        navigation.navigate('Home');
      })
      .catch((error) => {
        switch (error.code) {
          case 'auth/invalid-email':
            alert('The email address is badly formatted.');
            break;
          case 'auth/user-disabled':
            alert('The user corresponding to the given email has been disabled.');
            break;
          case 'auth/user-not-found':
            alert('There is no user corresponding to the given email.');
            break;
          case 'auth/wrong-password':
            alert('The password is invalid for the given email.');
            break;
          default:
            alert('Email and password is incorrect. Sign up if you do not have an account.');
        }
      });
  };


  
  return (
    <ImageBackground source={loginbg} style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <View style={{alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.welcomeTextPrimary}>WELCOME TO</Text>
        <Text style={styles.welcomeTextSecondary}>COLLEGE OF INFORMATION AND{'\n'}COMPUTING SCIENCES TEACHERS PORTAL</Text>
      </View>
      <View style={styles.bottomBox}>
        <TextInput
          label="Teacher/User ID"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { backgroundColor: 'transparent' }]}
          mode="flat"
          theme={{ colors: { underlineColor:'transparent', background :'transparent' }}}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: 'transparent' }]}
          mode="flat"
          theme={{ colors: { underlineColor:'transparent', background :'transparent' }}}
        />
        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  logo: {
    alignSelf: 'center', 
    marginBottom: height * 0.01, 
    width: 200,
    height: 200,
  },
  bottomBox: {
    height: height * 0.45,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    overflow: 'hidden',
    borderRadius: 10,
  },
  input: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  button: {
    height: height * 0.075,
    justifyContent: 'center',
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 10,
    marginTop: height * 0.065,
    elevation: 5,
  },
  buttonText: {
    fontSize: width * 0.05,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  welcomeTextPrimary: {
    textAlign: 'center',
    color: '#950f0f',
    fontSize: width * 0.1, 
    fontWeight: 'bold',
    marginBottom: 5, 
  },
  welcomeTextSecondary: {
    textAlign: 'center',
    color: 'black', 
    fontSize: width * 0.055,
    fontWeight: 'bold',
  },
});