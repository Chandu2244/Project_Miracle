// ======================
// DOM ELEMENTS
// ======================
let firstName = document.getElementById("firstName");
let firstNameErrMsg = document.getElementById("firstNameErrMsg");
let lastName = document.getElementById("lastName");
let lastNameErrMsg = document.getElementById("lastNameErrMsg");
let address=document.getElementById("address");
let addressErrMsg = document.getElementById("addressErrMsg");
let contact = document.getElementById("contact");
let contactErrMsg = document.getElementById("contactErrMsg");
let genderMale = document.getElementById("genderMale");
let genderFemale = document.getElementById("genderFemale");
let serverResponse=document.getElementById("serverResponse");
let addCustomerForm=document.getElementById("addCustomerForm");
let fieldsErrorMsg=document.getElementById("fieldsErrorMsg");
let submitBtn = document.getElementById("submitBtn");
let customersContainer=document.getElementById("customersContainer");
const modal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const deleteIconContainer=document.getElementById("deleteIconContainer");
const selectAllCheckbox=document.getElementById("selectAll");
const leftPage=document.getElementById("leftPage")
const rightPage=document.getElementById("rightPage")
const firstPage=document.getElementById("firstPage")
const lastPage=document.getElementById("lastPage")
const recordInfo=document.getElementById("recordInfo")


// ======================
// GLOBAL VARIABLES
// ======================
let formData={gender:""};
let allCustomers=[];
const API_URL = "http://localhost:3000/customers/";
let currentPage=1;
let pageLimit=4;
let totalRecords;
let totalPages;



// ======================
// FIELD VALIDATION
// ======================
const fields =[
    {input:firstName,error:firstNameErrMsg},
    {input:lastName,error:lastNameErrMsg},
    {input:address,error:addressErrMsg},
    {input:contact,error:contactErrMsg}
]

function validateRequiredFields(inputElement, errorElement) {
  errorElement.textContent = inputElement.value.trim() === "" ? "Required*" : "";
}

fields.forEach(field=>{
    field.input.addEventListener("blur",()=>{
        validateRequiredFields(field.input,field.error)
    });
});

contact.addEventListener("blur", () => {
  if (contact.value && contact.value.length !== 10) {
    contactErrMsg.textContent = "*Enter 10 digits";
  } else {
    contactErrMsg.textContent = "";
  }
});

contact.addEventListener('keydown',contactValidation);


function contactValidation(event){
  // Allow only digits 0–9, Backspace, Delete, Arrow keys, and Tab
  if (
    (event.key >= '0' && event.key <= '9') || 
    event.key === 'Backspace' ||
    event.key === 'Delete' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight' ||
    event.key === 'Tab'
  ) {
    return; // allow these keys
  } else {
    event.preventDefault(); // block all others
  }
}

// Gender selection
[genderMale, genderFemale].forEach((input) => {
  input.addEventListener("change", (e) => (formData.gender = e.target.value));
});


// ======================
// FORM SUBMISSION
// ======================

addCustomerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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
  const allFilled = fields.every(f => f.input.value.trim() !== "");
  const validContact = contact.value.length === 10;
  const genderSelected = formData.gender !== "";
  fieldsErrorMsg.textContent = "";
  return allFilled && validContact && genderSelected;
}

function collectFormData() {
  fields.forEach(({ input }) => {
    formData[input.id] = input.value.trim();
  });
}

// ======================
// DATABASE OPERATIONS
// ======================

async function submitCustomer(customer) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" ,
        "Accept":"application/json"
      },
      body: JSON.stringify(customer)
    });
    const message = await response.text();
    serverResponse.textContent = message;
    await fetchCustomers()// refresh table after successful POST
  } catch (error) {
    console.log("Error adding customer:", error);
    
  }
}

async function fetchCustomers(currentPage=1,limit=pageLimit) {
  try {
    const response = await fetch(`http://localhost:3000/customers/?page=${currentPage}&limit=${limit}`);
    allCustomers = await response.json();
    renderCustomers(allCustomers);
    updatePaginationUI();
    updateRecordInfo(currentPage, limit, totalRecords);
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

function updatePaginationUI() {
  document.querySelector(".page-info").textContent =
    `Page ${currentPage} of ${totalPages}`;

  leftPage.disabled = currentPage === 1;
  firstPage.disabled = currentPage === 1;

  rightPage.disabled = currentPage === totalPages;
  lastPage.disabled = currentPage === totalPages;
}

function updateRecordInfo(currentPage, limit, totalRecords) {
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalRecords);
  recordInfo.textContent =
    `${start} - ${end} of ${totalRecords}`;
}


async function deleteCustomers(ids) {
  try{
    const response = await fetch(`http://localhost:3000/customers/delete/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" ,
        "Accept":"application/json"
      },
    body:JSON.stringify({ids})
    });
    alert(await response.text());
    await fetchCustomers(); // refresh table
  }catch(error){
    console.log("Error deleting customer:", error)
    alert('Error occured deleteing customer!')
  }
}


async function updateCustomer(id,updatedCustomer){
  try{
    const response = await fetch(`http://localhost:3000/customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept":"application/json"
    },
    body: JSON.stringify(updatedCustomer),
    });
    await fetchCustomers();
  }catch(error){
    console.log("Error Updating Cutomer:",error)
    alert('Error occured while updating customer')
  }
}






