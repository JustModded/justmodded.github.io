// commissions.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// your actual firebase config:
const firebaseConfig = {
    apiKey: "AIzaSyDfszthJgcrv4kmnUTCiUBfD0MCQC8ea9I",
    authDomain: "justmodded-portfolio.firebaseapp.com",
    projectId: "justmodded-portfolio",
    storageBucket: "justmodded-portfolio.firebasestorage.app",
    messagingSenderId: "556379934616",
    appId: "1:556379934616:web:21ff43963b0da4a24d25ed",
    measurementId: "G-3HYKSN6F67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const commissionsList = document.getElementById("commissions-list");
const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Sanitizer
const safe = (value) => {
    if (typeof value === "string") {
        return value.replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[m]);
    }
    if (value === null || value === undefined) return "";
    return String(value);
};


// Load commissions
async function loadCommissions() {
    try {
        const q = query(collection(db, "commissions"), orderBy("order", "asc"));
        const snap = await getDocs(q);

        if (snap.empty) {
            commissionsList.innerHTML = "<p class='hint'>No commissions available yet.</p>";
            return;
        }

        commissionsList.innerHTML = "";

        snap.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement("article");
            card.className = "card";

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h3>${safe(data.title)}</h3>
                    <span class="badge">${safe(data.type)}</span>
                </div>
                <p>${safe(data.description)}</p>

                ${data.priceFrom ? `<p class="price">From $${data.priceFrom}</p>` : ""}
                ${data.eta ? `<p class="hint">ETA: ${safe(data.eta)}</p>` : ""}

                ${Array.isArray(data.tags)
                    ? `<div class="tag-row">${data.tags
                        .map((t) => `<span class="tag">${safe(t)}</span>`)
                        .join("")}</div>`
                    : ""
                }
            `;

            commissionsList.appendChild(card);
        });
    } catch (err) {
        console.error("Commissions load error:", err);
        commissionsList.innerHTML = "<p class='err'>Failed to load commissions.</p>";
    }
}

loadCommissions();
