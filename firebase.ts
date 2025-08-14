import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyATmWaWHeOIPuKEz11YbHkdo2qasNUr9z8",
  authDomain: "my-auth-app-e937e.firebaseapp.com",
  projectId: "my-auth-app-e937e",
  storageBucket: "my-auth-app-e937e.firebasestorage.app",
  messagingSenderId: "731924153817",
  appId: "1:731924153817:web:5370d74f068d20745345c8",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export default app
