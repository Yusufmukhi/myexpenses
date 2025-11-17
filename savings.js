import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Firebase config ----------------
const firebaseConfig = {
  apiKey: "AIzaSyA1MhwEBTDrgYc2ywKJnuyAIw5Q6qS8Rcw",
  authDomain: "expensestracker-36711.firebaseapp.com",
  projectId: "expensestracker-36711",
  storageBucket: "expensestracker-36711.firebasestorage.app",
  messagingSenderId: "111920440061",
  appId: "1:111920440061:web:3af7eff29b1896280ad494",
  measurementId: "G-RC8QLYP6FZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- DOM Elements ----------------
const form = document.getElementById("form");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("typeSelect");
const descriptionInput = document.getElementById("description");
const modeSelect = document.getElementById("mode");
const customTypeInput = document.getElementById("customType");
const addTypeBtn = document.getElementById("addTypeBtn");
const recentTransactionsList = document.getElementById("recentTransactions");
const totalSavingsEl = document.getElementById("totalSavings");
const totalNetWorthEl = document.getElementById("totalNetWorth");

// Sidebar
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let currentUser = null;

// ---------------- Auth ----------------
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
  currentUser = user;
  dateInput.value = new Date().toISOString().split("T")[0];
  loadSavingTypes();
  loadTransactions();
});

// ---------------- Sidebar toggle ----------------
menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});
overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// ---------------- Load Saving Types ----------------
async function loadSavingTypes() {
  if (!currentUser) return;
  try {
    const q = query(
      collection(db, "savingTypes"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);

    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = "Other";
  } catch (err) {
    console.error("Error loading types:", err);
  }
}

// ---------------- Show custom type input ----------------

// ---------------- Add new type ----------------
addTypeBtn.addEventListener("click", async () => {
  const name = customTypeInput.value.trim();
  if (!name) return alert("Enter a type name");
  try {
    await addDoc(collection(db, "savingTypes"), {
      uid: currentUser.uid,
      name,
      createdAt: new Date(),
    });
    customTypeInput.value = "";
    customTypeInput.classList.add("hidden");
    addTypeBtn.classList.add("hidden");
    loadSavingTypes();
  } catch (err) {
    console.error("Error adding type:", err);
    alert(err.message);
  }
});

// ---------------- Add saving ----------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Please login first.");

  const date = dateInput.value;
  const amount = parseFloat(amountInput.value);
  const description = descriptionInput.value;
  const mode = modeSelect.value; // netWorth or savingsOnly

  if (!date || !amount || !mode) return alert("Fill all required fields.");

  // --- Calculate totals ---
  const incomeSnap = await getDocs(
    query(collection(db, "incomes"), where("uid", "==", currentUser.uid))
  );
  const totalIncome = incomeSnap.docs.reduce((a, d) => a + d.data().amount, 0);

  const expenseSnap = await getDocs(
    query(collection(db, "expenses"), where("uid", "==", currentUser.uid))
  );
  const totalExpenses = expenseSnap.docs.reduce(
    (a, d) => a + d.data().amount,
    0
  );

  const savingsSnap = await getDocs(
    query(collection(db, "savings"), where("uid", "==", currentUser.uid))
  );
  const savingsOnlyTotal = savingsSnap.docs
    .filter((d) => d.data().mode === "savingsOnly")
    .reduce((a, d) => a + d.data().amount, 0);

  const transactionsSnap = await getDocs(
    query(collection(db, "transactions"), where("uid", "==", currentUser.uid))
  );
  const pendingTaken = transactionsSnap.docs
    .filter((d) => !d.data().completed && d.data().type === "taken")
    .reduce((a, d) => a + d.data().amount, 0);
  const pendingGiven = transactionsSnap.docs
    .filter((d) => !d.data().completed && d.data().type === "given")
    .reduce((a, d) => a + d.data().amount, 0);

  const netPendingTransactions = pendingTaken - pendingGiven;

  const currentMoney =
    totalIncome - totalExpenses - savingsOnlyTotal + netPendingTransactions;

  // --- Prevent overdraft ---
  if (mode === "savingsOnly" && amount > currentMoney) {
    return alert(
      `Insufficient available funds! You only have ₹${currentMoney.toFixed(
        2
      )} available.`
    );
  }

  // --- Add saving ---
  try {
    await addDoc(collection(db, "savings"), {
      uid: currentUser.uid,
      date,
      amount,
      description,
      mode,
      createdAt: new Date(),
    });

    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    loadTransactions(); // refresh totals/transactions
  } catch (err) {
    console.error("Error adding saving:", err);
    alert(err.message);
  }
});

// ---------------- Load transactions ----------------
async function loadTransactions() {
  if (!currentUser) return;
  try {
    const q = query(
      collection(db, "savings"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc") // newest first
    );
    const snapshot = await getDocs(q);
    recentTransactionsList.innerHTML = "";

    let totalSavings = 0;
    let totalNetWorth = 0;

    snapshot.forEach((docSnap) => {
      const tx = docSnap.data();
      const li = document.createElement("li");
      li.className = "py-2 flex justify-between items-center";

      li.innerHTML = `
        <div>
          <span class="font-medium">${tx.date}</span> - <span>${
        tx.description || tx.mode
      }</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold ${
            tx.mode === "netWorth" ? "text-blue-600" : "text-green-600"
          }">
            ₹${tx.amount.toFixed(2)}
          </span>
          <button class="deleteBtn text-red-600 hover:text-red-800" data-id="${
            docSnap.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      recentTransactionsList.appendChild(li);

      totalSavings += tx.amount;
      if (tx.mode === "netWorth") totalNetWorth += tx.amount;
    });

    totalSavingsEl.textContent = `₹${totalSavings.toFixed(2)}`;
    totalNetWorthEl.textContent = `₹${totalNetWorth.toFixed(2)}`;

    // ---------------- Delete transaction ----------------
    recentTransactionsList.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          await deleteDoc(doc(db, "savings", id));
          loadTransactions();
        } catch (err) {
          console.error("Error deleting:", err);
        }
      });
    });
  } catch (err) {
    console.error("Error loading transactions:", err);
  }
}

// ---------------- Logout ----------------
document.querySelectorAll(".logout").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
});
menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});

overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});
