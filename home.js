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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔹 Firebase config
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

// 🔹 Elements
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const totalSavings = document.getElementById("totalSavings");
const netWorth = document.getElementById("netWorth");
const totalTransactions = document.getElementById("totalTransactions");
const recentEntries = document.getElementById("recentEntries");
const usernameDisplay = document.getElementById("usernameDisplay");

const entryFilter = document.getElementById("entryFilter");
const sortField = document.getElementById("sortField");
const sortOrder = document.getElementById("sortOrder");

let allEntries = [];
let currentCategory = "all";

// 🔹 Elements
const logoutButtons = document.querySelectorAll(".logoutBtn");

// 🔹 On Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  usernameDisplay.textContent = user.displayName || user.email || "Guest";

  // If user is anonymous, show "Login" instead of "Logout"
  logoutButtons.forEach((btn) => {
    if (user.isAnonymous) {
      btn.textContent = "Login";
      btn.classList.remove("bg-red-600", "text-white", "hover:bg-gray-200");
      btn.classList.add("bg-blue-600", "text-white", "hover:bg-blue-500");
      btn.onclick = () => {
        window.location.href = "login.html";
      };
    } else {
      btn.textContent = "Logout";
      btn.classList.remove("bg-blue-600");
      btn.classList.add("bg-red-600", "text-white");
      btn.onclick = async () => {
        try {
          await signOut(auth);
          window.location.href = "login.html";
        } catch (err) {
          console.error("Logout error:", err);
        }
      };
    }
  });

  loadAll(user.uid);
});

// 🔹 Load all categories
function loadAll(uid) {
  const categories = ["incomes", "expenses", "savings", "transactions"];

  categories.forEach((col) => {
    const q = query(
      collection(db, col),
      where("uid", "==", uid),
      orderBy("date", "desc")
    );
    onSnapshot(q, (snap) => {
      // Remove previous entries of this category
      allEntries = allEntries.filter((e) => e.category !== col);

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        allEntries.push({ ...data, category: col, id: docSnap.id });
      });

      updateTotals();
      renderEntries();
    });
  });
}

// 🔹 Update totals
function updateTotals() {
  const totals = {};
  totals.income = allEntries
    .filter((e) => e.category === "incomes")
    .reduce((a, b) => a + b.amount, 0);
  totals.expenses = allEntries
    .filter((e) => e.category === "expenses")
    .reduce((a, b) => a + b.amount, 0);
  totals.savings = allEntries
    .filter((e) => e.category === "savings")
    .reduce((a, b) => a + b.amount, 0);
  totals.transactions = allEntries
    .filter((e) => e.category === "transactions")
    .reduce((a, b) => a + b.amount, 0);

  const savings1 = allEntries
    .filter((e) => e.category === "savings" && e.mode === "savingsOnly")
    .reduce((a, b) => a + b.amount, 0);
  const savings2 = totals.savings - savings1;

  totalIncome.textContent = "₹" + totals.income.toFixed(2);
  totalExpenses.textContent = "₹" + totals.expenses.toFixed(2);
  totalSavings.textContent = "₹" + totals.savings.toFixed(2);
  totalTransactions.textContent = "₹" + totals.transactions.toFixed(2);
  netWorth.textContent =
    "₹" +
    (totals.income - totals.expenses + savings2 + totals.transactions).toFixed(
      2
    );
  currentMoney.textContent =
    "₹" +
    (totals.income - totals.expenses - savings1 + totals.transactions).toFixed(
      2
    );
}

// 🔹 Render recent entries with dynamic extra fields
function renderEntries() {
  recentEntries.innerHTML = "";

  let entriesToRender =
    currentCategory === "all"
      ? [...allEntries]
      : allEntries.filter((e) => e.category === currentCategory);

  if (!entriesToRender.length) {
    recentEntries.innerHTML = `<li class="text-gray-500 py-2">No entries found</li>`;
    return;
  }

  // Convert Firestore timestamps to Date
  entriesToRender = entriesToRender.map((e) => ({
    ...e,
    dateObj: e.date?.toDate ? e.date.toDate() : new Date(e.date),
  }));

  // Sort
  const field = sortField.value || "date";
  const order = sortOrder.value === "asc" ? 1 : -1;
  entriesToRender.sort((a, b) => {
    if (field === "date") return (a.dateObj - b.dateObj) * order;
    if (field === "amount") return (a.amount - b.amount) * order;
    if (field === "source" && a.source && b.source)
      return a.source.localeCompare(b.source) * order;
    if (field === "category" && a.category && b.category)
      return a.category.localeCompare(b.category) * order;
    if (field === "person" && a.person && b.person)
      return a.person.localeCompare(b.person) * order;
    if (field === "type" && a.type && b.type)
      return a.type.localeCompare(b.type) * order;
    if (field === "mode" && a.mode && b.mode)
      return a.mode.localeCompare(b.mode) * order;
    return 0;
  });

  entriesToRender.forEach((e) => {
    const color =
      e.category === "expenses"
        ? "text-red-600"
        : e.category === "incomes"
        ? "text-green-600"
        : e.category === "savings"
        ? "text-purple-600"
        : "text-indigo-600";

    const li = document.createElement("li");
    li.className =
      "flex flex-col md:flex-row justify-between border-b py-2 items-start md:items-center";

    let extraFields = "";
    if (e.category === "incomes" && e.source)
      extraFields = ` | Source: ${e.source}`;
    if (e.category === "expenses" && e.categoryName)
      extraFields = ` | Category: ${e.categoryName}`;
    if (e.category === "savings" && e.mode) extraFields = ` | Mode: ${e.mode}`;
    if (e.category === "transactions" && e.person)
      extraFields = ` | Person: ${e.person} | Type: ${e.type || ""}`;

    li.innerHTML = `
      <span>${e.dateObj.toISOString().split("T")[0]} - ${capitalize(
      e.category
    )} - ${e.description || ""}${extraFields}</span>
      <div class="flex items-center gap-2 mt-2 md:mt-0">
        <span class="${color}">₹${e.amount.toFixed(2)}</span>
        <button class="deleteBtn text-red-600 hover:text-red-800 ml-2" data-id="${
          e.id
        }">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    recentEntries.appendChild(li);
  });

  // Delete
  recentEntries.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const category = entriesToRender.find((e) => e.id === id)?.category;
      if (!category) return;
      try {
        await deleteDoc(doc(db, category, id));
      } catch (err) {
        console.error("Error deleting:", err);
      }
    });
  });
}

// 🔹 Capitalize helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 🔹 Filter change
entryFilter.addEventListener("change", () => {
  currentCategory = entryFilter.value;
  updateSortFields(currentCategory);
  renderEntries();
});

// 🔹 Sort field or order change
sortField.addEventListener("change", renderEntries);
sortOrder.addEventListener("change", renderEntries);

// 🔹 Update sort fields based on category
function updateSortFields(category) {
  sortField.innerHTML = "";

  let fields = ["date", "amount"];
  if (category === "incomes") fields.push("source");
  if (category === "expenses") fields.push("category");
  if (category === "savings") fields.push("mode");
  if (category === "transactions") fields.push("person", "type");

  fields.forEach((f) => {
    const option = document.createElement("option");
    option.value = f;
    option.textContent = capitalize(f);
    sortField.appendChild(option);
  });
  sortField.value = "date";
}

// 🔹 Sidebar toggle
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
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔹 Logout buttons
document.querySelectorAll(".logoutBtn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "login.html"; // redirect after logout
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
});
