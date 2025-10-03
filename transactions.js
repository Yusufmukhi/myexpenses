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
  updateDoc,
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
const transactionForm = document.getElementById("transactionForm");
const transactionDate = document.getElementById("date");
const transactionAmount = document.getElementById("amount");
const transactionPerson = document.getElementById("person");
const newPersonInput = document.getElementById("newPerson");
const addPersonBtn = document.getElementById("addPersonBtn");
const transactionType = document.getElementById("type");
const transactionDesc = document.getElementById("description");
const transactionList = document.getElementById("transactionList");
const totalAmount = document.getElementById("totalAmount");
const totalGiven = document.getElementById("totalGiven");
const totalTaken = document.getElementById("totalTaken");
const sortSelect = document.getElementById("sortSelect");

let currentUser = null;
let transactions = [];
let persons = [];

const today = new Date().toISOString().split("T")[0];

// ---------------- Auth ----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) window.location.href = "login.html";
  currentUser = user;
  transactionDate.value = today;
  await loadPersons();
  await loadTransactions();
});

// ---------------- Load Persons ----------------
async function loadPersons() {
  if (!currentUser) return;
  const q = query(
    collection(db, "persons"),
    where("uid", "==", currentUser.uid),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  persons = snapshot.docs.map((doc) => doc.data().name);

  transactionPerson.innerHTML = '<option value="">Select Person</option>';
  persons.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    transactionPerson.appendChild(opt);
  });

  const newOpt = document.createElement("option");
  newOpt.value = "new";
  newOpt.textContent = "Add New Person";
  transactionPerson.appendChild(newOpt);

  newPersonInput.classList.add("hidden");
  addPersonBtn.classList.add("hidden");
}

// Show Add Person input when selected
transactionPerson.addEventListener("change", () => {
  if (transactionPerson.value === "new") {
    newPersonInput.classList.remove("hidden");
    addPersonBtn.classList.remove("hidden");
  } else {
    newPersonInput.classList.add("hidden");
    addPersonBtn.classList.add("hidden");
  }
});

// Add new person
addPersonBtn.addEventListener("click", async () => {
  const newPerson = newPersonInput.value.trim();
  if (!newPerson) return alert("Enter person name");
  if (persons.includes(newPerson)) return alert("Person already exists");

  try {
    await addDoc(collection(db, "persons"), {
      uid: currentUser.uid,
      name: newPerson,
      createdAt: new Date(),
    });
    await loadPersons();
    transactionPerson.value = newPerson;
    newPersonInput.value = "";
    newPersonInput.classList.add("hidden");
    addPersonBtn.classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert("Error adding person: " + err.message);
  }
});

// ---------------- Add Transaction ----------------
transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = transactionDate.value;
  const amount = parseFloat(transactionAmount.value);
  const person =
    transactionPerson.value === "new"
      ? newPersonInput.value.trim()
      : transactionPerson.value;
  const type = transactionType.value;
  const description = transactionDesc.value;

  if (!date || !amount || !person || !type) return alert("Fill all fields");

  try {
    await addDoc(collection(db, "transactions"), {
      uid: currentUser.uid,
      date,
      amount,
      person,
      type,
      description,
      completed: false,
      createdAt: new Date(),
    });
    transactionForm.reset();
    transactionDate.value = today;
    await loadTransactions();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ---------------- Load Transactions ----------------
async function loadTransactions() {
  if (!currentUser) return;
  const q = query(
    collection(db, "transactions"),
    where("uid", "==", currentUser.uid)
  );
  const snapshot = await getDocs(q);
  transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderTransactions();
}

// ---------------- Render Transactions ----------------
function renderTransactions() {
  transactionList.innerHTML = "";
  let sorted = [...transactions];
  const sortBy = sortSelect.value;

  if (sortBy === "recent")
    sorted.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  else if (sortBy === "oldest")
    sorted.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  else if (sortBy === "highest") sorted.sort((a, b) => b.amount - a.amount);
  else if (sortBy === "lowest") sorted.sort((a, b) => a.amount - b.amount);

  let given = 0,
    taken = 0;

  sorted.forEach((t) => {
    // Only include NOT completed transactions in totals
    if (!t.completed) {
      if (t.type === "given") given += t.amount;
      else if (t.type === "taken") taken += t.amount;
    }

    const li = document.createElement("li");
    li.classList.add(
      "py-2",
      "flex",
      "justify-between",
      "items-center",
      "border-b",
      "border-gray-200"
    );
    li.innerHTML = `
      <div class="flex flex-col">
        <p class="${
          t.completed ? "line-through text-gray-400" : ""
        } font-medium">
          ${t.date} - ${t.person} - ${t.type} - ₹${t.amount.toFixed(2)}
        </p>
        <p class="text-gray-500 text-sm">${t.description || ""}</p>
      </div>
      <div class="flex gap-2">
        <button class="tick text-white px-2 py-1 rounded hover:opacity-90 transition">
          <i class="fas ${
            t.completed ? "fa-undo bg-gray-400" : "fa-check bg-green-500"
          } px-2 py-1 rounded"></i>
        </button>
        <button class="delete bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Tick
    li.querySelector(".tick").addEventListener("click", async () => {
      try {
        const docRef = doc(db, "transactions", t.id);
        await updateDoc(docRef, { completed: !t.completed });
        await loadTransactions();
      } catch (err) {
        console.error(err);
        alert("Error updating transaction: " + err.message);
      }
    });

    // Delete
    li.querySelector(".delete").addEventListener("click", async () => {
      if (confirm("Are you sure?")) {
        try {
          await deleteDoc(doc(db, "transactions", t.id));
          await loadTransactions();
        } catch (err) {
          console.error(err);
        }
      }
    });

    transactionList.appendChild(li);
  });

  totalGiven.textContent = `₹${given.toFixed(2)}`;
  totalTaken.textContent = `₹${taken.toFixed(2)}`;
  totalAmount.textContent = `₹${(given - taken).toFixed(2)}`;
}

sortSelect.addEventListener("change", () => renderTransactions());

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
