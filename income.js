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
const form = document.getElementById("form");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const sourceSelect = document.getElementById("source");
const customSourceInput = document.getElementById("newSource");
const addSourceBtn = document.getElementById("addSourceBtn");
const descriptionInput = document.getElementById("description");
const transactionsTbody = document.getElementById("transactions");
const totalIncomeSpan = document.getElementById("totalIncome");
const viewAllBtn = document.getElementById("viewAllBtn");

let currentUser = null;
let sortField = "createdAt"; // default sort by latest created
let sortAsc = false;

// ---------------- Sidebar toggle ----------------
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full"); // toggle sidebar
  overlay.classList.toggle("hidden"); // toggle overlay
});

overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full"); // hide sidebar
  overlay.classList.add("hidden"); // hide overlay
});

// ---------------- Auth state ----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  dateInput.value = new Date().toISOString().split("T")[0];
  await loadIncomeSources();
  await loadTransactions();
});

// ---------------- Add Source ----------------
addSourceBtn?.addEventListener("click", async () => {
  const newSource = customSourceInput.value.trim();
  if (!newSource) return alert("Enter a source name");

  try {
    await addDoc(collection(db, "incomeSources"), {
      uid: currentUser.uid, // ✅ add uid for rules
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

// ---------------- Load sources ----------------
async function loadIncomeSources() {
  const q = query(
    collection(db, "incomeSources"),
    where("uid", "==", currentUser.uid),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);

  // reset options
  sourceSelect.innerHTML = '<option value="">Select Source</option>';

  snapshot.forEach((docSnap) => {
    const src = docSnap.data();
    const option = document.createElement("option");
    option.value = src.name;
    option.textContent = src.name;
    sourceSelect.appendChild(option);
  });

  // always keep "other"
  const otherOption = document.createElement("option");
  otherOption.value = "other";
  otherOption.textContent = "Other";
  sourceSelect.appendChild(otherOption);
}

// ---------------- Show custom source input ----------------
sourceSelect?.addEventListener("change", () => {
  if (sourceSelect.value === "other") {
    customSourceInput.classList.remove("hidden");
    addSourceBtn.classList.remove("hidden");
  } else {
    customSourceInput.classList.add("hidden");
    addSourceBtn.classList.add("hidden");
  }
});

// ---------------- Add Income ----------------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = dateInput.value;
  const amount = parseFloat(amountInput.value);
  const source =
    sourceSelect.value === "other"
      ? customSourceInput.value.trim()
      : sourceSelect.value;
  const description = descriptionInput.value;

  if (!date || !amount || !source) return alert("Fill all required fields");

  try {
    await addDoc(collection(db, "incomes"), {
      uid: currentUser.uid, // ✅ add uid for rules
      date,
      amount,
      source,
      description,
      createdAt: new Date(),
    });

    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    await loadIncomeSources();
    await loadTransactions();
  } catch (err) {
    console.error("Add income error:", err);
    alert("Failed to add income");
  }
});

// ---------------- Load Transactions ----------------
async function loadTransactions(limit = 5) {
  const q = query(
    collection(db, "incomes"),
    where("uid", "==", currentUser.uid), // ✅ only user's data
    orderBy(sortField, sortAsc ? "asc" : "desc")
  );
  const snapshot = await getDocs(q);

  transactionsTbody.innerHTML = "";
  let total = 0;
  let count = 0;

  snapshot.forEach((docSnap) => {
    if (limit !== Infinity && count >= limit) return;
    count++;
    const income = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border p-2">${income.date}</td>
      <td class="border p-2">₹${income.amount.toFixed(2)}</td>
      <td class="border p-2">${income.source}</td>
      <td class="border p-2">${income.description || ""}</td>
      <td class="border p-2">
        <button class="deleteBtn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${
          docSnap.id
        }">Delete</button>
      </td>
    `;
    transactionsTbody.appendChild(tr);
    total += income.amount;
  });

  totalIncomeSpan.textContent = `₹${total.toFixed(2)}`;

  // Delete
  transactionsTbody.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await deleteDoc(doc(db, "incomes", btn.dataset.id));
        await loadTransactions(limit);
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete, maybe not your document.");
      }
    });
  });
}

// ---------------- View all ----------------
viewAllBtn?.addEventListener("click", () => loadTransactions(Infinity));

// ---------------- Sorting ----------------
document.querySelectorAll(".sortBtn").forEach((th) => {
  th.addEventListener("click", async () => {
    const field = th.dataset.field;
    if (sortField === field) sortAsc = !sortAsc;
    else {
      sortField = field;
      sortAsc = true;
    }
    await loadTransactions();
  });
});

// ---------------- Logout ----------------
document.querySelectorAll(".logout").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
});
