import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTvxsDNVue9E7vv5nm3CmDW_dYRP5vuMg",
  authDomain: "ai-mock-interview-32a63.firebaseapp.com",
  projectId: "ai-mock-interview-32a63",
  storageBucket: "ai-mock-interview-32a63.firebasestorage.app",
  messagingSenderId: "884953630628",
  appId: "1:884953630628:web:eb2f32eca8d98b542c6331",
  measurementId: "G-KP6WQXF9P7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
