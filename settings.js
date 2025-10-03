document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return (window.location.href = "login.html");

  const form = document.getElementById("form");
  const categoryType = document.getElementById("categoryType");
  const dynamicFields = document.getElementById("dynamicFields");
  const recentEntries = document.getElementById("recentEntries");

  let currentSection = "";

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

  // Logout
  document.querySelectorAll(".logout").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("rememberMe");
      window.location.href = "login.html";
    });
  });

  const defaultData = {
    income: ["Salary", "Business", "Investments", "Other"],
    expenses: ["Food", "Transport", "Utilities", "Entertainment", "Other"],
    savings: ["Emergency Fund", "Retirement", "Vacation", "Other"],
    transactions: ["Loan", "Gift", "Investment", "Other"],
  };

  // Initialize localStorage defaults
  Object.keys(defaultData).forEach((section) => {
    const existing = JSON.parse(localStorage.getItem(section)) || [];
    const existingNames = existing.map((e) => e.source || e.category || e.type);
    const missing = defaultData[section].filter(
      (item) => !existingNames.includes(item)
    );
    if (missing.length > 0) {
      const updated = [...existing];
      missing.forEach((item) => {
        if (section === "income") updated.push({ source: item });
        if (section === "expenses") updated.push({ category: item });
        if (section === "savings") updated.push({ type: item });
        if (section === "transactions") updated.push({ type: item });
      });
      localStorage.setItem(section, JSON.stringify(updated));
    }
  });

  // Section dropdown change
  categoryType.addEventListener("change", () => {
    const section = categoryType.value;
    currentSection = section;
    renderFields(section);
    loadRecentEntries();
  });

  // Render dynamic fields
  function renderFields(section) {
    dynamicFields.innerHTML = "";
    if (!section) return;

    // Common fields
    dynamicFields.innerHTML = `
      <div>
        <label>Date</label>
        <input type="date" id="date" value="${
          new Date().toISOString().split("T")[0]
        }" required>
      </div>
      <div>
        <label>Amount (₹)</label>
        <input type="number" id="amount" placeholder="Enter amount" required>
      </div>
      <div>
        <label>Description</label>
        <textarea id="description" placeholder="Enter description"></textarea>
      </div>
    `;

    const extraDiv = document.createElement("div");
    const existingEntries = JSON.parse(localStorage.getItem(section)) || [];
    const options = [
      ...new Set(existingEntries.map((e) => e.source || e.category || e.type)),
    ];

    if (section === "income") {
      extraDiv.innerHTML = `
        <label>Source</label>
        <select id="source" required>
          <option value="">Select Source</option>
          ${options.map((o) => `<option value="${o}">${o}</option>`).join("")}
          <option value="other">Other</option>
        </select>
        <input type="text" id="customSource" placeholder="Enter new source" class="hidden">
        <button type="button" id="addSource" class="hidden">Add Source</button>
      `;
      dynamicFields.appendChild(extraDiv);

      const sourceSelect = document.getElementById("source");
      const customInput = document.getElementById("customSource");
      const addBtn = document.getElementById("addSource");

      sourceSelect.addEventListener("change", () => {
        if (sourceSelect.value === "other") {
          customInput.classList.remove("hidden");
          addBtn.classList.remove("hidden");
        } else {
          customInput.classList.add("hidden");
          addBtn.classList.add("hidden");
        }
      });

      addBtn.addEventListener("click", () => {
        const newVal = customInput.value.trim();
        if (!newVal) return alert("Enter source");
        if (options.includes(newVal)) return alert("Source exists");
        existingEntries.push({ source: newVal });
        localStorage.setItem(section, JSON.stringify(existingEntries));
        alert("Source added!");
        sourceSelect.innerHTML = `<option value="">Select Source</option>${[
          ...options,
          newVal,
        ]
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("")}<option value="other">Other</option>`;
        sourceSelect.value = newVal;
        customInput.value = "";
        customInput.classList.add("hidden");
        addBtn.classList.add("hidden");
      });
    }

    if (section === "expenses") {
      extraDiv.innerHTML = `
        <label>Category</label>
        <select id="category" required>
          <option value="">Select Category</option>
          ${options.map((o) => `<option value="${o}">${o}</option>`).join("")}
          <option value="other">Other</option>
        </select>
        <input type="text" id="customCategory" placeholder="Enter new category" class="hidden">
        <button type="button" id="addCategory" class="hidden">Add Category</button>
      `;
      dynamicFields.appendChild(extraDiv);

      const select = document.getElementById("category");
      const input = document.getElementById("customCategory");
      const btn = document.getElementById("addCategory");

      select.addEventListener("change", () => {
        if (select.value === "other") {
          input.classList.remove("hidden");
          btn.classList.remove("hidden");
        } else {
          input.classList.add("hidden");
          btn.classList.add("hidden");
        }
      });

      btn.addEventListener("click", () => {
        const val = input.value.trim();
        if (!val) return alert("Enter category");
        if (options.includes(val)) return alert("Category exists");
        existingEntries.push({ category: val });
        localStorage.setItem(section, JSON.stringify(existingEntries));
        alert("Category added!");
        select.innerHTML = `<option value="">Select Category</option>${[
          ...options,
          val,
        ]
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("")}<option value="other">Other</option>`;
        select.value = val;
        input.value = "";
        input.classList.add("hidden");
        btn.classList.add("hidden");
      });
    }

    if (section === "savings") {
      extraDiv.innerHTML = `
        <label>Savings Type</label>
        <select id="savingType" required>
          <option value="">Select Type</option>
          ${options.map((o) => `<option value="${o}">${o}</option>`).join("")}
          <option value="other">Other</option>
        </select>
        <input type="text" id="customSaving" placeholder="Enter new type" class="hidden">
        <button type="button" id="addSaving" class="hidden">Add Type</button>
      `;
      dynamicFields.appendChild(extraDiv);

      const select = document.getElementById("savingType");
      const input = document.getElementById("customSaving");
      const btn = document.getElementById("addSaving");

      select.addEventListener("change", () => {
        if (select.value === "other") {
          input.classList.remove("hidden");
          btn.classList.remove("hidden");
        } else {
          input.classList.add("hidden");
          btn.classList.add("hidden");
        }
      });

      btn.addEventListener("click", () => {
        const val = input.value.trim();
        if (!val) return alert("Enter type");
        if (options.includes(val)) return alert("Type exists");
        existingEntries.push({ type: val });
        localStorage.setItem(section, JSON.stringify(existingEntries));
        alert("Type added!");
        select.innerHTML = `<option value="">Select Type</option>${[
          ...options,
          val,
        ]
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("")}<option value="other">Other</option>`;
        select.value = val;
        input.value = "";
        input.classList.add("hidden");
        btn.classList.add("hidden");
      });
    }
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentSection) return alert("Select a section");

    const date = document.getElementById("date").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value;
    if (!date || !amount) return alert("Fill all fields");

    const entry = { id: Date.now(), date, amount, description };
    if (currentSection === "income")
      entry.source = document.getElementById("source").value;
    if (currentSection === "expenses")
      entry.category = document.getElementById("category").value;
    if (currentSection === "savings")
      entry.type = document.getElementById("savingType").value;

    const data = JSON.parse(localStorage.getItem(currentSection)) || [];
    data.push(entry);
    localStorage.setItem(currentSection, JSON.stringify(data));

    form.reset();
    dynamicFields.innerHTML = "";
    categoryType.value = "";
    loadRecentEntries();
  });

  // Load entries
  function loadRecentEntries() {
    recentEntries.innerHTML = "";
    if (!currentSection)
      return (recentEntries.innerHTML = "<p>Select a section</p>");

    const entries = JSON.parse(localStorage.getItem(currentSection)) || [];
    if (entries.length === 0)
      return (recentEntries.innerHTML = "<p>No entries</p>");

    entries
      .slice()
      .reverse()
      .slice(0, 10)
      .forEach((entry) => {
        const li = document.createElement("li");
        li.className =
          "p-3 mb-2 bg-white shadow flex justify-between items-start rounded";
        li.innerHTML = `
        <div>
          <div class="font-semibold">${
            entry.source || entry.category || entry.type
          }</div>
          <div class="text-sm text-gray-500">${entry.date}</div>
          ${
            entry.description
              ? `<div class="text-sm text-gray-600 mt-1">${entry.description}</div>`
              : ""
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="font-bold">₹${entry.amount.toFixed(2)}</span>
          <button class="deleteBtn bg-red-600 text-white px-2 py-1 rounded" data-id="${
            entry.id
          }"><i class="fas fa-trash"></i></button>
        </div>
      `;
        recentEntries.appendChild(li);
      });

    // Attach delete events
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const entryId = e.target.closest(".deleteBtn").dataset.id;
        deleteEntry(entryId);
      });
    });
  }

  // Delete entry function - FIXED VERSION
  function deleteEntry(entryId) {
    if (!currentSection) return alert("No section selected");

    if (!confirm("Are you sure you want to delete this entry?")) return;

    // Get entries for current section
    const entries = JSON.parse(localStorage.getItem(currentSection)) || [];

    // Filter out the entry to delete
    const updatedEntries = entries.filter(
      (entry) => entry.id !== Number(entryId)
    );

    // Update localStorage
    localStorage.setItem(currentSection, JSON.stringify(updatedEntries));

    // Reload recent entries
    loadRecentEntries();

    // Show success message
    showNotification("Entry deleted successfully!", "success");
  }

  // Notification function
  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === "success" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${
          type === "success" ? "check" : "info"
        }-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
});
