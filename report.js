document.addEventListener("DOMContentLoaded", () => {
  const reportFilter = document.getElementById("reportFilter");
  const typeFilter = document.getElementById("typeFilter");
  const reportTable = document.getElementById("reportTable");

  let lineChart, pieChart;

  function fetchEntries(type) {
    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    const incomes = JSON.parse(localStorage.getItem("incomes")) || [];
    if (type === "expenses") return expenses;
    if (type === "incomes") return incomes;
    return [...expenses, ...incomes];
  }

  function groupEntries(entries, by = "day") {
    const grouped = {};
    entries.forEach((e) => {
      const date = new Date(e.date);
      let key;
      if (by === "day") key = date.toISOString().split("T")[0];
      else if (by === "month")
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      else if (by === "year") key = `${date.getFullYear()}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return grouped;
  }

  function updateTable(entries) {
    reportTable.innerHTML = "";
    if (entries.length === 0) {
      reportTable.innerHTML =
        '<tr><td colspan="4" class="text-center text-gray-500 py-2">No entries found</td></tr>';
      return;
    }

    entries
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((e) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-4 py-2">${e.date}</td>
          <td class="px-4 py-2">${e.category || e.source || ""}</td>
          <td class="px-4 py-2">₹${parseFloat(e.amount).toFixed(2)}</td>
          <td class="px-4 py-2">${e.description || ""}</td>
        `;
        reportTable.appendChild(tr);
      });
  }

  function updateCharts(entries) {
    const grouped = groupEntries(entries, reportFilter.value);
    const labels = Object.keys(grouped).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const totals = labels.map((l) =>
      grouped[l].reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    );

    // Line chart (total by date)
    if (lineChart) lineChart.destroy();
    const ctxLine = document.getElementById("lineChart").getContext("2d");
    lineChart = new Chart(ctxLine, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Total Amount",
            data: totals,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246,0.2)",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    // Pie chart (category distribution)
    const categories = {};
    entries.forEach((e) => {
      const cat = e.category || e.source || "Other";
      categories[cat] = (categories[cat] || 0) + parseFloat(e.amount || 0);
    });

    if (pieChart) pieChart.destroy();
    const ctxPie = document.getElementById("pieChart").getContext("2d");
    pieChart = new Chart(ctxPie, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              "#3b82f6",
              "#ef4444",
              "#facc15",
              "#10b981",
              "#8b5cf6",
              "#f97316",
              "#6366f1",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  function renderReport() {
    const type = typeFilter.value;
    const entries = fetchEntries(type);
    updateTable(entries);
    updateCharts(entries);
  }

  typeFilter.addEventListener("change", renderReport);
  reportFilter.addEventListener("change", renderReport);

  // Initial render
  renderReport();
});
