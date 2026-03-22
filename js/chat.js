// js/chat.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, addDoc, query, orderBy, onSnapshot, 
    serverTimestamp, doc, getDoc, setDoc, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. INITIALISATION DES VARIABLES ---
const urlParams = new URLSearchParams(window.location.search);
const targetSellerId = urlParams.get('sellerId');
const targetProductId = urlParams.get('productId');

let currentUser = null;
let activeChatId = null;

const msgContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('message-input');
const convList = document.getElementById('conversations-list');

// --- 2. VÉRIFICATION AUTHENTIFICATION ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        loadConversations(); // Charger la liste de gauche
        
        // Si on vient d'une annonce, initialiser ou ouvrir le chat
        if (targetSellerId) {
            initiateNewChat(targetSellerId, targetProductId);
        }
    }
});

// --- 3. INITIALISER UNE DISCUSSION (Depuis Product.html) ---
async function initiateNewChat(sellerId, productId) {
    // ID de chat unique basé sur les deux UIDs triés (évite les doublons)
    activeChatId = currentUser.uid < sellerId 
        ? `${currentUser.uid}_${sellerId}` 
        : `${sellerId}_${currentUser.uid}`;

    const chatRef = doc(db, "chats", activeChatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        // Création de l'entrée de discussion
        await setDoc(chatRef, {
            users: [currentUser.uid, sellerId],
            lastMessage: "Nouveau message concernant un produit",
            timestamp: serverTimestamp(),
            productId: productId
        });
    }
    openChat(activeChatId, sellerId);
}

// --- 4. CHARGER LA LISTE DES CONVERSATIONS (Sidebar) ---
function loadConversations() {
    const q = query(collection(db, "chats"), where("users", "array-contains", currentUser.uid), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        convList.innerHTML = "";
        snapshot.forEach(async (chatDoc) => {
            const data = chatDoc.data();
            const otherUserId = data.users.find(id => id !== currentUser.uid);
            
            // Récupérer les infos de l'autre utilisateur
            const userSnap = await getDoc(doc(db, "users", otherUserId));
            const userData = userSnap.data();

            const item = document.createElement('div');
            item.className = `p-4 flex items-center gap-3 border-b border-slate-50 cursor-pointer hover:bg-indigo-50 transition-all ${activeChatId === chatDoc.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`;
            item.innerHTML = `
                <img src="${userData?.photoURL || 'assets/images/default-avatar.png'}" class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1 overflow-hidden">
                    <h4 class="font-bold text-sm text-slate-800">${userData?.displayName || 'Étudiant'}</h4>
                    <p class="text-xs text-slate-500 truncate">${data.lastMessage}</p>
                </div>
            `;
            item.onclick = () => openChat(chatDoc.id, otherUserId);
            convList.appendChild(item);
        });
    });
}

// --- 5. OUVRIR ET ÉCOUTER UNE DISCUSSION ---
function openChat(chatId, otherUserId) {
    activeChatId = chatId;
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('chat-window').classList.add('flex');
    
    // Mise à jour de l'UI Header (simplifié)
    getDoc(doc(db, "users", otherUserId)).then(snap => {
        document.getElementById('active-chat-name').innerText = snap.data().displayName;
        document.getElementById('active-chat-img').src = snap.data().photoURL;
    });

    // Écoute des messages en temps réel
    const msgsQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    onSnapshot(msgsQuery, (snapshot) => {
        msgContainer.innerHTML = "";
        snapshot.forEach(doc => {
            const msg = doc.data();
            const isMine = msg.senderId === currentUser.uid;
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `flex ${isMine ? 'justify-end' : 'justify-start'}`;
            msgDiv.innerHTML = `
                <div class="message-bubble p-3 text-sm ${isMine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm'}">
                    ${msg.text}
                </div>
            `;
            msgContainer.appendChild(msgDiv);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight; // Scroll automatique vers le bas
    });
}

// --- 6. ENVOYER UN MESSAGE ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text || !activeChatId) return;

    msgInput.value = ""; // Clear immédiat pour l'UX

    try {
        // Ajouter le message à la sous-collection
        await addDoc(collection(db, "chats", activeChatId, "messages"), {
            text: text,
            senderId: currentUser.uid,
            createdAt: serverTimestamp()
        });

        // Mettre à jour l'aperçu du chat
        await setDoc(doc(db, "chats", activeChatId), {
            lastMessage: text,
            timestamp: serverTimestamp()
        }, { merge: true });

    } catch (err) {
        console.error("Erreur d'envoi:", err);
    }
});