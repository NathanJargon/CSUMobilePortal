import React, { useState, useEffect } from 'react';
import { Alert, View, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { TextInput, Button, Text, RadioButton, Menu, Provider } from 'react-native-paper';
import { firebase } from './FirebaseConfig';

export default function WorkPage({ navigation }) {
  const [form, setForm] = useState({
    from: '',
    to: '',
    positionTitle: '',
    departmentAgencyOfficeCompany: '',
    monthlySalary: '',
    salaryGrade: '',
    statusOfAppointment: '',
    govtService: ''
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
    const db = firebase.firestore();
    const docRef = db.collection('pds').doc(selectedDocumentName);

    try {
      await docRef.collection('work').doc('info').set(form);
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
        <Text style={styles.header}>Work Experience</Text>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<Button onPress={openMenu}>Select Document to Update</Button>}>
          {documents.map((doc) => (
            <Menu.Item key={doc.id} onPress={() => setSelectedDocumentName(doc.id)} title={doc.id} />
          ))}
        </Menu>
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
          label="Position Title"
          value={form.positionTitle}
          onChangeText={text => handleInputChange('positionTitle', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Department/Agency/Office/Company"
          value={form.departmentAgencyOfficeCompany}
          onChangeText={text => handleInputChange('departmentAgencyOfficeCompany', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Monthly Salary"
          value={form.monthlySalary}
          onChangeText={text => handleInputChange('monthlySalary', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Salary/Job/Pay Grade (if applicable)"
          value={form.salaryGrade}
          onChangeText={text => handleInputChange('salaryGrade', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Status of Appointment"
          value={form.statusOfAppointment}
          onChangeText={text => handleInputChange('statusOfAppointment', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="If Government Service (Yes/No)"
          value={form.govtService}
          onChangeText={text => handleInputChange('govtService', text)}
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