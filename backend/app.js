const express=require('express')
const app=express()
app.use(express.json())

const cors=require('cors')
app.use(cors())

const {open}=require('sqlite')
const sqlite3=require('sqlite3')
const path=require('path')
const dbPath=path.join(__dirname,'customersDB.db')

let db=null

const dbInitializeAndServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })

        app.listen(3000,()=>{
            console.log('Server running at http://localhost:3000/')
        })

    }catch(e){
        console.log(`DB Error:${e.message}`);
        process.exit(1);
    }
}

dbInitializeAndServer()


//ADD Customer API
app.post('/customers/',async(request,response)=>{
    const {firstName,lastName,contact,address,gender}=request.body
    const addCustomerQuery=`INSERT INTO customers
    (name,contact,address,gender) VALUES
    ('${firstName} ${lastName}',
    '${contact}',
    '${address}',
    '${gender}')`
    await db.run(addCustomerQuery)
    response.send("Customer Added")
})

//ADD Quantity API
app.post('/quantity/',async (request,response)=>{
    let arrayOfQuantity=request.body
    for (let eachCustomer of arrayOfQuantity){
        const {date,id,quantity}=eachCustomer
        const addQuantityQuery=`INSERT INTO quantity
        (date,id,quantity) VALUES
        ('${date}',
        ${id},
        ${quantity})`
        await db.run(addQuantityQuery)
    }
    response.send("Quantities Added")
})


//GET customers API CUSTOMERS
app.get('/customers/',async(request,response)=>{
    const getCustomersQuery=`SELECT * from customers`
    const responseObject=await db.all(getCustomersQuery)
    response.send(responseObject)
})


//GET quantity API
app.get('/quantity/',async(request,response)=>{
    const getCustomersQuery=`SELECT id,name,address from customers`
    const responseObject=await db.all(getCustomersQuery)
    response.send(responseObject)
})


//UPDATE Customers
app.put('/customers/:customerId/',async(request,response)=>{
    const {customerId}=request.params
    const {name,contact,address,gender}=request.body
    const updateCustomerQuery=`UPDATE customers SET
    name='${name}',
    contact='${contact}',
    address='${address}',
    gender='${gender}'
    WHERE id=${customerId}`
    await db.run(updateCustomerQuery)
    response.send("Customer updated successfully!")
})

//DELETE Customers
app.delete('/customers/:customerId/',async(request,response)=>{
    const {customerId}=request.params
    const deleteCustomerQuery=`DELETE FROM customers WHERE 
    id=${customerId}`
    await db.run(deleteCustomerQuery)
    response.send("Deleted Customer Successfully!")
})


//DELETE MULTIPLE Cutomers
app.post("/customers/delete/", async (req, res) => {
  const { ids } = req.body; 
  const idSring=ids.join(",")
  const deleteQuery = `DELETE FROM customers WHERE id IN (${idSring});`;
  try {
    await db.run(deleteQuery);
    res.send(`Deleted ${ids.length} customers successfully.`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error deleting customers");
  }
});


