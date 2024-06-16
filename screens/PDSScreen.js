import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'; 

export default function PDSScreen({ navigation }) {
  const buttons = [
    'Personal Information',
    'Family Background',
    'Name of Children',
    'Educational Background',
    'Civil Service Eligibility',
    'Work Experience',
    'Voluntary Work or Involvement',
    'Learning and Development',
    'Other Information',
  ];

  const handlePress = (buttonTitle) => {
    console.log(buttonTitle);
    switch (buttonTitle) {
      case 'Personal Information':
      case 'Family Background':
      case 'Name of Children':
      case 'Educational Background':
      case 'Civil Service Eligibility':
      case 'Work Experience':
      case 'Voluntary Work or Involvement':
      case 'Learning and Development':
      case 'Other Information':
        console.log('Navigating with button title:', buttonTitle);
        navigation.navigate('PDSDetail', { screen: buttonTitle });
        break;
      default:
        console.warn('Unknown button title');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {buttons.map((buttonTitle, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handlePress(buttonTitle)}
        >
          <Text style={styles.buttonText}>{buttonTitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    width: '80%',
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
});