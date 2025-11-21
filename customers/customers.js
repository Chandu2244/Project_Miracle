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
const deleteIconContainer = document.getElementById("deleteIconContainer");
const selectAllCheckbox = document.getElementById("selectAll");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const firstPage = document.getElementById("firstPage");
const lastPage = document.getElementById("lastPage");
const recordInfo = document.getElementById("recordInfo");


// ======================
// GLOBAL VARIABLES
// ======================
const API_URL = "http://localhost:3000/customers/";
let formData = { gender: "" };
let allCustomers = [];
let currentPage = 1;
let pageLimit = 30;
let totalRecords = 0;
let totalPages = 1;


// ======================
// REUSABLE API HANDLER
// ======================
async function api(url, method = "GET", body = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  return response.json().catch(() => response.text());
}


// ======================
// VALIDATION
// ======================
const fields = [
  { input: firstName, error: firstNameErrMsg },
  { input: lastName, error: lastNameErrMsg },
  { input: address, error: addressErrMsg },
  { input: contact, error: contactErrMsg },
];

function validateRequired(input, errorEl) {
  errorEl.textContent = input.value.trim() ? "" : "Required*";
}

fields.forEach(({ input, error }) => {
  input.addEventListener("blur", () => validateRequired(input, error));
});

contact.addEventListener("blur", () => {
  contactErrMsg.textContent =
    /^\d{10}$/.test(contact.value) ? "" : "*Enter 10 digits";
});

contact.addEventListener("keydown", (e) => {
  if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
    e.preventDefault();
  }
});

[genderMale, genderFemale].forEach((g) =>
  g.addEventListener("change", (e) => (formData.gender = e.target.value))
);


// ======================
// FORM SUBMISSION
// ======================
addCustomerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const allFilled = fields.every((f) => f.input.value.trim() !== "");
  const validContact = /^\d{10}$/.test(contact.value);
  const genderSelected = formData.gender !== "";

  if (!allFilled || !validContact || !genderSelected) {
    fieldsErrorMsg.textContent = "Please fill required details!";
    return;
  }

  fields.forEach(({ input }) => (formData[input.id] = input.value.trim()));

  const message = await api(API_URL, "POST", formData);
  serverResponse.textContent = message;

  addCustomerForm.reset();
  formData = { gender: "" };

  await loadCustomers();
});


// ======================
// CRUD OPERATIONS
// ======================
async function loadCustomers(page = currentPage) {
  currentPage = page;
  const count = await api(`${API_URL}count/`);
  totalRecords = count.total;
  totalPages = Math.ceil(totalRecords / pageLimit);

  allCustomers = await api(`${API_URL}?page=${currentPage}&limit=${pageLimit}`);
  renderTable();
  updatePaginationUI();
  updateRecordInfo();
}

async function deleteCustomers(ids) {
  await api(`${API_URL}delete/`, "POST", { ids });
  await loadCustomers();
}

async function updateCustomer(id, updated) {
  await api(`${API_URL}${id}`, "PUT", updated);
  await loadCustomers();
}


// ======================
// RENDER TABLE
// ======================
function renderTable() {
  customersContainer.innerHTML = "";
  const start = (currentPage - 1) * pageLimit;

  allCustomers.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="rowCheck" data-id="${c.id}" /></td>
      <td>${start + i + 1}</td>
      <td>${c.name}</td>
      <td>${c.contact}</td>
      <td>${c.address}</td>
      <td>${c.gender}</td>
      <td><i class="fa-regular fa-pen-to-square edit-btn"></i></td>
    `;
    customersContainer.appendChild(tr);

    tr.querySelector(".rowCheck").addEventListener("change", toggleDeleteIcon);
    tr.querySelector(".edit-btn").addEventListener("click", () => enableEdit(tr, c));
  });
}


// ======================
// EDIT ROW
// ======================
function enableEdit(row, customer) {
  const cells = row.querySelectorAll("td");
  const id = customer.id;

  cells[2].innerHTML = `<input value="${customer.name}">`;
  cells[3].innerHTML = `<input value="${customer.contact}">`;
  cells[4].innerHTML = `<input value="${customer.address}">`;
  cells[5].innerHTML = `
    <select>
      <option value="M" ${customer.gender === "M" ? "selected" : ""}>M</option>
      <option value="F" ${customer.gender === "F" ? "selected" : ""}>F</option>
    </select>
  `;

  const saveIcon = document.createElement("i");
  saveIcon.classList.add("fa-solid", "fa-check", "save-icon");
  cells[6].innerHTML = "";
  cells[6].appendChild(saveIcon);

  saveIcon.addEventListener("click", async () => {
    const updated = {
      name: cells[2].querySelector("input").value.trim(),
      contact: cells[3].querySelector("input").value.trim(),
      address: cells[4].querySelector("input").value.trim(),
      gender: cells[5].querySelector("select").value
    };
    

    if (!updated.name || !updated.address || !/^\d{10}$/.test(updated.contact)) {
      alert("Please correct the data!");
      return;
    }
    cells[2].textContent = updated.name;
    cells[3].textContent = updated.contact;
    cells[4].textContent = updated.address;
    cells[5].textContent = updated.gender;
    cells[6].innerHTML = `<i class="fa-regular fa-pen-to-square edit-btn"></i>`;

    // Re-enable edit button
    updated.id = customer.id;
    cells[6].querySelector(".edit-btn").addEventListener("click", () => enableEdit(row, updated));
    await updateCustomer(id, updated);
    
  });
}


// ======================
// BULK DELETE
// ======================
const deleteIcon = document.createElement("i");
deleteIcon.classList.add("fa-solid", "fa-trash", "delete-icon", "d-none");
deleteIconContainer.appendChild(deleteIcon);

selectAllCheckbox.addEventListener("change", () => {
  document.querySelectorAll(".rowCheck").forEach(cb => cb.checked = selectAllCheckbox.checked);
  toggleDeleteIcon();
});

deleteIcon.addEventListener("click", async () => {
  const ids = [...document.querySelectorAll(".rowCheck:checked")].map(cb => cb.dataset.id);
  if (ids.length && confirm("Delete selected customers?")) {
    await deleteCustomers(ids);
  }
});

function toggleDeleteIcon() {
  const anyChecked = document.querySelectorAll(".rowCheck:checked").length > 0;
  deleteIcon.classList.toggle("d-none", !anyChecked);
}


// ======================
// PAGINATION
// ======================
function updatePaginationUI() {
  document.querySelector(".page-info").textContent = `Page ${currentPage} of ${totalPages}`;
  leftPage.disabled = firstPage.disabled = currentPage === 1;
  rightPage.disabled = lastPage.disabled = currentPage === totalPages;
}

function updateRecordInfo() {
  const start = (currentPage - 1) * pageLimit + 1;
  const end = Math.min(currentPage * pageLimit, totalRecords);
  recordInfo.textContent = `${start} - ${end} of ${totalRecords}`;
}

rightPage.onclick = () => currentPage < totalPages && loadCustomers(currentPage + 1);
leftPage.onclick = () => currentPage > 1 && loadCustomers(currentPage - 1);
firstPage.onclick = () => loadCustomers(1);
lastPage.onclick = () => loadCustomers(totalPages);


// ======================
// INITIAL LOAD
// ======================
loadCustomers();
