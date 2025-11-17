// ---------------- Firebase imports ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// ---------------- DOM Elements ----------------
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const totalSavings = document.getElementById("totalSavings");
const totalTransactions = document.getElementById("totalTransactions");
const netWorth = document.getElementById("netWorth");
const currentMoney = document.getElementById("currentMoney");
const recentEntries = document.getElementById("recentEntries");
const usernameDisplay = document.getElementById("usernameDisplay");

const entryFilter = document.getElementById("entryFilter");
const sortField = document.getElementById("sortField");
const sortOrder = document.getElementById("sortOrder");

let allEntries = [];
let currentCategory = "transactions";


// ---------------- Auth ----------------
onAuthStateChanged(auth, (user) => {
  if (!user) return (window.location.href = "login.html");

  usernameDisplay.textContent = user.displayName || user.email || "Guest";

  // DEFAULT FILTER → transactions only
  entryFilter.value = "transactions";
  currentCategory = "transactions";
  updateSortFields("transactions");

  loadAll(user.uid);
});

// ---------------- Load all entries ----------------
// Load ALL categories so dashboard totals work
function loadAll(uid) {
  const categories = ["incomes", "expenses", "savings", "transactions"];

  categories.forEach((col) => {
    const q = query(
      collection(db, col),
      where("uid", "==", uid),
      orderBy("date", "desc")
    );

    onSnapshot(q, (snap) => {
      allEntries = allEntries.filter((e) => e.category !== col);

      snap.forEach((docSnap) => {
        allEntries.push({ ...docSnap.data(), category: col, id: docSnap.id });
      });

      updateTotals();
      renderEntries();
    });
  });
}

// ---------------- Update totals ----------------
function updateTotals() {
  const totals = {};

  totals.income = sum("incomes");
  totals.expenses = sum("expenses");
  totals.savings = sum("savings");

  totals.transactions = allEntries
    .filter((e) => e.category === "transactions" && !e.completed)
    .reduce((a, b) => a + b.amount, 0);

  totals.transactionstaken = allEntries
    .filter((e) => e.category === "transactions" && !e.completed && e.type === "taken")
    .reduce((a, b) => a + b.amount, 0);

  totals.transactionsgiven = allEntries
    .filter((e) => e.category === "transactions" && !e.completed && e.type === "given")
    .reduce((a, b) => a + b.amount, 0);

  const netTransactionAmount = totals.transactionstaken - totals.transactionsgiven;

  const savingsOnly = allEntries
    .filter((e) => e.category === "savings" && e.mode === "savingsOnly")
    .reduce((a, b) => a + b.amount, 0);

    console.log("All Entries:", allEntries);
  const savingsUsed = totals.savings - savingsOnly;

  totalIncome.textContent = `₹${totals.income.toFixed(2)}`;
  totalExpenses.textContent = `₹${totals.expenses.toFixed(2)}`;
  totalSavings.textContent = `₹${totals.savings.toFixed(2)}`;
  totalTransactions.textContent = `₹${totals.transactions.toFixed(2)}`;
  netWorth.textContent = `₹${(
    totals.income -
    totals.expenses +
    savingsUsed
  ).toFixed(2)}`;

  currentMoney.textContent = `₹${(
    totals.income -
    totals.expenses -
    savingsOnly +
    netTransactionAmount
  ).toFixed(2)}`;

}

function sum(cat) {
  return allEntries
    .filter((e) => e.category === cat)
    .reduce((a, b) => a + b.amount, 0);
}

// ---------------- Render ONLY transactions ----------------
function renderEntries() {
  recentEntries.innerHTML = "";

  const entries = allEntries.filter((e) => e.category === "transactions");

  if (!entries.length) {
    recentEntries.innerHTML = `<li class="text-gray-500 py-2">No recent transactions found</li>`;
    return;
  }

  const field = sortField.value || "date";
  const order = sortOrder.value === "asc" ? 1 : -1;

  entries.sort((a, b) => {
    const aVal = field === "date" ? new Date(a.date) : a[field];
    const bVal = field === "date" ? new Date(b.date) : b[field];
    return (aVal > bVal ? 1 : -1) * order;
  });

  entries.forEach((e) => {
    const li = document.createElement("li");
    li.className =
      "flex flex-col md:flex-row justify-between border-b py-2 items-start md:items-center";

    li.innerHTML = `
      <span>${new Date(e.date).toISOString().split("T")[0]} - 
      ${e.description || ""} | Person: ${e.person} | Type: ${e.type}</span>

      <div class="flex items-center gap-2 mt-2 md:mt-0">
        <span class="text-indigo-600">₹${e.amount.toFixed(2)}</span>

        <button class="tickBtn text-green-600 hover:text-green-800" data-id="${e.id}">
          <i class="fas ${e.completed ? "fa-undo" : "fa-check"}"></i>
        </button>

        <button class="deleteBtn text-red-600 hover:text-red-800" data-id="${e.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    recentEntries.appendChild(li);
  });

  recentEntries.querySelectorAll(".tickBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const entry = allEntries.find((e) => e.id === id);

      await updateDoc(doc(db, "transactions", id), {
        completed: !entry.completed,
      });
    });
  });

  recentEntries.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "transactions", id));
    });
  });
}

// ---------------- Sort fields ----------------
function updateSortFields(category) {
  sortField.innerHTML = "";

  const fields = ["date", "amount", "person", "type"];

  fields.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    sortField.appendChild(opt);
  });

  sortField.value = "date";
}

// ---------------- Sidebar toggle ----------------
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});

overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});
