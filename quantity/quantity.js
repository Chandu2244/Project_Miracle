(function () {
  // Expose the init function to window
  async function initQuantityModule() {
    // ======================
    // DOM ELEMENTS (local to this init)
    // ======================
    const servingDate = document.getElementById("servingDate");
    const quantityContainer = document.getElementById("quantityContainer");
    const saveBtn = document.getElementById("saveBtn");
    const submitBtn = document.getElementById("submitBtn");
    const submissionMsg = document.getElementById("submissionMsg");
    const submissionErrMsg = document.getElementById("submissionErrMsg");
    const dateErrMsg = document.getElementById("dateErrMsg");
    const leftPage = document.getElementById("leftPage");
    const rightPage = document.getElementById("rightPage");
    const firstPage = document.getElementById("firstPage");
    const lastPage = document.getElementById("lastPage");
    const recordInfo = document.getElementById("recordInfo");
    const copyPrevCheckbox = document.getElementById("copyPreviousDay");

    if (!quantityContainer) {
      console.warn("quantityContainer not found in DOM. initQuantityModule aborted.");
      return;
    }

    // ======================
    // STATE VARIABLES (scoped)
    // ======================
    let quantityValues = [];
    let allCustomers = [];
    let currentPage = 1;
    let pageLimit = 30;
    let totalRecords = 0;
    let totalPages = 1;

    // ======================
    // API URLs
    // ======================
    const API_URL = "https://milk-billing-backend.onrender.com/customers/";
    const API_URL_2 = "https://milk-billing-backend.onrender.com/quantity/";


    // ======================
    // GENERIC API FUNCTION
    // ======================
    async function api(url, method = "GET", body = null) {
      const options = { method, headers: { "Content-Type": "application/json" } };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(url, options);
      return response.json().catch(() => response.text());
    }

    // ======================
    // LOAD CUSTOMERS (WITH PAGINATION)
    // ======================
    async function loadCustomers(page = currentPage) {
      currentPage = page;

      const count = await api(`${API_URL}count/`);
      totalRecords = count.total || 0;
      totalPages = Math.max(1, Math.ceil(totalRecords / pageLimit));

      allCustomers = await api(`${API_URL}?page=${currentPage}&limit=${pageLimit}`);

      renderCustomers();
      updatePaginationUI();
      updateRecordInfo();
    }

    // ======================
    // RENDER CUSTOMERS (ROWS)
    // ======================
    function renderCustomers() {
      quantityContainer.innerHTML = "";

      const start = (currentPage - 1) * pageLimit;

      (allCustomers || []).forEach((customer, index) => {
        quantityContainer.appendChild(createCustomerRow(customer, start + index));
      });
    }

    // ======================
    // CREATE CUSTOMER ROW
    // ======================
    function createCustomerRow(customer, index) {
      const row = document.createElement("tr");
      row.setAttribute("data-id", customer.id);

      // Serial Number
      const serialCell = document.createElement("td");
      serialCell.textContent = index + 1;
      row.appendChild(serialCell);

      // Name
      const nameCell = document.createElement("td");
      nameCell.textContent = customer.name;
      row.appendChild(nameCell);

      // Address
      const addressCell = document.createElement("td");
      addressCell.textContent = customer.address;
      row.appendChild(addressCell);

      // Quantity Input Column
      const quantityCell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";

      // Input validation
      input.addEventListener("keydown", (event) => {
        if (
          (event.key >= "0" && event.key <= "9" && input.value.length < 3) ||
          ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)
        ) {
          return;
        }
        event.preventDefault();
      });

      quantityCell.appendChild(input);
      row.appendChild(quantityCell);

      return row;
    }

    // ======================
    // VALIDATION FUNCTIONS
    // ======================
    function validateFields() {
      const dateValid = servingDate && servingDate.value !== "";
      const rows = quantityContainer.querySelectorAll("tr");

      let allFilled = [...rows].every(row => {
        const inp = row.querySelector("input");
        return inp && inp.value.trim() !== "";
      });

      if (dateErrMsg) dateErrMsg.textContent = dateValid ? "" : "Please fill the date";
      if (submissionErrMsg) submissionErrMsg.textContent = allFilled ? "" : "Please fill quantity!";

      return allFilled && dateValid;
    }

    function validateNumberInput(event) {
      const allowed =
        (event.key >= "0" && event.key <= "9") ||
        ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key);

      if (!allowed) event.preventDefault();
    }

    // ======================
    // SAVE QUANTITIES (PUT)
    // ======================
    async function addQuantityValues() {
      try {
        const response = await fetch(API_URL_2, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(quantityValues)
        });

        if (response.ok) {
          submissionMsg.textContent = "Quantities Submitted";

          setTimeout(() => {
            submissionMsg.textContent = "";
          }, 3000);
        }
        else {
          alert("Error caused while submitting");
          }
        } catch (error) {
          console.log(error);
        }
      }

    // ======================
    // COLLECT & SUBMIT DATA
    // ======================
    if (submitBtn) {
      submitBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        if (!validateFields()) return;

        quantityValues = [];
        const date = servingDate.value;
        const rows = quantityContainer.querySelectorAll("tr");

        rows.forEach(row => {
          const inputValue = row.querySelector("input").value.trim();
          quantityValues.push({
            customer_id: Number(row.dataset.id),
            date,
            quantity: Number(inputValue)
          });
        });

        await addQuantityValues();
      });
    }

    // ======================
    // AUTO-FILL QUANTITIES
    // ======================
    async function fetchQuantities(date) {
      const response = await fetch(`${API_URL_2}?date=${date}`);
      return response.json();
    }

    async function autoFillQuantities(date) {
      const saved = await fetchQuantities(date);

      const quantityMap = {};
      (saved || []).forEach(item => quantityMap[item.customer_id] = item.quantity);

      const rows = document.querySelectorAll("#quantityContainer tr");

      rows.forEach(row => {
        const input = row.querySelector("input");
        const id = Number(row.dataset.id);

        if (input) input.value = quantityMap[id] ?? "";
      });
    }

    if (servingDate) {
      servingDate.addEventListener("change", () => {
        autoFillQuantities(servingDate.value);
      });
    }

    async function autoFillPreviousDay() {
      const today = servingDate.value;
      if (!today) {
        alert("Please select a date first.");
        return;
      }

      // Get yesterday's date
      const dateObj = new Date(today);
      dateObj.setDate(dateObj.getDate() - 1);

      const prevDate = dateObj.toISOString().split("T")[0];

      // Fetch yesterday’s saved quantities
      const savedData = await fetchQuantities(prevDate);

      const quantityMap = {};
      (savedData || []).forEach(item => {
        quantityMap[item.customer_id] = item.quantity;
      });

      // Fill inputs
      const rows = document.querySelectorAll("#quantityContainer tr");

      rows.forEach(row => {
        const customerId = Number(row.dataset.id);
        const input = row.querySelector("input");

        if (input) {
          if (quantityMap[customerId] !== undefined) {
            input.value = quantityMap[customerId];
          } else {
            input.value = "";
          }
        }
      });
    }

    if (copyPrevCheckbox) {
      copyPrevCheckbox.addEventListener("change", function () {
        if (this.checked) {
          autoFillPreviousDay();
        } else {
          clearAllQuantities();
        }
      });
    }

    function clearAllQuantities() {
      const rows = document.querySelectorAll("#quantityContainer tr");

      rows.forEach(row => {
        const input = row.querySelector("input");
        if (input) input.value = "";
      });
    }

    // ======================
    // PAGINATION UI
    // ======================
    function updatePaginationUI() {
      const pageInfoEl = document.querySelector(".page-info");
      if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;

      if (leftPage && firstPage) leftPage.disabled = firstPage.disabled = currentPage === 1;
      if (rightPage && lastPage) rightPage.disabled = lastPage.disabled = currentPage === totalPages;
    }

    function updateRecordInfo() {
      const start = (currentPage - 1) * pageLimit + 1;
      const end = Math.min(currentPage * pageLimit, totalRecords);
      if (recordInfo) recordInfo.textContent = `${start} - ${end} of ${totalRecords}`;
    }

    if (rightPage) rightPage.onclick = () => currentPage < totalPages && loadCustomers(currentPage + 1);
    if (leftPage) leftPage.onclick = () => currentPage > 1 && loadCustomers(currentPage - 1);
    if (firstPage) firstPage.onclick = () => loadCustomers(1);
    if (lastPage) lastPage.onclick = () => loadCustomers(totalPages);

    // ======================
    // INITIAL LOAD
    // ======================
    await loadCustomers(currentPage);
  }

  // Attached to window so index.js can call it after injecting HTML
  window.initQuantityModule = initQuantityModule;
})();
