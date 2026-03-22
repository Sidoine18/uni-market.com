// js/product.js
import { db, auth } from './firebase.js';
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. EXTRACTION DE L'ID DEPUIS L'URL ---
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Éléments du DOM
const pName = document.getElementById('p-name');
const pPrice = document.getElementById('p-price');
const pDesc = document.getElementById('p-desc');
const pCategory = document.getElementById('p-category');
const pUniversity = document.getElementById('p-university');
const pImage = document.getElementById('p-image');
const sellerName = document.getElementById('seller-name');
const sellerImg = document.getElementById('seller-img');
const btnChat = document.getElementById('btn-chat');

let productData = null;

// --- 2. RÉCUPÉRATION DES DONNÉES ---
if (!productId) {
    window.location.href = 'index.html'; // Rediriger si aucun ID n'est fourni
} else {
    fetchProductDetails();
}

async function fetchProductDetails() {
    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            productData = docSnap.data();
            renderProduct();
            // Optionnel : Incrémenter le nombre de vues (Statistique ingénieur)
            updateDoc(docRef, { views: increment(1) });
        } else {
            alert("Ce produit n'existe plus ou a été retiré.");
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Erreur de récupération :", error);
    }
}

// --- 3. AFFICHAGE DYNAMIQUE ---
function renderProduct() {
    pName.innerText = productData.name;
    pPrice.innerText = `${productData.price.toLocaleString()} FCFA`;
    pDesc.innerText = productData.description;
    pCategory.innerText = productData.category;
    pUniversity.innerText = productData.university;
    pImage.src = productData.imageUrl;
    
    sellerName.innerText = productData.sellerName;
    sellerImg.src = productData.sellerPhoto || 'assets/images/default-avatar.png';

    // Mettre à jour le titre de la page pour le SEO
    document.title = `${productData.name} | UnivMarket`;
    
    // Réinitialiser les icônes si nécessaire
    lucide.createIcons();
}

// --- 4. GESTION DU CONTACT (VERS LE CHAT) ---
btnChat.addEventListener('click', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert("Veuillez vous connecter pour contacter le vendeur.");
            window.location.href = `login.html?redirect=product.html?id=${productId}`;
            return;
        }

        // Empêcher de s'auto-contacter
        if (user.uid === productData.sellerId) {
            alert("C'est votre propre annonce !");
            return;
        }

        // Redirection vers le chat avec les paramètres nécessaires
        // On passe l'ID du vendeur et l'ID du produit pour initialiser la discussion
        window.location.href = `chat.html?sellerId=${productData.sellerId}&productId=${productId}`;
    });
});