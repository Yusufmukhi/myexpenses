// ---------------- Firebase Imports ----------------
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
  storageBucket: "expensestracker-36711.appspot.com",
  messagingSenderId: "111920440061",
  appId: "1:111920440061:web:3af7eff29b1896280ad494",
  measurementId: "G-RC8QLYP6FZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- DOM Elements ----------------
const form = document.getElementById("incomeForm");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const sourceSelect = document.getElementById("source");
const customSourceInput = document.getElementById("newSource");
const addSourceBtn = document.getElementById("addSourceBtn");
const descriptionInput = document.getElementById("description");
const incomeList = document.getElementById("incomeList");
const totalIncomeSpan = document.getElementById("totalIncome");
const sortSelect = document.getElementById("sortSelect");

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let currentUser = null;
let sortField = "createdAt";
let sortAsc = false;

// ---------------- Sidebar toggle ----------------
menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});

overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// ---------------- Auth State ----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  dateInput.value = new Date().toISOString().split("T")[0];
  await loadIncomeSources();
  await loadIncomes();
});

// ---------------- Add New Source ----------------
addSourceBtn?.addEventListener("click", async () => {
  const newSource = customSourceInput.value.trim();
  if (!newSource) return alert("Enter a source name");

  try {
    await addDoc(collection(db, "incomeSources"), {
      uid: currentUser.uid,
      name: newSource,
      createdAt: new Date(),
    });
    customSourceInput.value = "";
    await loadIncomeSources();
    alert("Source added!");
  } catch (err) {
    console.error("Add source error:", err);
    alert("Failed to add source");
  }
});

// ---------------- Load Income Sources ----------------
async function loadIncomeSources() {
  const q = query(
    collection(db, "incomeSources"),
    where("uid", "==", currentUser.uid),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);

  // Reset dropdown
  sourceSelect.innerHTML = '<option value="">Select Source</option>';

  // Append saved sources
  snapshot.forEach((docSnap) => {
    const src = docSnap.data();
    const option = document.createElement("option");
    option.value = src.name;
    option.textContent = src.name;
    sourceSelect.appendChild(option);
  });

  // Keep "Other" always at last
  const otherOption = document.createElement("option");
  otherOption.value = "other";
  otherOption.textContent = "Other";
  sourceSelect.appendChild(otherOption);
}

// ---------------- Show Custom Source Input ----------------
sourceSelect?.addEventListener("change", () => {
  const showCustom = sourceSelect.value === "other";
  customSourceInput.classList.toggle("hidden", !showCustom);
  addSourceBtn.classList.toggle("hidden", !showCustom);
});

// ---------------- Add Income ----------------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Please login first.");

  const date = dateInput.value;
  const amount = parseFloat(amountInput.value);
  const source =
    sourceSelect.value === "other"
      ? customSourceInput.value.trim()
      : sourceSelect.value;
  const description = descriptionInput.value;

  if (!date || !amount || !source)
    return alert("Please fill all required fields.");

  try {
    await addDoc(collection(db, "incomes"), {
      uid: currentUser.uid,
      date,
      amount,
      source,
      description,
      createdAt: new Date(),
    });

    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    await loadIncomes();
  } catch (err) {
    console.error("Add income error:", err);
    alert("Failed to add income");
  }
});

// ---------------- Load Incomes ----------------
async function loadIncomes() {
  if (!currentUser) return;
  const q = query(
    collection(db, "incomes"),
    where("uid", "==", currentUser.uid),
    orderBy(sortField, sortAsc ? "asc" : "desc")
  );
  const snapshot = await getDocs(q);

  incomeList.innerHTML = "";
  let total = 0;

  snapshot.forEach((docSnap) => {
    const income = docSnap.data();
    const li = document.createElement("li");
    li.className =
      "py-2 flex justify-between items-center text-sm sm:text-base";
    li.innerHTML = `
      <div>
        <p class="font-medium text-gray-800">₹${income.amount.toFixed(2)}</p>
        <p class="text-gray-500">${income.source} • ${income.date}</p>
        ${
          income.description
            ? `<p class="text-gray-400">${income.description}</p>`
            : ""
        }
      </div>
      <button class="deleteBtn text-red-600 hover:text-red-800 text-sm" data-id="${
        docSnap.id
      }">
        Delete
      </button>
    `;
    incomeList.appendChild(li);
    total += income.amount;
  });

  totalIncomeSpan.textContent = `₹${total.toFixed(2)}`;

  // Delete Functionality
  incomeList.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await deleteDoc(doc(db, "incomes", btn.dataset.id));
        await loadIncomes();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete income (check rules).");
      }
    });
  });
}

// ---------------- Sorting ----------------
sortSelect?.addEventListener("change", async () => {
  const value = sortSelect.value;
  if (value === "recent") {
    sortField = "createdAt";
    sortAsc = false;
  } else if (value === "amount") {
    sortField = "amount";
    sortAsc = false;
  } else if (value === "source") {
    sortField = "source";
    sortAsc = true;
  }
  await loadIncomes();
});

// ---------------- Logout ----------------
document.querySelectorAll(".logout").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
});
