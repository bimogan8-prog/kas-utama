import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAs8s6v4VExX5MS93o_LDHMFHIPtRR9Ce4",
  authDomain: "kas-pekerja-gw.firebaseapp.com",
  databaseURL: "https://kas-pekerja-gw-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kas-pekerja-gw",
  storageBucket: "kas-pekerja-gw.firebasestorage.app",
  messagingSenderId: "280272410400",
  appId: "1:280272410400:web:4261263445b29428bc2945"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);