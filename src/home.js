// ---------------- Firebase imports ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  getDocs,
  orderBy,
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

// ---------------- Initialize Firebase ----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- Global Variables ----------------
let currentUser = null;
let expensesUnsubscribe = null;
let entriesUnsubscribe = null;
let isInitialized = false;

// ---------------- DOM Elements ----------------
function getDOMElements() {
  return {
    loginSection: document.getElementById("loginSection"),
    signupSection: document.getElementById("signupSection"),
    dashboardSection: document.getElementById("dashboardSection"),
    expensesSection: document.getElementById("expensesSection"),
    authForm: document.getElementById("authForm"),
    signupForm: document.getElementById("signupForm"),
    guestLoginBtn: document.getElementById("guestLogin"),
    rememberMeCheckbox: document.getElementById("rememberMe"),
    usernameDisplay: document.getElementById("usernameDisplay"),
    logoutBtn: document.getElementById("logoutBtn"),
    sidebarLogoutBtn: document.getElementById("sidebarLogoutBtn"),
    menuButton: document.getElementById("menuButton"),
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    recentEntries: document.getElementById("recentEntries"),
    entryFilter: document.getElementById("entryFilter"),
    showSignupLink: document.getElementById("showSignupLink"),
    showLoginLink: document.getElementById("showLoginLink"),
  };
}

// ---------------- Utility Functions ----------------
function showLogin() {
  const { loginSection, signupSection, dashboardSection, expensesSection } =
    getDOMElements();
  signupSection?.classList.add("hidden");
  dashboardSection?.classList.add("hidden");
  expensesSection?.classList.add("hidden");
  loginSection?.classList.remove("hidden");

  // Clear form fields
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMe = document.getElementById("rememberMe");

  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
  if (rememberMe) rememberMe.checked = false;
}

function showSignup() {
  const { loginSection, signupSection, dashboardSection, expensesSection } =
    getDOMElements();
  loginSection?.classList.add("hidden");
  dashboardSection?.classList.add("hidden");
  expensesSection?.classList.add("hidden");
  signupSection?.classList.remove("hidden");

  // Clear form fields
  const signupUsername = document.getElementById("signupUsername");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupConfirmPassword = document.getElementById(
    "signupConfirmPassword"
  );

  if (signupUsername) signupUsername.value = "";
  if (signupEmail) signupEmail.value = "";
  if (signupPassword) signupPassword.value = "";
  if (signupConfirmPassword) signupConfirmPassword.value = "";
}

function showDashboard(user) {
  const {
    loginSection,
    signupSection,
    dashboardSection,
    expensesSection,
    usernameDisplay,
  } = getDOMElements();
  loginSection?.classList.add("hidden");
  signupSection?.classList.add("hidden");
  expensesSection?.classList.add("hidden");
  dashboardSection?.classList.remove("hidden");

  if (usernameDisplay) {
    usernameDisplay.textContent =
      user.displayName || user.email || user.username || "Guest";
  }
}

function showExpenses() {
  const { loginSection, signupSection, dashboardSection, expensesSection } =
    getDOMElements();
  loginSection?.classList.add("hidden");
  signupSection?.classList.add("hidden");
  dashboardSection?.classList.add("hidden");
  expensesSection?.classList.remove("hidden");

  // Initialize expenses functionality
  initializeExpenses();
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const { sidebar, overlay } = getDOMElements();
  sidebar?.classList.toggle("-translate-x-full");
  overlay?.classList.toggle("hidden");
}

// ---------------- Amount validation ----------------
const validateAmount = (value) => parseFloat(value) || 0;

// ---------------- Authentication ----------------
function initializeAuth() {
  const { authForm, signupForm, guestLoginBtn, showSignupLink, showLoginLink } =
    getDOMElements();

  // Login Form Submit
  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const rememberMe = document.getElementById("rememberMe")?.checked;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      };

      // Save current user
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedUser", JSON.stringify(user));
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUser");
        localStorage.removeItem("rememberMe");
      }

      currentUser = user;
      showDashboard(user);
      initializeListeners();
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });

  // Signup Form Submit
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value;
    const cpassword = document.getElementById("signupConfirmPassword")?.value;

    if (!username || !email || !password || !cpassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== cpassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save displayName
      await updateProfile(user, { displayName: username });

      // Save locally for dashboard integration
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: username,
        role: "user",
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));
      currentUser = userData;

      alert("Signup successful! Redirecting to dashboard...");
      showDashboard(userData);
      initializeListeners();
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  });

  // Guest Login
  guestLoginBtn?.addEventListener("click", () => {
    const guestUser = { username: "Guest" };
    localStorage.setItem("currentUser", JSON.stringify(guestUser));
    currentUser = guestUser;
    showDashboard(guestUser);
  });

  // Navigation between login and signup
  showSignupLink?.addEventListener("click", function (e) {
    e.preventDefault();
    showSignup();
  });

  showLoginLink?.addEventListener("click", function (e) {
    e.preventDefault();
    showLogin();
  });
}

