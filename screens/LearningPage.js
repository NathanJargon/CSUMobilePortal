import React, { useState, useEffect } from 'react';
import { Alert, View, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { TextInput, Button, Text, RadioButton, Menu, Provider } from 'react-native-paper';
import { firebase } from './FirebaseConfig';

export default function LearningPage({ navigation }) {
  const [form, setForm] = useState({
    learningDevelopment: '',
    from: '',
    to: '',
    noOfHours: '',
    typeOfLD: '',
    conductedBy: '',
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentName, setSelectedDocumentName] = useState('');

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('PDS');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleInputChange = (name, value) => {
    if (name === 'from' || name === 'to') {
      const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(value);
      if (!isValidFormat) {
        Alert.alert("Invalid Date Format", "Please use 'YYYY-MM-DD' format.");
        return;
      }
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!selectedDocumentName) {
      Alert.alert("Error", "Please select a document to update.");
      return;
    }
    
    const db = firebase.firestore();
    const docRef = db.collection('pds').doc(selectedDocumentName);

    try {
      await docRef.collection('learning').doc('info').set(form);
      Alert.alert("Success", "Your information has been successfully submitted.");
    } catch (error) {
      console.error("Error saving document: ", error);
      Alert.alert("Error", "There was a problem submitting your information.");
    }
  };

  const fetchDocuments = async () => {
    const db = firebase.firestore();
    const pdsCollectionRef = db.collection('pds');
    const snapshot = await pdsCollectionRef.get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDocuments(docs);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Learning and Development</Text>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Button onPress={openMenu}>
              {selectedDocumentName ? selectedDocumentName + "'s document will be updated" : 'Select Document to Update'}
            </Button>
          }>
          {documents.map((doc) => (
            <Menu.Item key={doc.id} onPress={() => setSelectedDocumentName(doc.id)} title={doc.id} />
          ))}
        </Menu>

        <TextInput
          label="Learning Development"
          value={form.learningDevelopment}
          onChangeText={text => handleInputChange('learningDevelopment', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="From"
          value={form.from}
          onChangeText={text => handleInputChange('from', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="To"
          value={form.to}
          onChangeText={text => handleInputChange('to', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Number of Hours"
          value={form.noOfHours}
          onChangeText={text => handleInputChange('noOfHours', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Type of LD"
          value={form.typeOfLD}
          onChangeText={text => handleInputChange('typeOfLD', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Conducted By"
          value={form.conductedBy}
          onChangeText={text => handleInputChange('conductedBy', text)}
          style={styles.input}
          mode="outlined"
        />

        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          Submit
        </Button>
      </ScrollView>
    </Provider>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 24,
    marginTop: 25,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
});