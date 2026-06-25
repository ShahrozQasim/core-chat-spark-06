import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    return null;
  }
};
