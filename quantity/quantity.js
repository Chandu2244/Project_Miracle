let servingDate=document.getElementById("servingDate")
let quantityContainer=document.getElementById("quantityContainer");
const saveBtn=document.getElementById("saveBtn");
const submitBtn=document.getElementById("submitBtn");
let submissionMsg=document.getElementById("submissionMsg");
let submissionErrMsg=document.getElementById("submissionErrMsg");
let dateErrMsg=document.getElementById("dateErrMsg");
let group1=document.getElementById("group1");
let selectCustomersBody=document.getElementById("selectCustomersBody");
const modal = document.getElementById("selectCustomersModal");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const firstPage = document.getElementById("firstPage");
const lastPage = document.getElementById("lastPage");
const recordInfo = document.getElementById("recordInfo");
let quantityValues=[];
let userSelectedDate=null;

let currentPage = 1;
let pageLimit = 30;
let totalRecords = 0;
let totalPages = 1;





const API_URL = "http://localhost:3000/quantity/";

async function fetchCustomers() {
  try {
    const response = await fetch(API_URL);
    allCustomers = await response.json();
    renderCustomers(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

async function fetchSelectCustomers() {
  try {
    const response = await fetch(API_URL);
    allCustomers = await response.json();
    renderSelectCustomers(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

function renderCustomers(customersList) {
  quantityContainer.innerHTML = "";
  customersList.forEach((customer, index) => {
    quantityContainer.appendChild(createCustomerRow(customer, index));
  });
}

function renderSelectCustomers(customersList) {
  selectCustomersBody.innerHTML = "";
  customersList.forEach((customer, index) => {
    selectCustomersBody.appendChild(createSelectCustomerRow(customer, index));
  });
}


function createCustomerRow(customer, index) {
  const row = document.createElement("tr");

  row.setAttribute("data-id",customer.id)

  // Serial Number
  const serialCell = document.createElement("td");
  serialCell.textContent = index + 1;
  row.appendChild(serialCell);

  // Customer Details
  const fields = ["name","address","quantity"];
  fields.forEach((key) => {
    const cell = document.createElement("td");
    cell.textContent = customer[key] || "";
    row.appendChild(cell);
  });

  let cells=row.querySelectorAll('td')
  let quantityCell=cells[3]
  
  const quantityInput=document.createElement('input')
  quantityCell.appendChild(quantityInput)
  

  quantityInput.addEventListener('keydown',(event)=>{
    if ((event.key>='0' && event.key<='9' 
    && quantityInput.value.length<3 )||
    event.key === 'Backspace' ||
    event.key === 'Delete' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight' ||
    event.key === 'Tab'){
      return
    }else {
    event.preventDefault(); // block all others
    }
  })

  return row;
}


function createSelectCustomerRow(customer, index) {
  const row = document.createElement("tr");

  row.setAttribute("data-id",customer.id)

  checkboxContainer=document.createElement('td')
  const checkbox=document.createElement('input')
  checkboxContainer.appendChild(checkbox)
  checkbox.type="checkbox"
  checkbox.id=customer.id
  row.appendChild(checkboxContainer)

  // Serial Number
  const serialCell = document.createElement("td");
  serialCell.textContent = index + 1;
  row.appendChild(serialCell);

  // Customer Details
  const fields = ["name","address"];
  fields.forEach((key) => {
    const cell = document.createElement("td");
    cell.textContent = customer[key] || "";
    row.appendChild(cell);
  });

  let cells=row.querySelector('td')
  let checkboxCell=cells[0]

  return row;
}

function validateFields(){
  let allValuesfilled=false;
  const dateValidation=servingDate.value!=="";
  let allRows=quantityContainer.querySelectorAll('tr');
  for (row of allRows){
    let customerQuantity=row.querySelector('input').value
    if (customerQuantity.trim()===""){
      allValuesfilled=false
      break
    }else{
      allValuesfilled=true
    }
  }
  if (dateValidation===false){
    dateErrMsg.textContent="Please fill the date"
  }else{
    dateErrMsg.textContent=""
  }

  if (allValuesfilled===false){
    submissionErrMsg.textContent="Please fill quantity!"
  }else{
    submissionErrMsg.textContent=""
  }

  return allValuesfilled && dateValidation
}

async function addQuantityValues(){
  try{
    const options={
    method:'POST',
    headers:{
      "Content-Type":"application/json",
      "Accept":"application/json"
    },
    body:JSON.stringify(quantityValues)
    }
    const response=await fetch(API_URL,options);
    if (response.ok){
      submissionErrMsg.textContent="Quantities Submitted"
    }else{
      alert("Error caused while submitting")

    }
  }catch(error){
    console.log(error)    
  }
}

submitBtn.addEventListener("click",async(event)=>{
  event.preventDefault();
  if (validateFields()){
    userSelectedDate=servingDate.value
    let allRows=quantityContainer.querySelectorAll('tr');
    allRows.forEach((row)=>{
      let customerQuantity=row.querySelector('input').value
      let eachCustomer={
        date:userSelectedDate.toString(),
        id:Number(row.dataset.id),
        quantity:Number(customerQuantity.trim())
      }
      quantityValues.push(eachCustomer)
    })
    await addQuantityValues()
  };
})



group1.addEventListener("click", () => {
    modal.style.display = "flex";   // show modal
    fetchSelectCustomers();
});

// Close modal when clicking outside the box
modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});




// ======================
// INITIAL LOAD
// ======================
fetchCustomers();



// ======================
// Pagination
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


