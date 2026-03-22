// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Configuration de ton projet UnivMarket
const firebaseConfig = {
  apiKey: "AIzaSyBJfyELCr3EBjHydo2JSL2akShecqcx0yA",
  authDomain: "unimarket-d6259.firebaseapp.com",
  projectId: "unimarket-d6259",
  storageBucket: "unimarket-d6259.firebasestorage.app",
  messagingSenderId: "236655322274",
  appId: "1:236655322274:web:c91d9c59dba3d8d22d63fb",
  measurementId: "G-2TL2FGK6SL"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// --- EXPORTS DES SERVICES ---

// 1. Authentification (Login, Register, Google)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Firestore (Base de données NoSQL pour produits, messages, profils)
export const db = getFirestore(app);

// 3. Storage (Stockage des images de produits et photos de profil)
export const storage = getStorage(app);

// 4. Analytics (Suivi du trafic)
export const analytics = getAnalytics(app);

// Petit log de confirmation pour le développement (à retirer en prod)
console.log("🚀 UnivMarket Firebase Engine: Initialized");