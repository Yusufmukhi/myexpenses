const form = document.getElementById("form");
const recentTransactionsList = document.getElementById("recentTransactions");
const totalSavingsEl = document.getElementById("totalSavings");
const totalNetWorthEl = document.getElementById("totalNetWorth");
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const username = currentUser?.username;
const savingsKey = `savings_${username}`; // user-specific key

// Sidebar toggle
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
const submission = document.getElementById("sumbit");
submission?.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!currentUser) {
    if (confirm("You are not logged in. Do you want to login?")) {
      window.location.href = "login.html";
      return;
    }
  } else if (currentUser.role === "guest") {
    if (
      confirm(
        "Guest users cannot add Savings. Click OK to login or Cancel to continue as guest."
      )
    ) {
      window.location.href = "login.html";
      return;
    } else {
      return; // guest cannot add income
    }
  }
});

document.querySelectorAll(".logout").forEach((btn) => {
  if (currentUser?.role === "guest") {
    btn.textContent = "Login";
    btn.classList.remove("bg-red-600", "hover:bg-red-700");
    btn.classList.add("bg-blue-600", "hover:bg-blue-700", "text-white");
    btn.addEventListener("click", () => (window.location.href = "login.html"));
  }
});

// Logout for guest users
document.querySelectorAll(".logout").forEach((btn) => {
  if (currentUser?.role === "guest") {
    btn.textContent = "Login";
    btn.classList.remove("bg-red-600", "hover:bg-red-700");
    btn.classList.add("bg-blue-600", "text-white", "hover:bg-blue-500");
    btn.addEventListener("click", () => (window.location.href = "login.html"));
  }
});

// Set default date to today
const dateInput = document.getElementById("date");
if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

// Add new saving type dynamically
const addSavingTypeBtn = document.getElementById("addSavingTypeBtn");
const newSavingTypeInput = document.getElementById("newSavingType");

addSavingTypeBtn?.addEventListener("click", () => {
  const newType = newSavingTypeInput.value.trim();
  if (!newType) return alert("Please enter a saving type.");

  const savings = JSON.parse(localStorage.getItem(savingsKey)) || [];
  const existingTypes = savings.map((e) => e.type);
  if (existingTypes.includes(newType))
    return alert("Saving type already exists.");

  savings.push({ type: newType });
  localStorage.setItem(savingsKey, JSON.stringify(savings));

  const option = document.createElement("option");
  option.value = newType;
  option.textContent = newType;
  document.getElementById("type").appendChild(option);

  alert("Saving type added successfully!");
  newSavingTypeInput.value = "";
});

// Load transactions
function loadTransactions() {
  let transactions = JSON.parse(localStorage.getItem(savingsKey)) || [];
  recentTransactionsList.innerHTML = "";

  let totalSavings = 0;
  let totalNetWorth = 0;

  transactions
    .slice()
    .reverse()
    .forEach((tx) => {
      if (!tx.id) tx.id = Date.now() + Math.floor(Math.random() * 1000);

      const li = document.createElement("li");
      li.classList.add("py-2", "flex", "justify-between", "items-center");

      li.innerHTML = `
      <div>
        <span class="font-medium">${tx.date || ""}</span> - 
        <span>${tx.description || tx.type}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold ${
          tx.type === "netWorth" ? "text-blue-600" : "text-green-600"
        }">₹${tx.amount?.toFixed(2) || "0.00"}</span>
        <button class="deleteBtn text-red-600 hover:text-red-800" data-id="${
          tx.id
        }">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
      recentTransactionsList.appendChild(li);

      if (tx.type === "netWorth") totalNetWorth += tx.amount || 0;
      totalSavings += tx.amount || 0;
    });

  totalSavingsEl.textContent = `₹${totalSavings.toFixed(2)}`;
  totalNetWorthEl.textContent = `₹${totalNetWorth.toFixed(2)}`;

  // Delete functionality
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      transactions = transactions.filter((tx) => tx.id !== id);
      localStorage.setItem(savingsKey, JSON.stringify(transactions));
      loadTransactions();
    });
  });
}

// Form submit
form?.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!currentUser) {
    if (confirm("You are not logged in. Login?"))
      window.location.href = "login.html";
    return;
  } else if (currentUser.role === "guest") {
    if (!confirm("Guest users cannot add savings. Login?")) return;
    window.location.href = "login.html";
    return;
  }

  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value;

  if (!date || !amount || !type)
    return alert("Please fill all required fields.");

  const newTx = { id: Date.now(), date, amount, type, description };
  const transactions = JSON.parse(localStorage.getItem(savingsKey)) || [];
  transactions.push(newTx);
  localStorage.setItem(savingsKey, JSON.stringify(transactions));

  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  loadTransactions();
});

// Initial load
loadTransactions();
