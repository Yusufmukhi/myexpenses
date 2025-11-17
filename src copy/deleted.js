import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    signOut,
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp, // added
    getDoc, // << added
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

  const deletedList = document.getElementById("deletedList");
  const totalDeletedSpan = document.getElementById("totalDeleted");
  const sortSelect = document.getElementById("sortSelect");
  const menuButton = document.getElementById("menuButton");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  let currentUser = null;
  let deletedExpenses = [];

  // ---------------- Auth ----------------
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    currentUser = user;
    loadDeletedTransactions();
  });

  // ---------------- Load Deleted Transactions ----------------
  async function loadDeletedTransactions() {
    const q = query(
      collection(db, "deleteTransactions"),
      where("uid", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);
    deletedExpenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderDeletedTransactions();
  }

  // ---------------- Render Deleted Transactions ----------------
  function renderDeletedTransactions() {
    const sortValue = sortSelect.value;
    if (sortValue === "amount") {
      deletedExpenses.sort((a, b) => b.amount - a.amount);
    } else if (sortValue === "category") {
      deletedExpenses.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      deletedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    deletedList.innerHTML = "";
    let total = 0;

    deletedExpenses.forEach((exp) => {
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
          <span class="font-semibold text-gray-600">₹${(exp.amount || 0).toFixed(2)}</span>
          <button data-id="${exp.id}" class="text-green-600 hover:text-green-800 revertBtn">
            <i class="fas fa-undo"></i>
          </button>
        </div>
      `;
      deletedList.appendChild(li);
    });

    totalDeletedSpan.textContent = `₹${total.toFixed(2)}`;

    // Revert logic
    document.querySelectorAll(".revertBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const exp = deletedExpenses.find((x) => x.id === id);
        if (!exp) return alert("Expense not found.");

        if (!confirm("Revert this expense back to active list?")) return;

        try {
          console.log("Reverting doc id:", id, "deleted doc:", exp, "currentUser:", currentUser);

          const ownerUid = exp.uid || currentUser?.uid;
          if (!ownerUid) throw new Error("No uid found on deleted doc and no authenticated user.");

          // 1) Add back to expenses — isolate and catch errors
          try {
            console.log("Attempting to add back to 'expenses' with uid:", ownerUid);
            await addDoc(collection(db, "expenses"), {
              uid: ownerUid,
              date: exp.date,
              amount: exp.amount,
              category: exp.category,
              description: exp.description,
              createdAt: serverTimestamp(),
              restoredAt: serverTimestamp(),
            });
            console.log("Add to 'expenses' succeeded");
          } catch (errAdd) {
            console.error("Add to 'expenses' failed:", errAdd);
            throw errAdd; // bubble to outer catch so we know which op failed
          }

          // 2) Verify archived doc owner and then delete — isolate and catch errors
          const delRef = doc(db, "deleteTransactions", id);
          const delSnap = await getDoc(delRef);
          if (!delSnap.exists()) {
            console.warn("Archived doc not found before delete:", id);
          } else if (delSnap.data().uid !== currentUser.uid) {
            throw new Error("Archived doc uid does not match current user (delete would be rejected).");
          }

          try {
            console.log("Attempting to delete archived doc:", id);
            await deleteDoc(delRef);
            console.log("Delete archived doc succeeded");
          } catch (errDel) {
            console.error("Delete archived doc failed:", errDel);
            throw errDel;
          }

          await loadDeletedTransactions();
        } catch (err) {
          console.error("Error reverting expense (detailed):", err);
          alert("Error reverting expense: " + (err.message || err));
        }
      });
    });
  }

  // ---------------- Sorting ----------------
  sortSelect?.addEventListener("change", renderDeletedTransactions);

  // ---------------- Sidebar ----------------
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
