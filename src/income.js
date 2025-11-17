const incomeForm = document.getElementById("form");
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const username = currentUser?.username;
const incomesKey = `incomes_${username}`; // user-specific key

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const sourceSelect = document.getElementById("source");
const addSourceBtn = document.getElementById("addSource");
const customSourceInput = document.getElementById("customSource");
const recentTransactionsList = document.getElementById("recentTransactions");
const viewAllBtn = document.getElementById("viewAllBtn");

// Sidebar toggle
menuButton?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});
overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// Initialize default sources in dropdown only
function initializeIncomeSources() {
  const defaultIncomeSources = ["Salary", "Business", "Investments", "Other"];
  const customSources = JSON.parse(localStorage.getItem("customSources")) || [];
  const allSources = [...defaultIncomeSources, ...customSources];

  sourceSelect.innerHTML = '<option value="">Select Source</option>';
  allSources.forEach((src) => {
    const option = document.createElement("option");
    option.value = src;
    option.textContent = src;
    sourceSelect.appendChild(option);
  });
}

// Custom sources
sourceSelect?.addEventListener("change", () => {
  if (sourceSelect.value.toLowerCase() === "other") {
    customSourceInput.classList.remove("hidden");
    addSourceBtn.classList.remove("hidden");
  } else {
    customSourceInput.classList.add("hidden");
    addSourceBtn.classList.add("hidden");
  }
});

addSourceBtn?.addEventListener("click", () => {
  const newSource = customSourceInput.value.trim();
  if (newSource) {
    const customSources =
      JSON.parse(localStorage.getItem("customSources")) || [];
    if (!customSources.includes(newSource)) {
      customSources.push(newSource);
      localStorage.setItem("customSources", JSON.stringify(customSources));

      const option = document.createElement("option");
      option.value = newSource;
      option.textContent = newSource;
      sourceSelect.appendChild(option);

      alert("Source added successfully!");
    } else {
      alert("Source already exists.");
    }
    customSourceInput.value = "";
    customSourceInput.classList.add("hidden");
    addSourceBtn.classList.add("hidden");
    sourceSelect.value = newSource;
  } else {
    alert("Please enter a source name.");
  }
});

// Guest users & default date
document.addEventListener("DOMContentLoaded", function () {
  const logoutButtons = document.querySelectorAll(".logout");
  if (currentUser && currentUser.role === "guest") {
    logoutButtons.forEach((btn) => {
      btn.textContent = "Login";
      btn.classList.remove(
        "bg-red-600",
        "hover:bg-red-700",
        "hover:bg-gray-200"
      );
      btn.classList.add("bg-blue-600", "hover:bg-blue-700", "text-white");
      btn.addEventListener(
        "click",
        () => (window.location.href = "login.html")
      );
    });
  }

  const dateInput = document.getElementById("date");
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

  initializeIncomeSources();
  addMonthlyIncomeIfFirstDay();
  loadRecentTransactions();
});

// Function: add monthly incomes on the 1st day
function addMonthlyIncomeIfFirstDay() {
  const today = new Date();
  const incomes = JSON.parse(localStorage.getItem(incomesKey)) || [];
  const monthlySettings =
    JSON.parse(localStorage.getItem("monthlyIncomeSettings")) || [];

  const lastAdded = localStorage.getItem(`lastMonthlyIncomeAdded_${username}`);
  const todayStr = today.toISOString().split("T")[0];

  if (
    today.getDate() === 1 &&
    lastAdded !== todayStr &&
    monthlySettings.length > 0
  ) {
    monthlySettings.forEach((entry) => {
      incomes.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: todayStr,
        amount: entry.amount,
        source: entry.source,
        description: entry.description || "Monthly Income",
      });
    });
    localStorage.setItem(incomesKey, JSON.stringify(incomes));
    localStorage.setItem(`lastMonthlyIncomeAdded_${username}`, todayStr);
  }
}

// Form submission
incomeForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) {
    if (confirm("You are not logged in. Do you want to login?")) {
      window.location.href = "login.html";
      return;
    }
  } else if (currentUser.role === "guest") {
    if (
      confirm(
        "Guest users cannot add income. Click OK to login or Cancel to continue as guest."
      )
    ) {
      window.location.href = "login.html";
      return;
    } else return;
  }

  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const source = document.getElementById("source").value;
  const description = document.getElementById("description").value;

  if (!date || !amount || isNaN(amount) || !source) {
    alert("Please fill in all required fields.");
    return;
  }

  const incomeEntry = { id: Date.now(), date, amount, source, description };
  const incomes = JSON.parse(localStorage.getItem(incomesKey)) || [];
  incomes.push(incomeEntry);
  localStorage.setItem(incomesKey, JSON.stringify(incomes));

  alert("Income added successfully!");
  incomeForm.reset();
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];
  sourceSelect.value = "";
  loadRecentTransactions();
});

// Load recent transactions
function loadRecentTransactions(limit = 5) {
  let incomes = JSON.parse(localStorage.getItem(incomesKey)) || [];
  recentTransactionsList.innerHTML = "";

  if (incomes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No recent transactions found.";
    emptyMessage.classList.add("text-gray-500", "text-center", "py-2");
    recentTransactionsList.appendChild(emptyMessage);
    document.getElementById("totalIncome").textContent = "₹0.00";
    return;
  }

  let total = 0;
  const validIncomes = incomes.filter(
    (income) =>
      income && typeof income.amount === "number" && !isNaN(income.amount)
  );

  validIncomes
    .slice(-limit)
    .reverse()
    .forEach((income) => {
      if (!income.id) income.id = Date.now() + Math.floor(Math.random() * 1000);
      total += income.amount;

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
        <span>${income.date} - ${income.source}</span>
        <span>${income.description || ""}</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-semibold text-green-600">₹${income.amount.toFixed(
          2
        )}</span>
        <button class="deleteBtn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${
          income.id
        }">
          Delete
        </button>
      </div>
      `;
      recentTransactionsList.appendChild(li);
    });

  document.getElementById("totalIncome").textContent = `₹${total.toFixed(2)}`;

  // Attach delete functionality
  recentTransactionsList.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const updatedIncomes = incomes.filter((i) => i.id !== id);
      localStorage.setItem(incomesKey, JSON.stringify(updatedIncomes));
      incomes = updatedIncomes;
      loadRecentTransactions(limit);
    });
  });
}

// View all button
viewAllBtn?.addEventListener("click", () => loadRecentTransactions(Infinity));
