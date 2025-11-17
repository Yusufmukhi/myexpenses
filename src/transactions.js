document.addEventListener("DOMContentLoaded", function () {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const username = currentUser.username;
  const transactionsKey = `transactions_${username}`; // user-specific key

  // Mobile menu toggle
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

  // Logout buttons
  const logoutButtons = document.querySelectorAll(".logout");
  if (currentUser.role === "guest") {
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
  } else {
    logoutButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.removeItem("rememberMe");
        window.location.href = "login.html";
      });
    });
  }

  const form = document.getElementById("transactionForm");
  const transactionList = document.getElementById("transactionList");
  const totalAmount = document.getElementById("totalAmount");
  const totalGiven = document.getElementById("totalGiven");
  const totalTaken = document.getElementById("totalTaken");
  const sortSelect = document.getElementById("sortSelect");

  let transactions = JSON.parse(localStorage.getItem(transactionsKey)) || [];
  let persons = JSON.parse(localStorage.getItem(`persons_${username}`)) || [];

  function saveTransactions() {
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
  }

  function updateTotals() {
    let given = 0,
      taken = 0;
    transactions.forEach((t) => {
      if (!t.completed) {
        if (t.type === "given") given += t.amount;
        if (t.type === "taken") taken += t.amount;
      }
    });
    totalGiven.textContent = `₹${given.toFixed(2)}`;
    totalTaken.textContent = `₹${taken.toFixed(2)}`;
    totalAmount.textContent = `₹${(given - taken).toFixed(2)}`;
  }

  function renderTransactions() {
    transactionList.innerHTML = "";

    let sorted = [...transactions];
    const sortBy = sortSelect.value;
    if (sortBy === "recent") sorted.sort((a, b) => b.id - a.id);
    else if (sortBy === "oldest") sorted.sort((a, b) => a.id - b.id);
    else if (sortBy === "highest") sorted.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "lowest") sorted.sort((a, b) => a.amount - b.amount);

    sorted.forEach((t) => {
      if (!t.id) t.id = Date.now() + Math.floor(Math.random() * 1000);

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

      const tickBtn = li.querySelector(".tick");
      tickBtn.addEventListener("click", () => {
        t.completed = !t.completed;
        saveTransactions();
        renderTransactions();
        updateTotals();
      });

      const deleteBtn = li.querySelector(".delete");
      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this transaction?")) {
          transactions = transactions.filter((tr) => tr.id !== t.id);
          saveTransactions();
          renderTransactions();
          updateTotals();
        }
      });

      transactionList.appendChild(li);
    });

    updateTotals();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const person = document.getElementById("person").value.trim();
    const type = document.getElementById("type").value;
    const description = document.getElementById("description").value.trim();

    if (!date || !amount || !person || !type) {
      alert("Please fill in all required fields.");
      return;
    }

    const transaction = {
      id: Date.now(),
      date,
      amount,
      person,
      type,
      description,
      completed: false,
    };

    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    form.reset();
    document.getElementById("date").value = new Date()
      .toISOString()
      .split("T")[0];
  });

  // Person dropdown logic
  function loadPersons() {
    const personSelect = document.getElementById("person");
    personSelect.innerHTML = '<option value="">Select Person</option>';
    persons.forEach((person) => {
      const option = document.createElement("option");
      option.value = person;
      option.textContent = person;
      personSelect.appendChild(option);
    });
    const addNewOption = document.createElement("option");
    addNewOption.value = "new";
    addNewOption.textContent = "Add New Person";
    personSelect.appendChild(addNewOption);
  }

  loadPersons();

  document.getElementById("person").addEventListener("change", (e) => {
    const newPersonInput = document.getElementById("newPerson");
    const addPersonBtn = document.getElementById("addPersonBtn");
    if (e.target.value === "new") {
      newPersonInput.classList.remove("hidden");
      addPersonBtn.classList.remove("hidden");
    } else {
      newPersonInput.classList.add("hidden");
      addPersonBtn.classList.add("hidden");
    }
  });

  document.getElementById("addPersonBtn").addEventListener("click", () => {
    const newPersonInput = document.getElementById("newPerson");
    const newPerson = newPersonInput.value.trim();
    if (newPerson && !persons.includes(newPerson)) {
      persons.push(newPerson);
      localStorage.setItem(`persons_${username}`, JSON.stringify(persons));
      loadPersons();
      newPersonInput.value = "";
      newPersonInput.classList.add("hidden");
      document.getElementById("addPersonBtn").classList.add("hidden");
    }
  });

  sortSelect.addEventListener("change", () => renderTransactions());
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];

  renderTransactions();

  // Add transaction types dynamically per user
  const addTransactionTypeBtn = document.getElementById(
    "addTransactionTypeBtn"
  );
  const newTransactionTypeInput = document.getElementById("newTransactionType");

  addTransactionTypeBtn?.addEventListener("click", () => {
    const newType = newTransactionTypeInput.value.trim();
    if (!newType) return alert("Please enter a transaction type.");

    const transactionsData =
      JSON.parse(localStorage.getItem(transactionsKey)) || [];
    const existingTypes = transactionsData.map((e) => e.type);
    if (!existingTypes.includes(newType)) {
      transactionsData.push({ type: newType });
      localStorage.setItem(transactionsKey, JSON.stringify(transactionsData));

      const option = document.createElement("option");
      option.value = newType;
      option.textContent = newType;
      document.getElementById("type").appendChild(option);

      alert("Transaction type added successfully!");
    } else {
      alert("Transaction type already exists.");
    }
    newTransactionTypeInput.value = "";
  });
});