// Logout
function logout() {
  // Unsubscribe from listeners
  if (expensesUnsubscribe) {
    expensesUnsubscribe();
    expensesUnsubscribe = null;
  }
  if (entriesUnsubscribe) {
    entriesUnsubscribe();
    entriesUnsubscribe = null;
  }

  signOut(auth)
    .then(() => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("rememberedUser");
      localStorage.removeItem("rememberMe");
      currentUser = null;
      showLogin();
    })
    .catch((error) => {
      console.error("Logout error:", error);
      // Fallback: clear local storage and show login
      localStorage.removeItem("currentUser");
      localStorage.removeItem("rememberedUser");
      localStorage.removeItem("rememberMe");
      currentUser = null;
      showLogin();
    });
}

// ---------------- Dashboard Functionality ----------------
function listenEntries() {
  if (!currentUser || !currentUser.uid) {
    console.log("No current user for entries listener");
    return;
  }

  console.log("Setting up entries listener for user:", currentUser.uid);

  const q = query(
    collection(db, "entries"),
    where("uid", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  // Unsubscribe from previous listener if exists
  if (entriesUnsubscribe) {
    entriesUnsubscribe();
  }

  entriesUnsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Entries real-time update:", entries.length, "entries");
      updateDashboard(entries);
      loadRecentEntries(entries);
    },
    (error) => {
      console.error("Entries listener error:", error);
    }
  );
}

// Update dashboard totals
function updateDashboard(entries) {
  console.log("Updating dashboard with", entries.length, "entries");

  const expenses = entries.filter((e) => e.category === "expenses");
  const incomes = entries.filter((e) => e.category === "incomes");
  const savings = entries.filter((e) => e.category === "savings");
  const transactions = entries.filter((e) => e.category === "transactions");

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + validateAmount(e.amount),
    0
  );
  const totalIncome = incomes.reduce(
    (sum, e) => sum + validateAmount(e.amount),
    0
  );
  const totalSavings = savings.reduce(
    (sum, e) => sum + validateAmount(e.amount),
    0
  );
  const totalTransactions = transactions.reduce((sum, t) => {
    if (t.type === "taken") return sum + validateAmount(t.amount);
    if (t.type === "given") return sum - validateAmount(t.amount);
    return sum;
  }, 0);

  const netWorth =
    totalIncome + totalSavings + totalTransactions - totalExpenses;
  const currentMoney = totalIncome + totalTransactions - totalExpenses;

  // Update DOM elements
  const currentMoneyEl = document.getElementById("currentMoney");
  const netWorthEl = document.getElementById("netWorth");
  const totalExpensesEl = document.getElementById("totalExpenses");
  const totalIncomeEl = document.getElementById("totalIncome");
  const totalSavingsEl = document.getElementById("totalSavings");
  const totalTransactionsEl = document.getElementById("totalTransactions");

  if (currentMoneyEl)
    currentMoneyEl.textContent = `₹${currentMoney.toFixed(2)}`;
  if (netWorthEl) netWorthEl.textContent = `₹${netWorth.toFixed(2)}`;
  if (totalExpensesEl)
    totalExpensesEl.textContent = `₹${totalExpenses.toFixed(2)}`;
  if (totalIncomeEl) totalIncomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
  if (totalSavingsEl)
    totalSavingsEl.textContent = `₹${totalSavings.toFixed(2)}`;
  if (totalTransactionsEl)
    totalTransactionsEl.textContent = `₹${totalTransactions.toFixed(2)}`;
}

// Load recent entries
function loadRecentEntries(entries = []) {
  const { recentEntries, entryFilter } = getDOMElements();
  if (!recentEntries) return;

  const filter = entryFilter?.value || "all";
  recentEntries.innerHTML = "";

  let filtered = entries;
  if (filter !== "all") filtered = entries.filter((e) => e.category === filter);

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No entries found.";
    li.className = "text-gray-500 text-center py-2";
    recentEntries.appendChild(li);
    return;
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach((entry) => {
    const li = document.createElement("li");
    li.className =
      "py-2 flex flex-col md:flex-row justify-between items-center";
    li.innerHTML = `
      <div class="flex flex-col md:flex-row gap-4">
        <span class="font-medium">${entry.date || ""} - ${
      entry.category.charAt(0).toUpperCase() + entry.category.slice(1)
    }</span>
        <span>${entry.description || ""}</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-semibold text-green-600">₹${validateAmount(
          entry.amount
        ).toFixed(2)}</span>
        <button class="deleteBtn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${
          entry.id
        }">Delete</button>
      </div>
    `;
    recentEntries.appendChild(li);
  });

  // Attach delete functionality
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await deleteDoc(doc(db, "entries", btn.dataset.id));
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Error deleting entry: " + error.message);
      }
    });
  });
}

