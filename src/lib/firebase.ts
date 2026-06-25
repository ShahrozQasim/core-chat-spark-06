import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUdare1dGvNq8HVgLuPC7ZgeYtXLZHJ_w",
  authDomain: "corechat-ai.firebaseapp.com",
  projectId: "corechat-ai",
  storageBucket: "corechat-ai.appspot.com",
  messagingSenderId: "1971555902",
  appId: "1:1971555902:web:0c82fd7dbae4371c15cb6f",
  measurementId: "G-CE431FRTTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (optional - safe check)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
