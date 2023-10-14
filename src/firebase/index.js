import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth/react-native';
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";
import { getFunctions } from 'firebase/functions';

// Replace this with your Firebase SDK config snippet
const firebaseConfig = {
  apiKey: " ",
  authDomain: "gptbot-f52d4.firebaseapp.com",
  projectId: "gptbot-f52d4",
  storageBucket: "gptbot-f52d4.appspot.com",
  messagingSenderId: "861892513436",
  appId: "1:861892513436:web:1e1dd0fce500558740a759",
  measurementId: "G-DN14JM5RYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { auth };
export {db};
export {storage};
export {functions};