// ======================
// RENDERING FUNCTIONS
// ======================

function renderCustomers(customersList) {
  customersContainer.innerHTML = "";
  const start = (currentPage - 1) * pageLimit + 1;
  customersList.forEach((customer, index) => {
    const serialNumber = start + index - 1;
    customersContainer.appendChild(createCustomerRow(customer, serialNumber));
  });
}


//DELETE ICON

const deleteIcon=document.createElement('i');
deleteIcon.classList.add("fa-solid","fa-trash","delete-icon","d-none");
deleteIconContainer.appendChild(deleteIcon);
selectAllCheckbox.addEventListener("change",()=>{
  const checkBoxes=customersContainer.querySelectorAll("input[type='checkbox']")
  if (selectAllCheckbox.checked){
  for (eachBox of checkBoxes){
    eachBox.checked=true;
  }
  }else{
    for (eachBox of checkBoxes){
    eachBox.checked=false;
  }}
  updateDeleteIconVisibility()
})



function updateDeleteIconVisibility() {
  const anyChecked = document.querySelectorAll("input[type='checkbox']:checked").length > 0;
  deleteIcon.classList.toggle("d-none", !anyChecked);
}

deleteIcon.addEventListener("click",async ()=>{
  const deleteIds=[]
  const checkedRows = document.querySelectorAll("input[type='checkbox']:checked");
  for (checked of checkedRows){
    deleteIds.push(checked.id)
  }
  await deleteCustomers(deleteIds)
})


function createCustomerRow(customer, index) {
  const row = document.createElement("tr");

  row.setAttribute("data-id",customer.id)

  const selectedCell=document.createElement('td');
  const checkBox=document.createElement('input')
  checkBox.type="checkbox"
  checkBox.id=customer.id
  selectedCell.appendChild(checkBox)
  row.appendChild(selectedCell)

  checkBox.addEventListener("change", updateDeleteIconVisibility);

  // Serial Number
  const serialCell = document.createElement("td");
  serialCell.textContent = index + 1;
  row.appendChild(serialCell);

  // Customer Details
  const fields = ["name","contact", "address", "gender"];
  fields.forEach((key) => {
    const cell = document.createElement("td");
    cell.textContent = customer[key] || "";
    row.appendChild(cell);
  });

  // Edit Icon
  const editCell = document.createElement("td");
  const editIcon = document.createElement("i");
  editIcon.classList.add("fa-regular", "fa-pen-to-square");
  editCell.appendChild(editIcon);
  row.appendChild(editCell);

  editIcon.addEventListener('click',()=>{
    editCell.textContent=""
    const saveIcon=document.createElement('i');
    saveIcon.classList.add("fa-solid","fa-check","save-icon")

    saveIcon.addEventListener('click',async()=>{
      let id=customer.id

      const inputs = row.querySelectorAll("input");
      const name = inputs[1].value;
      const contact = inputs[2].value;
      const address = inputs[3].value;
      const gender=row.querySelector("select").value
      
      const contactElement=inputs[2]

      contactElement.addEventListener('keydown',contactValidation)
      const fields=[name,contact,address]
      function validateUpdates() {
        const allFilled = fields.every(f => f.trim() !== "");
        const validContact = contact.length === 10;
        return allFilled && validContact;
      }

      if (validateUpdates()){
        const updatedCustomer = {
          name,
          contact,
          address,
          gender
        };
        updateCustomer(id,updatedCustomer)
      }else{
        alert("Please correct the data!")
      }

    })

    
    editCell.appendChild(saveIcon)
    const cells = row.querySelectorAll('td');

    const editableIndexes = [2, 3, 4, ]; //editable columns

    editableIndexes.forEach((index) => {
        const cell = cells[index];                  
        const input = document.createElement('input'); 
        input.value = cell.textContent;             
        cell.textContent = '';                      
        cell.appendChild(input);  
    });

    const genderCell=cells[5]
    genderCell.textContent='';

    const genderSelect = document.createElement("select");
    genderSelect.id = "gender";

    const maleOption = document.createElement("option");
    maleOption.value = "M";
    maleOption.textContent = "M";
    genderSelect.appendChild(maleOption);
    maleOption.selected = true;

    const femaleOption = document.createElement("option");
    femaleOption.value = "F";
    femaleOption.textContent = "F";
    genderSelect.appendChild(femaleOption);

    genderCell.appendChild(genderSelect)
    

    
  })

  return row;
}

// ======================
// INITIAL LOAD
// ======================
async function initialCustomers() {
  // Fetch count ONLY once
  const countCustomers = await fetch("http://localhost:3000/customers/count/");
  const { total } = await countCustomers.json();
  totalRecords=total
  totalPages=Math.ceil(totalRecords/pageLimit)
  totalPages = Math.ceil(total /pageLimit);
  fetchCustomers(); // Load first page
}

initialCustomers()
        


rightPage.addEventListener("click", () => {
  currentPage++;
  fetchCustomers(currentPage);
});

leftPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchCustomers(currentPage);
  }
});


firstPage.addEventListener("click", () => {
    currentPage=1;
    fetchCustomers(currentPage);
});


lastPage.addEventListener("click", () => {
    currentPage=totalPages;
    fetchCustomers(totalPages);
});

