let servingDate=document.getElementById("servingDate")
let quantityContainer=document.getElementById("quantityContainer");
const saveBtn=document.getElementById("saveBtn");
const submitBtn=document.getElementById("submitBtn");
let submissionMsg=document.getElementById("submissionMsg");
let submissionErrMsg=document.getElementById("submissionErrMsg");
let dateErrMsg=document.getElementById("dateErrMsg");
let quantityValues=[];
let userSelectedDate=null;




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

function renderCustomers(customersList) {
  quantityContainer.innerHTML = "";
  customersList.forEach((customer, index) => {
    quantityContainer.appendChild(createCustomerRow(customer, index));
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




// ======================
// INITIAL LOAD
// ======================
fetchCustomers();
