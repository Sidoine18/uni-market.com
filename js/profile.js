import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ta configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBJfyELCr3EBjHydo2JSL2akShecqcx0yA",
    authDomain: "unimarket-d6259.firebaseapp.com",
    projectId: "unimarket-d6259",
    storageBucket: "unimarket-d6259.firebasestorage.app",
    messagingSenderId: "236655322274",
    appId: "1:236655322274:web:c91d9c59dba3d8d22d63fb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Éléments UI
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const userImgEl = document.getElementById('user-img');
const userPhoneEl = document.getElementById('user-phone');
const userUnivEl = document.getElementById('user-university');
const userAdsCountEl = document.getElementById('user-ads-count');
const productsGrid = document.getElementById('my-products-grid');
const emptyState = document.getElementById('empty-state');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Infos de base (Auth)
        userNameEl.textContent = user.displayName || "Étudiant UnivMarket";
        userEmailEl.textContent = user.email;
        if (user.photoURL) userImgEl.src = user.photoURL;

        // 2. Infos détaillées (Firestore - Collection "users")
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            userPhoneEl.textContent = data.phone || "Non renseigné";
            userUnivEl.textContent = data.university || "Non spécifiée";
        }

        // 3. Récupérer les annonces de l'utilisateur (Collection "products")
        loadUserProducts(user.uid);
    } else {
        // Rediriger si non connecté
        window.location.href = 'login.html';
    }
});

async function loadUserProducts(userId) {
    const q = query(collection(db, "products"), where("sellerId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    productsGrid.innerHTML = ""; // Vider le squelette de chargement
    userAdsCountEl.textContent = `${querySnapshot.size} active(s)`;

    if (querySnapshot.empty) {
        emptyState.classList.remove('hidden');
        return;
    }

    querySnapshot.forEach((doc) => {
        const product = doc.data();
        const productHTML = `
            <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm group">
                <div class="aspect-video relative overflow-hidden bg-slate-100">
                    <img src="${product.imageUrl || 'assets/images/placeholder.png'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                </div>
                <div class="p-4">
                    <h4 class="font-bold text-slate-800 line-clamp-1">${product.title}</h4>
                    <p class="text-indigo-600 font-extrabold mt-1">${product.price} FCFA</p>
                    <div class="flex gap-2 mt-4">
                        <button onclick="location.href='edit-product.html?id=${doc.id}'" class="flex-1 text-xs font-bold py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">Modifier</button>
                        <button class="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        productsGrid.innerHTML += productHTML;
    });
    lucide.createIcons();
}

// Déconnexion
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => window.location.href = 'index.html');
};

lucide.createIcons();