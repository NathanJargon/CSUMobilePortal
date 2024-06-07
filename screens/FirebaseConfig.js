import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAn1p8meq4IssKSgRRJed2SERlvpCTCi8Q",
  authDomain: "schoolportal-2f508.firebaseapp.com",
  projectId: "schoolportal-2f508",
  storageBucket: "schoolportal-2f508.appspot.com",
  messagingSenderId: "996087430832",
  appId: "1:996087430832:web:726d43deb9531b96d80575",
  measurementId: "G-KD18GD5LND"
};

if (!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
}


export { firebase };