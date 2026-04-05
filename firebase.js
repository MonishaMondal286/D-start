import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMA4mK-_DL-dujoCa_tzWijkA2zsXNFeA",
  authDomain: "kdsac-f16d8.firebaseapp.com",
  projectId: "kdsac-f16d8",
  storageBucket: "kdsac-f16d8.firebasestorage.app",
  messagingSenderId: "468637781160",
  appId: "1:468637781160:web:b572a81fff76213c75469d",
  measurementId: "G-DXTW3C38W6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage, serverTimestamp };
