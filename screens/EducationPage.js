import React, { useState, useEffect } from 'react';
import { Alert, View, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { TextInput, Button, Text, RadioButton, Menu, Provider } from 'react-native-paper';
import { firebase } from './FirebaseConfig';

export default function EducationPage({ navigation }) {
  const [form, setForm] = useState({ level: "", schoolName: "", degree: "", fromYear: "", toYear: "", highestLevelEarned: "", yearGraduated: "", honorsReceived: "" });
  const [menuVisible, setMenuVisible] = useState(false);
  const [levelMenuVisible, setLevelMenuVisible] = useState(false);
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
    const db = firebase.firestore();
    const docRef = db.collection('pds').doc(selectedDocumentName);

    try {
      await docRef.collection('educations').doc('info').set(form);
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
  const openLevelMenu = () => setLevelMenuVisible(true);
  const closeLevelMenu = () => setLevelMenuVisible(false);

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Education Background</Text>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<Button onPress={openMenu}>Select Document to Update</Button>}>
          {documents.map((doc) => (
            <Menu.Item key={doc.id} onPress={() => setSelectedDocumentName(doc.id)} title={doc.id} />
          ))}
        </Menu>
        <Button onPress={openLevelMenu}>Select Level</Button>
        <Menu
          visible={levelMenuVisible}
          onDismiss={closeLevelMenu}
          anchor={<Text>{form.level || "Select Level"}</Text>}>
          {["Elementary", "Secondary", "Vocational", "College", "Graduate Studies"].map((level) => (
            <Menu.Item key={level} onPress={() => { setForm({ ...form, level }); closeLevelMenu(); }} title={level} />
          ))}
        </Menu>
        <TextInput
          label="School Name"
          value={form.schoolName}
          onChangeText={(text) => handleInputChange("schoolName", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Degree"
          value={form.degree}
          onChangeText={(text) => handleInputChange("degree", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="From Year"
          value={form.fromYear}
          onChangeText={(text) => handleInputChange("fromYear", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="To Year"
          value={form.toYear}
          onChangeText={(text) => handleInputChange("toYear", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Highest Level Earned"
          value={form.highestLevelEarned}
          onChangeText={(text) => handleInputChange("highestLevelEarned", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Year Graduated"
          value={form.yearGraduated}
          onChangeText={(text) => handleInputChange("yearGraduated", text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Honors Received"
          value={form.honorsReceived}
          onChangeText={(text) => handleInputChange("honorsReceived", text)}
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