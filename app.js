// app.js
// NOTE: you'll need to replace firebaseConfig with your actual config from Firebase console

import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// TODO: replace this with your own config from Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyDf_szthJgcr4kmnUTClu8FD0MCQcBea9I",
    authDomain: "justmodded-portfolio.firebaseapp.com",
    projectId: "justmodded-portfolio",
    storageBucket: "justmodded-portfolio.firebasestorage.app",
    messagingSenderId: "556379934616",
    appId: "1:556379934616:web:21ff43963b0da4a24d25ed",
    measurementId: "G-3HYKSN6F67"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DOM refs
const commissionsList = document.getElementById("commissions-list");
const reviewsList = document.getElementById("reviews-list");
const reviewForm = document.getElementById("review-form");
const reviewStatus = document.getElementById("review-status");
const yearSpan = document.getElementById("year");

if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// util
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[ch]));
}

// load commissions from Firestore
async function loadCommissions() {
    try {
        const q = query(
            collection(db, "commissions"),
            orderBy("order", "asc")
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            commissionsList.innerHTML = "<p>No commissions listed yet. Add some in Firestore.</p>";
            return;
        }

        commissionsList.innerHTML = "";
        snap.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement("article");
            card.className = "card";

            const title = escapeHTML(data.title || "Untitled Commission");
            const type = escapeHTML(data.type || "General");
            const desc = escapeHTML(data.description || "");
            const priceFrom = data.priceFrom ? `From $${data.priceFrom}` : "";
            const eta = data.eta ? `${data.eta}` : "";
            const tags = Array.isArray(data.tags) ? data.tags : [];

            card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <h4>${title}</h4>
          <span class="badge">${type}</span>
        </div>
        <p>${desc}</p>
        ${priceFrom ? `<p class="price">${priceFrom}</p>` : ""}
        ${eta ? `<p class="hint">ETA: ${eta}</p>` : ""}
        ${tags.length ? `
          <div class="tag-row">
            ${tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
          </div>` : ""}
      `;
            commissionsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        commissionsList.innerHTML = "<p>Failed to load commissions.</p>";
    }
}

// load reviews from Firestore
async function loadReviews() {
    try {
        const q = query(
            collection(db, "reviews"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            reviewsList.innerHTML = "<p>No reviews yet. Be the first to leave one!</p>";
            return;
        }

        reviewsList.innerHTML = "";
        snap.forEach((doc) => {
            const data = doc.data();
            if (data.approved === false) return; // optional moderation flag

            const name = escapeHTML(data.name || "Anonymous");
            const message = escapeHTML(data.message || "");
            const rating = Number(data.rating || 0);
            const stars = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
            const created = data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleDateString()
                : "";

            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4>${name}</h4>
          <span class="badge">${stars}</span>
        </div>
        <p>${message}</p>
        ${created ? `<p class="hint">Posted on ${created}</p>` : ""}
      `;
            reviewsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        reviewsList.innerHTML = "<p>Failed to load reviews.</p>";
    }
}

// handle review form submit
if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        reviewStatus.textContent = "";
        reviewStatus.className = "status-msg";

        const nameInput = document.getElementById("review-name");
        const ratingInput = document.getElementById("review-rating");
        const messageInput = document.getElementById("review-message");

        const name = nameInput.value.trim() || "Anonymous";
        const rating = Number(ratingInput.value);
        const message = messageInput.value.trim();

        if (!message) {
            reviewStatus.textContent = "Please write a short review.";
            reviewStatus.classList.add("err");
            return;
        }

        try {
            document.getElementById("review-submit").disabled = true;

            await addDoc(collection(db, "reviews"), {
                name,
                rating,
                message,
                createdAt: serverTimestamp(),
                approved: true // if you want manual approval later, set default false
            });

            reviewStatus.textContent = "Thanks! Your review has been saved.";
            reviewStatus.classList.add("ok");

            reviewForm.reset();
            await loadReviews();
        } catch (err) {
            console.error(err);
            reviewStatus.textContent = "Failed to send review. Try again later.";
            reviewStatus.classList.add("err");
        } finally {
            document.getElementById("review-submit").disabled = false;
        }
    });
}

// initial load
loadCommissions();
loadReviews();