// ---------------- Expenses Real-time Listener ----------------
function listenExpenses() {
  if (!currentUser || !currentUser.uid) {
    console.log("No current user for expenses listener");
    return;
  }

  console.log("Setting up expenses listener for user:", currentUser.uid);

  const q = query(
    collection(db, "entries"),
    where("uid", "==", currentUser.uid),
    where("category", "==", "expenses"),
    orderBy("createdAt", "desc")
  );

  // Unsubscribe from previous listener if exists
  if (expensesUnsubscribe) {
    expensesUnsubscribe();
  }

  expensesUnsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Expenses real-time update:", expenses.length, "expenses");
      updateExpensesDisplay(expenses);
    },
    (error) => {
      console.error("Expenses listener error:", error);
    }
  );
}

// Function to update expenses display
function updateExpensesDisplay(expenses, limit = 5) {
  const recentTransactionsList = document.getElementById("recentTransactions");
  const totalExpenseEl = document.getElementById("totalExpense");

  if (!recentTransactionsList || !totalExpenseEl) {
    console.log("Expenses elements not found (probably not on expenses page)");
    return;
  }

  console.log("Updating expenses display with", expenses.length, "expenses");

  recentTransactionsList.innerHTML = "";

  if (expenses.length === 0) {
    recentTransactionsList.innerHTML = `<li class="text-gray-500 text-center py-2">No expense transactions found</li>`;
    totalExpenseEl.textContent = "₹0.00";
    return;
  }

  const recentExpenses = expenses.slice(0, limit);

  let total = 0;
  recentExpenses.forEach((exp) => {
    total += exp.amount;
    const li = document.createElement("li");
    li.classList.add(
      "py-2",
      "flex",
      "flex-col",
      "md:flex-row",
      "justify-between",
      "items-center"
    );
    li.innerHTML = `
      <div class="flex flex-col md:flex-row gap-4">
        <span>${exp.date} - ${exp.subCategory || exp.category}</span>
        <span>${exp.description || ""}</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-semibold text-red-600">₹${exp.amount.toFixed(
          2
        )}</span>
        <button class="deleteExpenseBtn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${
          exp.id
        }">Delete</button>
      </div>
    `;
    recentTransactionsList.appendChild(li);
  });
  totalExpenseEl.textContent = `₹${total.toFixed(2)}`;

  // Re-attach delete functionality
  document.querySelectorAll(".deleteExpenseBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      try {
        await deleteDoc(doc(db, "entries", id));
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error deleting expense: " + error.message);
      }
    });
  });
}

