// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA14oJWtJkJoiUXtOkn-JlWXnqbqrerTuY",
  authDomain: "feedback-96208.firebaseapp.com",
  projectId: "feedback-96208",
  storageBucket: "feedback-96208.firebasestorage.app",
  messagingSenderId: "772048271719",
  appId: "1:772048271719:web:bc545d8534e616840017c2",
  measurementId: "G-DZC9494XCD"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
export { auth }; 