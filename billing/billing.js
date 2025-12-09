(function () {
  async function initBillingModule() {
    // DOM
    const dropdown = document.getElementById("customerSelect");
    const generateBillBtn = document.getElementById("generateBillBtn");
    const selectCustomer = document.getElementById("customerSelect");
    const selectMonth = document.getElementById("monthSelect");
    const costPerLitre = document.getElementById("costPerLitre");
    const tableBody = document.getElementById("billTableBody");
    const billTotals = document.getElementById("billTotals");

    //API
    const API_URL="http://13.201.100.90:3000/"

    if (!generateBillBtn) {
      console.warn("generateBillBtn not found. initBillingModule aborted.");
      return;
    }

    // API
    async function api(url, method = "GET", body = null) {
      const options = {
        method,
        headers: { "Content-Type": "application/json" }
      };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(url, options);
      return response.json().catch(() => response.text());
    }

    // Populates customers if dropdown exists
    async function populateCustomerDropdown() {
      try {
        if (!dropdown) return;

        const customers = await api(`${API_URL}customers/?page=1&limit=200`);
        dropdown.innerHTML = `<option value="">-- Select Customer --</option>`;

        (customers || []).forEach(customer => {
          const option = document.createElement("option");
          option.value = customer.id;
          option.textContent = customer.name;
          dropdown.appendChild(option);
        });
      } catch (error) {
        console.log("Error loading customer dropdown:", error);
      }
    }

    function renderBillTable(data) {
      if (!tableBody || !billTotals) return;
      tableBody.innerHTML = "";

      let totalQuantity = 0;
      let totalPrice = 0;

      (data || []).forEach((entry, index) => {
        totalQuantity += Number(entry.quantity);
        totalPrice += Number(entry.price);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.date}</td>
          <td>${entry.quantity}</td>
          <td>${entry.price}</td>
        `;
        tableBody.appendChild(tr);
      });

      billTotals.innerHTML = `
        <div>Total Quantity: ${totalQuantity} L</div>
        <div>Total Price: ₹${totalPrice}</div>
      `;
    }

    
    generateBillBtn.addEventListener("click", async () => {
      const customerId = selectCustomer ? selectCustomer.value : "";
      const month = selectMonth ? selectMonth.value : "";
      const cost = Number(costPerLitre ? costPerLitre.value : 0);

      if (!customerId || !month || !cost) {
        alert("Please fill all fields");
        return;
      }

      const billData = await api(
        `${API_URL}billing/?customer_id=${customerId}&month=${month}&cost=${cost}`
      );

      renderBillTable(billData);
    });

    // initial populate
    await populateCustomerDropdown();
  }

  window.initBillingModule = initBillingModule;
})();
