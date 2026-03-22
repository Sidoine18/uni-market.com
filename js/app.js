// js/app.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. GESTION DE L'ÉTAT DE CONNEXION ---
const authSection = document.getElementById('auth-section');

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Utilisateur connecté : Afficher son avatar et le bouton Vendre
        authSection.innerHTML = `
            <div class="flex items-center gap-3">
                <a href="add-product.html" class="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-all">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i> Vendre
                </a>
                <a href="profile.html" class="group flex items-center gap-2">
                    <img src="${user.photoURL || 'assets/images/default-avatar.png'}" 
                         class="w-10 h-10 rounded-full border-2 border-indigo-100 group-hover:border-indigo-500 transition-all object-cover">
                </a>
            </div>
        `;
        // Réinitialiser les icônes Lucide injectées dynamiquement
        lucide.createIcons();
    } else {
        // Utilisateur déconnecté
        authSection.innerHTML = `
            <a href="login.html" class="text-sm font-semibold text-slate-600 hover:text-indigo-600">Connexion</a>
            <a href="register.html" class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-semibold hover:bg-indigo-100 transition-all">S'inscrire</a>
        `;
    }
});

// --- 2. RÉCUPÉRATION DES PRODUITS EN TEMPS RÉEL ---
const productsGrid = document.getElementById('products-grid');

const loadProducts = () => {
    // Requête : Collection "products", triés par date décroissante, limité à 20
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));

    // onSnapshot permet une mise à jour instantanée sans rafraîchir la page
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i data-lucide="package-open" class="w-16 h-16 mx-auto text-slate-300 mb-4"></i>
                    <p class="text-slate-500">Aucun produit disponible pour le moment.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        productsGrid.innerHTML = ""; // Vider le skeleton loader

        snapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;
            
            // Création de la carte produit
            const productCard = `
                <div class="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer" 
                     onclick="location.href='product.html?id=${productId}'">
                    
                    <div class="relative h-48 overflow-hidden">
                        <img src="${product.imageUrl || 'assets/images/placeholder.jpg'}" 
                             alt="${product.name}" 
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm">
                            <span class="text-indigo-600 font-bold text-sm">${product.price} FCFA</span>
                        </div>
                    </div>

                    <div class="p-4">
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="font-bold text-slate-800 truncate flex-1">${product.name}</h4>
                            <span class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">${product.category}</span>
                        </div>
                        <p class="text-xs text-slate-400 mb-4 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> ${product.university || 'Campus'}
                        </p>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div class="flex items-center gap-2">
                                <img src="${product.sellerPhoto || 'assets/images/default-avatar.png'}" class="w-6 h-6 rounded-full">
                                <span class="text-xs font-medium text-slate-600">${product.sellerName}</span>
                            </div>
                            <button class="text-slate-300 hover:text-red-500 transition-colors">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productsGrid.innerHTML += productCard;
        });

        // Activer les icônes pour les nouveaux éléments
        lucide.createIcons();
    }, (error) => {
        console.error("Erreur Firestore :", error);
        productsGrid.innerHTML = "<p class='text-red-500 text-center col-span-full'>Erreur lors du chargement des produits.</p>";
    });
};

// Lancement de la fonction
loadProducts();