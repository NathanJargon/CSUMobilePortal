import React, { useState, useEffect } from 'react';
import { Alert, View, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { TextInput, Button, Text, RadioButton, Menu, Provider } from 'react-native-paper';
import { firebase } from './FirebaseConfig';

export default function PersonalInformationPage({ navigation }) {
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    ext: '', // Extension (e.g., Jr., Sr., III)
    dateOfBirth: '',
    placeOfBirth: '',
    sex: '',
    civilStatus: '',
    height: '',
    weight: '',
    bloodType: '',
    gsisNo: '',
    pagIbigNo: '',
    philHealthNo: '',
    sssNo: '',
    tinNo: '',
    telephoneNo: '',
    mobileNo: '',
    email: '',
    type: '',
    method: '',
    dualCitizenshipCountry: 'Philippines',
    residentialHouseBlockLotNo: '',
    residentialStreet: '',
    residentialSubdivision: '',
    residentialBarangay: '',
    residentialCityMunicipality: '',
    residentialProvince: '',
    residentialZipCode: '',
    // Permanent Address
    permanentHouseBlockLotNo: '',
    permanentStreet: '',
    permanentSubdivision: '',
    permanentBarangay: '',
    permanentCityMunicipality: '',
    permanentProvince: '',
    permanentZipCode: '',
  });

  const [sexMenuVisible, setSexMenuVisible] = useState(false);
  const [civilStatusMenuVisible, setCivilStatusMenuVisible] = useState(false);

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('PDS'); // Navigate back to the Main screen
      return true; // Prevent default action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove(); 
  }, [navigation]); 

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    const db = firebase.firestore();
    const pdsCollectionRef = db.collection('pds');

    try {
      // Check if a document with the name form.firstName already exists
      const docRef = pdsCollectionRef.doc(form.firstName);
      const docSnapshot = await docRef.get();

      if (docSnapshot.exists) {
        // If the document exists, update its personalInformation subcollection
        await docRef.collection('personalInformation').doc('info').set(form);
      } else {
        // If the document does not exist, create it and set the personalInformation subcollection
        await docRef.set({}); // Optionally initialize the document with some data
        await docRef.collection('personalInformation').doc('info').set(form);
      }

      Alert.alert("Success", "Your information has been successfully submitted.");
    } catch (error) {
      console.error("Error saving document: ", error);
      Alert.alert("Error", "There was a problem submitting your information.");
    }
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Personal Information</Text>
        <TextInput
          label="Last Name"
          value={form.lastName}
          onChangeText={text => handleInputChange('lastName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="First Name"
          value={form.firstName}
          onChangeText={text => handleInputChange('firstName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Middle Name"
          value={form.middleName}
          onChangeText={text => handleInputChange('middleName', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Extension"
          value={form.extension}
          onChangeText={text => handleInputChange('extension', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Date of Birth"
          value={form.dateOfBirth}
          onChangeText={text => handleInputChange('dateOfBirth', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Place of Birth"
          value={form.placeOfBirth}
          onChangeText={text => handleInputChange('placeOfBirth', text)}
          style={styles.input}
          mode="outlined"
        />

        <Menu
          visible={sexMenuVisible}
          onDismiss={() => setSexMenuVisible(false)}
          anchor={
            <Button onPress={() => setSexMenuVisible(true)}>{form.sex || "Select Sex"}</Button>
          }>
          <Menu.Item onPress={() => {handleInputChange('sex', 'Male'); setSexMenuVisible(false);}} title="Male" />
          <Menu.Item onPress={() => {handleInputChange('sex', 'Female'); setSexMenuVisible(false);}} title="Female" />
        </Menu>


        <Menu
          visible={civilStatusMenuVisible}
          onDismiss={() => setCivilStatusMenuVisible(false)}
          anchor={
            <Button onPress={() => setCivilStatusMenuVisible(true)}>{form.civilStatus || "Select Civil Status"}</Button>
          }>
          <Menu.Item onPress={() => {handleInputChange('civilStatus', 'Single'); setCivilStatusMenuVisible(false);}} title="Single" />
          <Menu.Item onPress={() => {handleInputChange('civilStatus', 'Married'); setCivilStatusMenuVisible(false);}} title="Married" />
          <Menu.Item onPress={() => {handleInputChange('civilStatus', 'Divorced'); setCivilStatusMenuVisible(false);}} title="Divorced" />
          <Menu.Item onPress={() => {handleInputChange('civilStatus', 'Widowed'); setCivilStatusMenuVisible(false);}} title="Widowed" />
        </Menu>


        <TextInput
          label="Height"
          value={form.height}
          onChangeText={text => handleInputChange('height', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Weight"
          value={form.weight}
          onChangeText={text => handleInputChange('weight', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Blood Type"
          value={form.bloodType}
          onChangeText={text => handleInputChange('bloodType', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="GSIS No."
          value={form.gsisNo}
          onChangeText={text => handleInputChange('gsisNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Pag-Ibig No."
          value={form.pagIbigNo}
          onChangeText={text => handleInputChange('pagIbigNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="PhilHealth No."
          value={form.philHealthNo}
          onChangeText={text => handleInputChange('philHealthNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="SSS No."
          value={form.sssNo}
          onChangeText={text => handleInputChange('sssNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="TIN No."
          value={form.tinNo}
          onChangeText={text => handleInputChange('tinNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Telephone No."
          value={form.telephoneNo}
          onChangeText={text => handleInputChange('telephoneNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Mobile No."
          value={form.mobileNo}
          onChangeText={text => handleInputChange('mobileNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Email"
          value={form.email}
          onChangeText={text => handleInputChange('email', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <Text style={styles.header}>Residential Address</Text>

        <TextInput
          label="Residential House/Block/Lot No."
          value={form.residentialHouseBlockLotNo}
          onChangeText={text => handleInputChange('residentialHouseBlockLotNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential Street"
          value={form.residentialStreet}
          onChangeText={text => handleInputChange('residentialStreet', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential Subdivision"
          value={form.residentialSubdivision}
          onChangeText={text => handleInputChange('residentialSubdivision', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential Barangay"
          value={form.residentialBarangay}
          onChangeText={text => handleInputChange('residentialBarangay', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential City/Municipality"
          value={form.residentialCityMunicipality}
          onChangeText={text => handleInputChange('residentialCityMunicipality', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential Province"
          value={form.residentialProvince}
          onChangeText={text => handleInputChange('residentialProvince', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Residential Zip Code"
          value={form.residentialZipCode}
          onChangeText={text => handleInputChange('residentialZipCode', text)}
          style={styles.input}
          mode="outlined"
        />

        <Text style={styles.header}>Permanent Address</Text>

        <TextInput
          label="Permanent House/Block/Lot No."
          value={form.permanentHouseBlockLotNo}
          onChangeText={text => handleInputChange('permanentHouseBlockLotNo', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent Street"
          value={form.permanentStreet}
          onChangeText={text => handleInputChange('permanentStreet', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent Subdivision"
          value={form.permanentSubdivision}
          onChangeText={text => handleInputChange('permanentSubdivision', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent Barangay"
          value={form.permanentBarangay}
          onChangeText={text => handleInputChange('permanentBarangay', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent City/Municipality"
          value={form.permanentCityMunicipality}
          onChangeText={text => handleInputChange('permanentCityMunicipality', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent Province"
          value={form.permanentProvince}
          onChangeText={text => handleInputChange('permanentProvince', text)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Permanent Zip Code"
          value={form.permanentZipCode}
          onChangeText={text => handleInputChange('permanentZipCode', text)}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
});
