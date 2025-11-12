// ======================
// DOM ELEMENTS
// ======================
const firstName = document.getElementById("firstName");
const firstNameErrMsg = document.getElementById("firstNameErrMsg");
const lastName = document.getElementById("lastName");
const lastNameErrMsg = document.getElementById("lastNameErrMsg");
const address = document.getElementById("address");
const addressErrMsg = document.getElementById("addressErrMsg");
const contact = document.getElementById("contact");
const contactErrMsg = document.getElementById("contactErrMsg");
const genderMale = document.getElementById("genderMale");
const genderFemale = document.getElementById("genderFemale");
const serverResponse = document.getElementById("serverResponse");
const addCustomerForm = document.getElementById("addCustomerForm");
const fieldsErrorMsg = document.getElementById("fieldsErrorMsg");
const customersContainer = document.getElementById("customersContainer");
const modal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

// ======================
// GLOBAL VARIABLES
// ======================
let formData = { gender: "" };
let allCustomers = [];
const API_URL = "http://localhost:3000/customers/";

// ======================
// FIELD VALIDATION
// ======================
const fields = [
  { input: firstName, error: firstNameErrMsg },
  { input: lastName, error: lastNameErrMsg },
  { input: address, error: addressErrMsg },
  { input: contact, error: contactErrMsg },
];

// validate empty fields
function validateRequiredFields(input, error) {
  error.textContent = input.value.trim() === "" ? "Required*" : "";
}

// only numbers for contact
function contactValidation(event) {
  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
  if (!(/[0-9]/.test(event.key) || allowedKeys.includes(event.key))) {
    event.preventDefault();
  }
}

// attach field event listeners
fields.forEach(({ input, error }) => {
  input.addEventListener("blur", () => validateRequiredFields(input, error));
});
contact.addEventListener("blur", () => {
  contactErrMsg.textContent =
    contact.value && contact.value.length !== 10 ? "*Enter 10 digits" : "";
});
contact.addEventListener("keydown", contactValidation);
[genderMale, genderFemale].forEach((g) =>
  g.addEventListener("change", (e) => (formData.gender = e.target.value))
);

// ======================
// FORM SUBMISSION
// ======================
addCustomerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (validateForm()) {
    collectFormData();
    await submitCustomer({ ...formData });
    addCustomerForm.reset();
    formData = { gender: "" };
  } else {
    fieldsErrorMsg.textContent = "Please fill required details!";
  }
});

function validateForm() {
  const allFilled = fields.every((f) => f.input.value.trim() !== "");
  const validContact = contact.value.length === 10;
  const genderSelected = formData.gender !== "";
  return allFilled && validContact && genderSelected;
}

function collectFormData() {
  fields.forEach(({ input }) => (formData[input.id] = input.value.trim()));
}

// ======================
// API FUNCTIONS
// ======================
async function submitCustomer(customer) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    serverResponse.textContent = await res.text();
    await fetchCustomers();
  } catch (err) {
    alert("Error adding customer!");
    console.error(err);
  }
}

async function fetchCustomers() {
  try {
    const res = await fetch(API_URL);
    allCustomers = await res.json();
    renderCustomers(allCustomers);
  } catch (err) {
    console.error("Error fetching customers:", err);
  }
}

async function deleteCustomer(id) {
  try {
    const res = await fetch(`${API_URL}${id}`, { method: "DELETE" });
    alert(await res.text());
    await fetchCustomers();
  } catch (err) {
    alert("Error deleting customer!");
    console.error(err);
  }
}

async function updateCustomer(id, updatedCustomer) {
  try {
    await fetch(`${API_URL}${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCustomer),
    });
    await fetchCustomers();
  } catch (err) {
    alert("Error updating customer!");
    console.error(err);
  }
}

// ======================
// RENDERING FUNCTIONS
// ======================
function renderCustomers(list) {
  customersContainer.innerHTML = "";
  list.forEach((cust, i) => customersContainer.appendChild(createCustomerRow(cust, i)));
}

function createCustomerRow(customer, index) {
  const row = document.createElement("tr");
  row.dataset.id = customer.id;

  // serial number
  const serial = document.createElement("td");
  serial.textContent = index + 1;
  row.appendChild(serial);

  // main cells
  ["name", "contact", "address", "gender"].forEach((key) => {
    const td = document.createElement("td");
    td.textContent = customer[key];
    row.appendChild(td);
  });

  // edit + delete icons
  const actions = document.createElement("td");
  const editIcon = document.createElement("i");
  const deleteIcon = document.createElement("i");
  editIcon.classList.add("fa-regular", "fa-pen-to-square");
  deleteIcon.classList.add("fa-solid", "fa-trash", "delete-icon");
  actions.append(editIcon);
  row.appendChild(actions);

  // ----------- EDIT HANDLER -----------
  editIcon.addEventListener("click", () => enableEditMode(row, customer, actions));

  // ----------- DELETE HANDLER -----------
  deleteIcon.addEventListener("click", () => {
    modal.style.display = "flex";
    confirmYes.onclick = async () => {
      modal.style.display = "none";
      await deleteCustomer(customer.id);
    };
    confirmNo.onclick = () => (modal.style.display = "none");
  });
  actions.append(deleteIcon);

  return row;
}

// ======================
// EDIT MODE HANDLER
// ======================
function enableEditMode(row, customer, actionsCell) {
  actionsCell.innerHTML = "";
  const saveIcon = document.createElement("i");
  saveIcon.classList.add("fa-solid", "fa-check", "save-icon");
  actionsCell.appendChild(saveIcon);

  // make cells editable
  const cells = row.querySelectorAll("td");
  const editableIndexes = [1, 2, 3]; // name, contact, address
  editableIndexes.forEach((i) => {
    const cell = cells[i];
    const input = document.createElement("input");
    input.value = cell.textContent;
    cell.textContent = "";
    cell.appendChild(input);
  });

  // gender select
  const genderCell = cells[4];
  genderCell.textContent = "";
  const select = document.createElement("select");
  ["M", "F"].forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    if (customer.gender === val) opt.selected = true;
    select.appendChild(opt);
  });
  genderCell.appendChild(select);

  // save handler
  saveIcon.addEventListener("click", async () => {
    const inputs = row.querySelectorAll("input");
    const [name, contact, address] = Array.from(inputs).map((i) => i.value.trim());
    if (name && address && contact.length === 10) {
      const updated = { name, contact, address, gender: select.value };
      await updateCustomer(customer.id, updated);
    } else {
      alert("Please correct the data!");
    }
  });
}

// ======================
// INITIAL LOAD
// ======================
fetchCustomers();
