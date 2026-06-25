// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUdare1dGvNq8HVgLuPC7ZgeYtXLZHJ_w",
  authDomain: "corechat-ai.firebaseapp.com",
  projectId: "corechat-ai",
  storageBucket: "corechat-ai.firebasestorage.app",
  messagingSenderId: "1971555902",
  appId: "1:1971555902:web:0c82fd7dbae4371c15cb6f",
  measurementId: "G-CE431FRTTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
