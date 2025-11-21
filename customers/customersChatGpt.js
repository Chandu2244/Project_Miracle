/****************************
 * DOM ELEMENTS
 ****************************/
const elements = {
  firstName: document.getElementById("firstName"),
  firstNameErrMsg: document.getElementById("firstNameErrMsg"),
  lastName: document.getElementById("lastName"),
  lastNameErrMsg: document.getElementById("lastNameErrMsg"),
  address: document.getElementById("address"),
  addressErrMsg: document.getElementById("addressErrMsg"),
  contact: document.getElementById("contact"),
  contactErrMsg: document.getElementById("contactErrMsg"),
  genderMale: document.getElementById("genderMale"),
  genderFemale: document.getElementById("genderFemale"),
  serverResponse: document.getElementById("serverResponse"),
  fieldsErrorMsg: document.getElementById("fieldsErrorMsg"),
  addCustomerForm: document.getElementById("addCustomerForm"),
  customersContainer: document.getElementById("customersContainer"),
  deleteIcon: document.getElementById("deleteIconContainer"),
  selectAll: document.getElementById("selectAll"),
  leftPage: document.getElementById("leftPage"),
  rightPage: document.getElementById("rightPage"),
  firstPage: document.getElementById("firstPage"),
  lastPage: document.getElementById("lastPage"),
  recordInfo: document.getElementById("recordInfo"),
  pageInfo: document.querySelector(".page-info")
};


/****************************
 * GLOBAL STATE
 ****************************/
let formData = { gender: "" };
let customers = [];
let currentPage = 1;
let pageLimit = 4;
let totalRecords = 0;
let totalPages = 1;

const API = {
  base: "http://localhost:3000/customers/",
  count: "http://localhost:3000/customers/count/"
};


/****************************
 * GENERIC API REQUEST
 ****************************/
async function apiRequest(url, method = "GET", body = null) {
  try {
    const options = { method, headers: { "Content-Type": "application/json" }};
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    return res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : await res.text();
  } catch (err) {
    console.error(err);
    alert("Server error occurred.");
  }
}


/****************************
 * VALIDATION
 ****************************/
function validateRequired() {
  const fields = [
    { el: elements.firstName, msg: elements.firstNameErrMsg },
    { el: elements.lastName, msg: elements.lastNameErrMsg },
    { el: elements.address, msg: elements.addressErrMsg },
    { el: elements.contact, msg: elements.contactErrMsg }
  ];

  let valid = true;
  fields.forEach(f => {
    if (f.el.value.trim() === "") {
      f.msg.textContent = "Required*";
      valid = false;
    } else {
      f.msg.textContent = "";
    }
  });

  if (elements.contact.value && elements.contact.value.length !== 10) {
    elements.contactErrMsg.textContent = "*Enter 10 digits";
    valid = false;
  }

  if (!formData.gender) valid = false;

  return valid;
}


/****************************
 * FORM SUBMISSION
 ****************************/
elements.addCustomerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateRequired()) {
    elements.fieldsErrorMsg.textContent = "Please fill required details!";
    return;
  }

  const body = {
    firstName: elements.firstName.value.trim(),
    lastName: elements.lastName.value.trim(),
    address: elements.address.value.trim(),
    contact: elements.contact.value.trim(),
    gender: formData.gender
  };

  await apiRequest(API.base, "POST", body);
  await loadCustomers();
  elements.addCustomerForm.reset();
  formData.gender = "";
});


/****************************
 * LOAD CUSTOMERS
 ****************************/
async function loadCustomers(page = currentPage) {
  currentPage = page;
  const url = `${API.base}?page=${currentPage}&limit=${pageLimit}`;
  customers = await apiRequest(url);
  renderCustomers();
  updatePaginationUI();
  updateRecordInfo();
}


/****************************
 * RENDER CUSTOMERS TABLE
 ****************************/
function renderCustomers() {
  elements.customersContainer.innerHTML = "";
  const start = (currentPage - 1) * pageLimit + 1;

  customers.forEach((customer, index) => {
    const row = document.createElement("tr");
    row.dataset.id = customer.id;

    // Checkbox
    const selectTd = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = customer.id;
    chk.addEventListener("change", updateDeleteIconVisibility);
    selectTd.appendChild(chk);
    row.appendChild(selectTd);

    // Serial number
    const serialTd = document.createElement("td");
    serialTd.textContent = start + index;
    row.appendChild(serialTd);

    // Fields
    ["name", "contact", "address", "gender"].forEach(key => {
      const cell = document.createElement("td");
      cell.textContent = customer[key] ?? "";
      row.appendChild(cell);
    });

    elements.customersContainer.appendChild(row);
  });
}


/****************************
 * DELETE MULTIPLE
 ****************************/
elements.deleteIcon.addEventListener("click", async () => {
  const checked = [...document.querySelectorAll("tbody input[type='checkbox']:checked")];
  if (checked.length === 0) return alert("No customers selected!");

  const ids = checked.map(c => Number(c.value));
  await apiRequest(API.base + "delete/", "POST", { ids });
  await loadCustomers();
});


function updateDeleteIconVisibility() {
  const anyChecked = document.querySelectorAll("tbody input[type='checkbox']:checked").length > 0;
  elements.deleteIcon.classList.toggle("d-none", !anyChecked);
}


/****************************
 * SELECT ALL
 ****************************/
elements.selectAll.addEventListener("change", () => {
  document.querySelectorAll("tbody input[type='checkbox']").forEach(cb => {
    cb.checked = elements.selectAll.checked;
  });
  updateDeleteIconVisibility();
});


/****************************
 * PAGINATION
 ****************************/
function updatePaginationUI() {
  elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  elements.leftPage.disabled = currentPage === 1;
  elements.firstPage.disabled = currentPage === 1;
  elements.rightPage.disabled = currentPage === totalPages;
  elements.lastPage.disabled = currentPage === totalPages;
}

function updateRecordInfo() {
  const start = (currentPage - 1) * pageLimit + 1;
  const end = Math.min(currentPage * pageLimit, totalRecords);
  elements.recordInfo.textContent = `${start}-${end} of ${totalRecords}`;
}

elements.rightPage.onclick = () => currentPage < totalPages && loadCustomers(currentPage + 1);
elements.leftPage.onclick = () => currentPage > 1 && loadCustomers(currentPage - 1);
elements.firstPage.onclick = () => loadCustomers(1);
elements.lastPage.onclick = () => loadCustomers(totalPages);


/****************************
 * INITIAL LOADING
 ****************************/
(async function init() {
  const countRes = await apiRequest(API.count);
  totalRecords = countRes.total;
  totalPages = Math.ceil(totalRecords / pageLimit);
  await loadCustomers();
})();
