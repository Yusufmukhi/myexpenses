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
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Firebase Config ----------------
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
const form = document.getElementById("expenseForm");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");
const newCategoryContainer = document.getElementById("newCategoryContainer");
const transactionsTable = document.getElementById("expenseList");
const totalExpenseSpan = document.getElementById("totalExpense");
const sortSelect = document.getElementById("sortSelect");
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let currentUser = null;
let expenses = [];

dateInput.value = new Date().toISOString().split("T")[0];

// ---------------- Auth ----------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadTransactions();
  loadCategories();
});

// ---------------- Add Expense ----------------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = dateInput.value;
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const description = descriptionInput.value;

  if (!date || !amount || !category) return alert("Please fill all fields.");

  // ✅ Calculate current money from Firestore
  const incomeSnap = await getDocs(
    query(collection(db, "incomes"), where("uid", "==", currentUser.uid))
  );
  const totalIncome = incomeSnap.docs.reduce((a, d) => a + d.data().amount, 0);

  const expenseSnap = await getDocs(
    query(collection(db, "expenses"), where("uid", "==", currentUser.uid))
  );
  const totalExpenses = expenseSnap.docs.reduce((a, d) => a + d.data().amount, 0);

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

  if (currentMoney <= amount) {
    alert(`You only have a balance of ₹${currentMoney.toFixed(2)}.`);
    return;
  }

  try {
    await addDoc(collection(db, "expenses"), {
      uid: currentUser.uid,
      date,
      amount,
      category,
      description,
      createdAt: new Date(),
    });
    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    loadTransactions();
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});

// ---------------- Load Transactions ----------------
async function loadTransactions() {
  if (!currentUser) return;

  const q = query(
    collection(db, "expenses"),
    where("uid", "==", currentUser.uid)
  );
  const snapshot = await getDocs(q);
  expenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  renderTransactions();
}

// ---------------- Render Transactions ----------------
function renderTransactions() {
  // Sort according to dropdown
  const sortValue = sortSelect.value;
  if (sortValue === "amount") {
    expenses.sort((a, b) => b.amount - a.amount);
  } else if (sortValue === "category") {
    expenses.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  transactionsTable.innerHTML = "";
  let total = 0;

  expenses.forEach((exp) => {
    total += exp.amount || 0;
    const li = document.createElement("li");
    li.className = "py-2 flex justify-between items-center";
    li.innerHTML = `
      <div>
        <p class="font-medium">${exp.category || "-"}</p>
        <p class="text-sm text-gray-500">${exp.description || ""}</p>
        <p class="text-xs text-gray-400">${exp.date || ""}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold text-red-600">₹${(exp.amount || 0).toFixed(2)}</span>
        <button data-id="${exp.id}" class="text-red-500 hover:text-red-700 deleteBtn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    transactionsTable.appendChild(li);
  });

  totalExpenseSpan.textContent = `₹${total.toFixed(2)}`;

  // ✅ Delete event (copy to deleteTransactions, then delete)
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const exp = expenses.find((x) => x.id === id);
      if (!exp) return alert("Expense not found.");

      if (!confirm("Are you sure you want to delete this expense?")) return;

      try {
        const toSave = {
          ...exp,
          uid: exp.uid || currentUser.uid,
          deletedAt: new Date(),
          deletedBy: currentUser.uid,
        };

        await addDoc(collection(db, "deleteTransactions"), toSave);
        await deleteDoc(doc(db, "expenses", id));

        await loadTransactions();
      } catch (err) {
        console.error("Error deleting expense:", err);
        alert("Error: " + err.message);
      }
    });
  });
}

// ---------------- Sorting Change ----------------
sortSelect?.addEventListener("change", renderTransactions);

// ---------------- Category Handling ----------------
categorySelect?.addEventListener("change", (e) => {
  if (e.target.value === "__add_new__") {
    newCategoryContainer.classList.remove("hidden");
  } else {
    newCategoryContainer.classList.add("hidden");
  }
});

addCategoryBtn?.addEventListener("click", async () => {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) return alert("Enter a category name");

  try {
    await addDoc(collection(db, "categories"), {
      uid: currentUser.uid,
      name: newCat,
      createdAt: new Date(),
    });
    newCategoryInput.value = "";
    loadCategories();
    alert("Category added!");
  } catch (err) {
    console.error(err);
    alert("Error adding category: " + err.message);
  }
});

// ---------------- Load Categories ----------------
async function loadCategories() {
  if (!currentUser) return;

  const q = query(
    collection(db, "categories"),
    where("uid", "==", currentUser.uid)
  );
  const snapshot = await getDocs(q);

  categorySelect.innerHTML = `<option value="">Select Category</option>`;
  snapshot.forEach((docSnap) => {
    const cat = docSnap.data();
    categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });

  categorySelect.innerHTML += `<option value="__add_new__">Add New Category</option>`;
}

// ---------------- Mobile Menu ----------------
menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});
overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// ---------------- Logout ----------------
document.querySelectorAll(".logout").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = "login.html";
  });
});
