import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ---------------- Expenses Functionality ----------------
// Show expenses section

function showExpenses() {
  loginSection.classList.add("hidden");
  signupSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  expensesSection.classList.remove("hidden");

  // Initialize expenses functionality
  initializeExpenses();
}

// Initialize expenses functionality
function initializeExpenses() {
  const expensesForm = document.getElementById("expensesForm");
  const recentTransactionsList = document.getElementById("recentTransactions");
  const categorySelect = document.getElementById("category");
  const totalExpenseEl = document.getElementById("totalExpense");
  const viewAllBtn = document.getElementById("viewAllBtn");
  const addCategoryContainer = document.getElementById("addCategoryContainer");
  const newCategoryInput = document.getElementById("newCategory");
  const addCategoryBtn = document.getElementById("addCategoryBtn");

  // These elements might not exist, so use optional chaining
  const expensesMenuButton = document.getElementById("expensesMenuButton");
  const expensesSidebar = document.getElementById("expensesSidebar");
  const expensesOverlay = document.getElementById("expensesOverlay");

  console.log("Expenses form found:", !!expensesForm);
  console.log("Category select found:", !!categorySelect);

  // Only add event listeners if elements exist
  expensesMenuButton?.addEventListener("click", () => {
    expensesSidebar?.classList.toggle("-translate-x-full");
    expensesOverlay?.classList.toggle("hidden");
  });

  expensesOverlay?.addEventListener("click", () => {
    expensesSidebar?.classList.add("-translate-x-full");
    expensesOverlay?.classList.add("hidden");
  });

  // Rest of your existing code...

  // Debug form submission
  expensesForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted!");

    // Your existing form handling code...
  });
}
// Test if form is being captured
console.log("Expenses form:", document.getElementById("expensesForm"));
console.log("Submit button:", document.getElementById("submit"));

// Test form submission
const form = document.getElementById("expensesForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form submitted successfully!");
    alert("Form is working!");
  });
}
// ---------------- Navigation Event Listeners ----------------
// Add these to your existing DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // ... your existing code ...

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
});
