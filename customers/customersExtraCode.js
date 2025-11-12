//DELETE ICON
function deleteRows(){
  const deleteIcon=document.createElement('i');
  deleteIcon.classList.add("fa-solid","fa-trash","delete-icon")
    deleteIcon.addEventListener('click',() => {
    modal.style.display = "flex"; // show popup in center

    confirmYes.onclick = async () => {
      modal.style.display = "none";
      await deleteCustomer(customer.id);
    };

    confirmNo.onclick = () => {
      modal.style.display = "none";
    };
  });
  deleteIconContainer.appendChild(deleteIcon)
}

