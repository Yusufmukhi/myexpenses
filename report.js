// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- Sidebar toggle ----------------
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

// ---------------- Load Data from Firestore ----------------
async function getCategoryData(
  collectionName,
  labelField = "source",
  amountField = "amount"
) {
  const snapshot = await getDocs(collection(db, collectionName));
  const dataMap = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const label = data[labelField] || "Other";
    const amount = Number(data[amountField]) || 0;
    dataMap[label] = (dataMap[label] || 0) + amount;
  });

  return {
    labels: Object.keys(dataMap),
    values: Object.values(dataMap),
  };
}

let dataSets = {};

// ---------------- Chart Setup ----------------
const ctx = document.getElementById("chartCanvas").getContext("2d");
let chart;

function loadChart(type) {
  const dataset = dataSets[type];
  if (!dataset) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: dataset.labels,
      datasets: [
        {
          data: dataset.values,
          backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });

  const legend = document.getElementById("chartLegend");
  legend.innerHTML = dataset.labels
    .map(
      (label, i) => `
      <div class="flex justify-between items-center mb-2">
        <span class="flex items-center">
          <span class="w-3 h-3 mr-2 inline-block rounded" 
            style="background-color:${chart.data.datasets[0].backgroundColor[i]}"></span>
          ${label}
        </span>
        <span class="font-semibold">₹${dataset.values[i]}</span>
      </div>`
    )
    .join("");
}

// ---------------- Init ----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  // Fetch all categories
  dataSets["income"] = await getCategoryData("incomes", "source", "amount");
  dataSets["expenses"] = await getCategoryData(
    "expenses",
    "category",
    "amount"
  );
  dataSets["savings"] = await getCategoryData("savings", "type", "amount");
  dataSets["transactions"] = await getCategoryData(
    "transactions",
    "method",
    "amount"
  );

  // Default chart
  loadChart("income");
});

// Dropdown listener
document.getElementById("reportType").addEventListener("change", (e) => {
  loadChart(e.target.value);
});

// Card click listener
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => {
    const type = card.getAttribute("data-type");
    document.getElementById("reportType").value = type;
    loadChart(type);
  });
});
