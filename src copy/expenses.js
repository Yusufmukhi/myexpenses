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
const form = document.getElementById("form");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const transactionsTable = document.getElementById("transactions");
const totalExpenseSpan = document.getElementById("totalExpense");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let currentUser = null;
let currentSort = { field: "date", asc: false }; // default sorting

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

  if (!date || !amount || !category) return alert("Please fill all fields");

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

  try {
    const q = query(
      collection(db, "expenses"),
      where("uid", "==", currentUser.uid),
      orderBy(currentSort.field, currentSort.asc ? "asc" : "desc")
    );

    const snapshot = await getDocs(q);
    transactionsTable.innerHTML = "";
    let total = 0;

    snapshot.forEach((docSnap) => {
      const exp = docSnap.data();
      total += exp.amount;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border p-2">${exp.date}</td>
        <td class="border p-2">₹${exp.amount.toFixed(2)}</td>
        <td class="border p-2">${exp.category}</td>
        <td class="border p-2">${exp.description || ""}</td>
        <td class="border p-2">
            <button data-id="${
              docSnap.id
            }" class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 deleteBtn">Delete</button>
        </td>
      `;
      transactionsTable.appendChild(row);
    });

    totalExpenseSpan.textContent = `₹${total.toFixed(2)}`;

    // Attach delete event
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this expense?")) {
          try {
            await deleteDoc(doc(db, "expenses", id));
            loadTransactions();
          } catch (err) {
            console.error(err);
            alert("Failed to delete: " + err.message);
          }
        }
      });
    });
  } catch (err) {
    console.error(err);
    alert("Error loading transactions: " + err.message);
  }
}

// ---------------- Sorting ----------------
document.querySelectorAll("th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const field = th.dataset.sort;
    if (currentSort.field === field) currentSort.asc = !currentSort.asc;
    else {
      currentSort.field = field;
      currentSort.asc = true;
    }
    loadTransactions();
  });
});

// ---------------- Add Category ----------------
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

  try {
    const catCol = collection(db, "categories");
    const q = query(catCol, where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    categorySelect.innerHTML = `<option value="">Select Category</option>`;
    snapshot.forEach((doc) => {
      const cat = doc.data();
      categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
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
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to logout: " + err.message);
    }
  });
});
