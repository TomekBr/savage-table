import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP5iw1GuAT_pwWYlOxt7gv_MidftujAYU",
  authDomain: "savage-table.firebaseapp.com",
  projectId: "savage-table",
  storageBucket: "savage-table.firebasestorage.app",
  messagingSenderId: "739978098181",
  appId: "1:739978098181:web:19cf35a97fe25a3bbace6c",
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);
