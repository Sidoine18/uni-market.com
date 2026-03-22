// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js'; // Import de ta config séparée

// Initialisation
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * 📝 INSCRIPTION COMPLÈTE
 * Crée l'utilisateur, son profil Auth et son document Firestore
 */
export const registerUser = async (email, password, displayName, phoneNumber, university) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 1. Mise à jour du profil Firebase Auth (Nom + Photo par défaut)
        await updateProfile(user, {
            displayName: displayName,
            photoURL: "assets/images/default-avatar.png"
        });

        // 2. Création du document utilisateur dans Firestore (Données métier)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: displayName,
            email: email,
            phoneNumber: phoneNumber,
            university: university,
            createdAt: serverTimestamp(),
            isVerified: false
        });

        // 3. Envoi immédiat de l'email de vérification
        await sendEmailVerification(user);

        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
};

/**
 * 🔑 CONNEXION CLASSIQUE
 */
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
};

/**
 * 🌐 CONNEXION GOOGLE
 */
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Si c'est sa première connexion, on crée son doc Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                university: "Non spécifiée" // À compléter plus tard dans le profil
            });
        }
        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
};

/**
 * 📨 RÉINITIALISATION DE MOT DE PASSE
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
};

/**
 * 🚪 DÉCONNEXION
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * 🛠️ TRADUCTEUR D'ERREURS FIREBASE (UX)
 */
function translateError(code) {
    switch (code) {
        case 'auth/email-already-in-use': return "Cet email est déjà utilisé par un autre étudiant.";
        case 'auth/invalid-email': return "L'adresse email n'est pas valide.";
        case 'auth/weak-password': return "Le mot de passe doit contenir au moins 6 caractères.";
        case 'auth/user-not-found': return "Aucun compte trouvé avec cet email.";
        case 'auth/wrong-password': return "Mot de passe incorrect.";
        case 'auth/network-request-failed': return "Problème de connexion internet.";
        case 'auth/too-many-requests': return "Trop de tentatives. Réessaye plus tard.";
        default: return "Une erreur est survenue. Veuillez réessayer.";
    }
}