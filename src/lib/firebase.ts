import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUdare1dGvNq8HVgLuPC7ZgeYtXLZHJ_w",
  authDomain: "corechat-ai.firebaseapp.com",
  projectId: "corechat-ai",
  storageBucket: "corechat-ai.appspot.com",
  messagingSenderId: "1971555902",
  appId: "1:1971555906:web:0c82fd7dbae4371c15cb6f"
};

// Init app
const app = initializeApp(firebaseConfig);

// Auth only (safe for SSR)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
