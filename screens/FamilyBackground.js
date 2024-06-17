import React, { useState, useEffect } from 'react';
import { Alert, View, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { TextInput, Button, Text, RadioButton, Menu, Provider } from 'react-native-paper';
import { firebase } from './FirebaseConfig';

export default function FamilyBackgroundPage({ navigation }) {
  const [form, setForm] = useState({
    spouseLastName: '',
    spouseFirstName: '',
    spouseMiddleName: '',
    spouseExt: '',
    spouseOccupation: '',
    spouseEmployer: '',
    spouseBusinessAddress: '',
    spouseTelNo: '',
    fatherLiving: 'Living',
    fatherLastName: '',
    fatherFirstName: '',
    fatherMiddleName: '',
    fatherExt: '',
    motherLiving: 'Living',
    motherMaidenName: '',
    motherFirstName: '',
    motherMiddleName: '',
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
      await docRef.collection('familyBackground').doc('info').set(form);
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
        <Text style={styles.header}>Family Background</Text>
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
          label="Spouse Last Name"
          value={form.spouseLastName}
          onChangeText={text => handleInputChange('spouseLastName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Spouse First Name"
          value={form.spouseFirstName}
          onChangeText={text => handleInputChange('spouseFirstName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Spouse Middle Name"
          value={form.spouseMiddleName}
          onChangeText={text => handleInputChange('spouseMiddleName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Spouse Extension"
          value={form.spouseExt}
          onChangeText={text => handleInputChange('spouseExt', text)}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Father's Last Name"
          value={form.fatherLastName}
          onChangeText={text => handleInputChange('fatherLastName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Father's First Name"
          value={form.fatherFirstName}
          onChangeText={text => handleInputChange('fatherFirstName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Father's Middle Name"
          value={form.fatherMiddleName}
          onChangeText={text => handleInputChange('fatherMiddleName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Father's Extension"
          value={form.fatherExt}
          onChangeText={text => handleInputChange('fatherExt', text)}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Mother's Maiden Name"
          value={form.motherMaidenName}
          onChangeText={text => handleInputChange('motherMaidenName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Mother's First Name"
          value={form.motherFirstName}
          onChangeText={text => handleInputChange('motherFirstName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Mother's Middle Name"
          value={form.motherMiddleName}
          onChangeText={text => handleInputChange('motherMiddleName', text)}
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