// ---------------- Expenses Functionality ----------------
function initializeExpenses() {
  const expensesForm = document.getElementById("expensesForm");
  const viewAllBtn = document.getElementById("viewAllBtn");
  const categorySelect = document.getElementById("category");
  const addCategoryContainer = document.getElementById("addCategoryContainer");
  const newCategoryInput = document.getElementById("newCategory");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const expensesMenuButton = document.getElementById("expensesMenuButton");
  const expensesSidebar = document.getElementById("expensesSidebar");
  const expensesOverlay = document.getElementById("expensesOverlay");

  console.log("Initializing expenses UI...");

  // Sidebar toggle for expenses
  expensesMenuButton?.addEventListener("click", () => {
    expensesSidebar?.classList.toggle("-translate-x-full");
    expensesOverlay?.classList.toggle("hidden");
  });

  expensesOverlay?.addEventListener("click", () => {
    expensesSidebar?.classList.add("-translate-x-full");
    expensesOverlay?.classList.add("hidden");
  });

  // Default date
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  // Add category functionality
  categorySelect?.addEventListener("change", () => {
    if (categorySelect.value === "Other") {
      addCategoryContainer?.classList.remove("hidden");
    } else {
      addCategoryContainer?.classList.add("hidden");
    }
  });

  addCategoryBtn?.addEventListener("click", () => {
    const newCat = newCategoryInput?.value.trim();
    if (!newCat) return alert("Enter a valid category name.");
    const exists = Array.from(categorySelect.options).some(
      (o) => o.value.toLowerCase() === newCat.toLowerCase()
    );
    if (exists) return alert("Category already exists.");
    const option = document.createElement("option");
    option.value = newCat;
    option.textContent = newCat;
    categorySelect.appendChild(option);
    categorySelect.value = newCat;
    newCategoryInput.value = "";
    addCategoryContainer?.classList.add("hidden");
    alert("Category added successfully!");
  });

  // Submit expense
  expensesForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Expense form submitted!");

    if (!currentUser || !currentUser.uid) {
      alert("Please log in to add expenses.");
      return;
    }

    const date = document.getElementById("date")?.value;
    const amountInput = document.getElementById("amount");
    const amount = parseFloat(amountInput?.value);
    const category = categorySelect?.value;
    const description = document.getElementById("description")?.value;

    // Validation
    if (!date) {
      alert("Please select a date.");
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      amountInput?.focus();
      return;
    }

    if (!category) {
      alert("Please select a category.");
      categorySelect?.focus();
      return;
    }

    try {
      console.log("Adding expense to Firebase...");

      const expenseData = {
        uid: currentUser.uid,
        date,
        amount,
        category: "expenses",
        subCategory: category,
        description,
        createdAt: new Date(),
      };

      console.log("Expense data to save:", expenseData);

      await addDoc(collection(db, "entries"), expenseData);

      // Reset form
      expensesForm.reset();
      // Set default date again
      const dateInput = document.getElementById("date");
      if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Error adding expense: " + error.message);
    }
  });

  viewAllBtn?.addEventListener("click", () => {
    if (!currentUser || !currentUser.uid) return;

    const q = query(
      collection(db, "entries"),
      where("uid", "==", currentUser.uid),
      where("category", "==", "expenses"),
      orderBy("createdAt", "desc")
    );

    getDocs(q)
      .then((snapshot) => {
        const allExpenses = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        updateExpensesDisplay(allExpenses, Infinity);
      })
      .catch((error) => {
        console.error("Error loading all expenses:", error);
      });
  });
}

// ---------------- Initialize Listeners ----------------
function initializeListeners() {
  console.log("Initializing Firebase listeners...");

  // Set up real-time listeners
  listenEntries();
  listenExpenses();

  // Set up navigation
  const { menuButton, overlay, logoutBtn, sidebarLogoutBtn, entryFilter } =
    getDOMElements();

  // Mobile menu toggle
  menuButton?.addEventListener("click", toggleSidebar);
  overlay?.addEventListener("click", toggleSidebar);

  // Logout buttons
  logoutBtn?.addEventListener("click", logout);
  sidebarLogoutBtn?.addEventListener("click", logout);

  // Navigation between sections
  document.querySelectorAll(".dashboard-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showDashboard(currentUser || { username: "User" });
    });
  });

  document.querySelectorAll(".expenses-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showExpenses();
    });
  });

  // Expenses logout buttons
  document
    .getElementById("expensesLogoutBtn")
    ?.addEventListener("click", logout);
  document
    .getElementById("expensesSidebarLogoutBtn")
    ?.addEventListener("click", logout);

  // Filter dropdown
  if (entryFilter) {
    entryFilter.addEventListener("change", () => {
      // This will be handled by the real-time listener
    });
  }
}

// ---------------- Main Initialization ----------------
function initializeApp() {
  if (isInitialized) return;
  isInitialized = true;

  console.log("Initializing application...");

  // Initialize auth system
  initializeAuth();

  // Set up Firebase auth state listener
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user);

    if (user) {
      // User is signed in
      currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };

      // Save to localStorage
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      showDashboard(currentUser);
      initializeListeners();
    } else {
      // User is signed out
      const rememberedUser = JSON.parse(localStorage.getItem("rememberedUser"));
      const currentUserLocal = JSON.parse(localStorage.getItem("currentUser"));

      if (rememberedUser || currentUserLocal) {
        // Use stored user data
        currentUser = rememberedUser || currentUserLocal;
        showDashboard(currentUser);
        initializeListeners();
      } else {
        // No user data, show login
        showLogin();
      }
    }
  });

  // Initial page load check
  const rememberedUser = JSON.parse(localStorage.getItem("rememberedUser"));
  const currentUserLocal = JSON.parse(localStorage.getItem("currentUser"));

  if (rememberedUser || currentUserLocal) {
    currentUser = rememberedUser || currentUserLocal;
    showDashboard(currentUser);
    // Listeners will be set up by auth state change
  } else {
    showLogin();
  }
}

// ---------------- Start the Application ----------------
document.addEventListener("DOMContentLoaded", initializeApp);
window.addEventListener("load", initializeApp);
