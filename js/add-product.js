// js/add-product.js
import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const productForm = document.getElementById('add-product-form');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadStatus = document.getElementById('upload-status');

let currentUser = null;

// --- 1. SÉCURITÉ : VÉRIFIER LA CONNEXION ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Vous devez être connecté pour publier une annonce.");
        window.location.href = "login.html";
    } else {
        currentUser = user;
    }
});

// --- 2. LOGIQUE DE PUBLICATION ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    // Récupération des fichiers et données
    const imageFile = document.getElementById('product-image').files[0];
    const name = document.getElementById('product-name').value;
    const price = document.getElementById('product-price').value;
    const category = document.getElementById('product-category').value;
    const university = document.getElementById('product-university').value;
    const description = document.getElementById('product-desc').value;

    try {
        // AFFICHER LE CHARGEMENT
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');

        // ÉTAPE A : Upload de l'image vers Firebase Storage
        uploadStatus.innerText = "Téléchargement de l'image (1/2)...";
        
        // Nom de fichier unique pour éviter les collisions (Timestamp + Nom)
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // ÉTAPE B : Création de l'annonce dans Firestore
        uploadStatus.innerText = "Finalisation de l'annonce (2/2)...";
        
        const productData = {
            name: name,
            price: parseFloat(price),
            category: category,
            university: university,
            description: description,
            imageUrl: imageUrl,
            
            // Infos Vendeur (Automatique)
            sellerId: currentUser.uid,
            sellerName: currentUser.displayName || "Étudiant UnivMarket",
            sellerPhoto: currentUser.photoURL || "assets/images/default-avatar.png",
            sellerEmail: currentUser.email,
            
            // Métadonnées
            createdAt: serverTimestamp(),
            status: "active", // Pour pouvoir "vendre" ou "masquer" plus tard
            views: 0
        };

        // Ajout à la collection "products"
        const docRef = await addDoc(collection(db, "products"), productData);

        // SUCCÈS
        uploadStatus.innerText = "Annonce publiée avec succès !";
        setTimeout(() => {
            window.location.href = `product.html?id=${docRef.id}`;
        }, 1500);

    } catch (error) {
        console.error("Erreur de publication :", error);
        loadingOverlay.classList.add('hidden');
        alert("Une erreur est survenue lors de la publication : " + error.message);
    }
});