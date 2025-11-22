const express=require('express')
const app=express()
app.use(express.json())

const cors=require('cors')
app.use(cors())

const {open}=require('sqlite')
const sqlite3=require('sqlite3')
const path=require('path')
const { off } = require('process')
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

//Mulitple Customers Add
// app.post('/customers/',async(request,response)=>{
//     let arrayOfCustomers=request.body
//     for (let eachCustomer of arrayOfCustomers){
//         const {firstName,lastName,contact,address,gender}=eachCustomer
//         const addCustomerQuery=`INSERT INTO customers
//         (name,contact,address,gender) VALUES
//         ('${firstName} ${lastName}',
//         '${contact}',
//         '${address}',
//         '${gender}')`
//         await db.run(addCustomerQuery)
//     }
//     response.send("Customers Added!")
// })

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


//GET customers count API 
app.get('/customers/count/',async(request,response)=>{
    const getCustomersCountQuery=`SELECT COUNT(*) AS total from customers`
    const responseObject=await db.get(getCustomersCountQuery)
    response.send(responseObject)
})



//GET Customers API
app.get('/customers/',async(request,response)=>{
    const {page=1,limit=30}=request.query
    const offset = (Number(page) - 1) * Number(limit);
    const getCustomersQuery = `
    SELECT * FROM customers
    LIMIT ${limit} OFFSET ${offset}`;
    const customersObject = await db.all(getCustomersQuery);
    response.send(customersObject)
})



// //GET quantity API - wrong
// app.get('/quantity/',async(request,response)=>{
//     const getCustomersQuery=`SELECT id,name,address from customers`
//     const responseObject=await db.all(getCustomersQuery)
//     response.send(responseObject)
// })


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


app.put("/quantity/", async (req, res) => {
  const entries = req.body; // array of 30 entries

  const upsertQuery = `
    INSERT INTO quantity (customer_id, date, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(customer_id, date) DO UPDATE SET
      quantity = excluded.quantity;
  `;

  try {
    const upsert = await db.prepare(upsertQuery);

    for (let entry of entries) {
      await upsert.run(entry.customer_id, entry.date, entry.quantity);
    }

    await upsert.finalize();
    res.send("Milk entries saved successfully");
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Error saving entries");
  }
});

app.get("/quantity/", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).send("Date is required");
  }

  const query = `
    SELECT customer_id, quantity 
    FROM quantity 
    WHERE date = ?;
  `;

  try {
    const rows = await db.all(query, [date]);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching quantities");
  }
});


