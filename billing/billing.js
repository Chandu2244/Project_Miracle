const dropdown = document.getElementById("customerSelect");
const generateBillBtn=document.getElementById("generateBillBtn")
const selectCustomer=document.getElementById("customerSelect");
const selectMonth=document.getElementById("monthSelect");
const costPerLitre=document.getElementById("costPerLitre")
const tableBody = document.getElementById("billTableBody");
const billTotals = document.getElementById("billTotals");

async function api(url, method = "GET", body = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  return response.json().catch(() => response.text());
}



async function populateCustomerDropdown() {

  try {
    // Fetch all customers (you can reduce limit if needed)
    const customers = await api("http://localhost:3000/customers/?page=1&limit=60");

    // Clear previous options
    dropdown.innerHTML = `<option value="">-- Select Customer --</option>`;

    customers.forEach(customer => {
      const option = document.createElement("option");
      option.value = customer.id;         // customer id
      option.textContent = customer.name; // customer name
      dropdown.appendChild(option);
    });

  } catch (error) {
    console.log("Error loading customer dropdown:", error);
  }
}

// Load dropdown when page loads
populateCustomerDropdown();

function renderBillTable(data) {
  tableBody.innerHTML = "";

  let totalQuantity = 0;
  let totalPrice = 0;

  data.forEach((entry, index) => {
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

  // Render totals below table
  billTotals.innerHTML = `
      <div>Total Quantity: ${totalQuantity} L</div>
      <div>Total Price: ₹${totalPrice}</div>`;
}


generateBillBtn.addEventListener("click", async () => {
    const customerId = selectCustomer.value;
    const month = selectMonth.value;
    const cost = Number(costPerLitre.value);

    if (!customerId || !month || !cost) {
        alert("Please fill all fields");
        return;
    }

    // Call backend API to get quantity list for this customer & month
    const billData = await api(`http://localhost:3000/billing/?customer_id=${customerId}&month=${month}&cost=${cost}`);

    //CALL THE FUNCTION HERE
    renderBillTable(billData);
});

