const express = require("express");
const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

//Used absolute DB path for Render
const dbPath = path.join(__dirname, "customersDB.db");

let db = null;

const dbInitializeAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Render gives port through environment variable
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

dbInitializeAndServer();

// ----------- ROOT TEST ROUTE (IMPORTANT FOR RENDER) ------------
app.get("/", (req, res) => {
  res.send("Milk Billing Backend is Running 👍");
});

// ----------------- ADD CUSTOMER ------------------------
app.post("/customers/", async (request, response) => {
  const { firstName, lastName, contact, address, gender } = request.body;
  const addCustomerQuery = `
    INSERT INTO customers (name, contact, address, gender)
    VALUES ('${firstName} ${lastName}', '${contact}', '${address}', '${gender}');
  `;
  await db.run(addCustomerQuery);
  response.send("Customer Added");
});

// ----------------- ADD QUANTITY (MULTIPLE) ------------------------
app.post("/quantity/", async (request, response) => {
  let arrayOfQuantity = request.body;

  for (let eachCustomer of arrayOfQuantity) {
    const { date, id, quantity } = eachCustomer;
    const addQuantityQuery = `
      INSERT INTO quantity (date, customer_id, quantity)
      VALUES ('${date}', ${id}, ${quantity});
    `;
    await db.run(addQuantityQuery);
  }
  response.send("Quantities Added");
});

// ----------------- CUSTOMERS COUNT ------------------------
app.get("/customers/count/", async (request, response) => {
  const query = `SELECT COUNT(*) AS total FROM customers`;
  const result = await db.get(query);
  response.send(result);
});

// ----------------- PAGINATED CUSTOMERS ------------------------
app.get("/customers/", async (request, response) => {
  const { page = 1, limit = 30 } = request.query;
  const offset = (Number(page) - 1) * Number(limit);

  const query = `
    SELECT * FROM customers
    LIMIT ${limit} OFFSET ${offset};
  `;
  const rows = await db.all(query);
  response.send(rows);
});

// ----------------- UPDATE CUSTOMER ------------------------
app.put("/customers/:customerId/", async (request, response) => {
  const { customerId } = request.params;
  const { name, contact, address, gender } = request.body;

  const query = `
    UPDATE customers SET
      name='${name}',
      contact='${contact}',
      address='${address}',
      gender='${gender}'
    WHERE id=${customerId};
  `;

  await db.run(query);
  response.send("Customer updated successfully!");
});

// ----------------- DELETE CUSTOMER ------------------------
app.delete("/customers/:customerId/", async (request, response) => {
  const { customerId } = request.params;
  const query = `DELETE FROM customers WHERE id=${customerId}`;
  await db.run(query);
  response.send("Deleted Customer Successfully!");
});

// ----------------- DELETE MULTIPLE CUSTOMERS ------------------------
app.post("/customers/delete/", async (req, res) => {
  const { ids } = req.body;
  const idString = ids.join(",");
  const query = `DELETE FROM customers WHERE id IN (${idString});`;

  try {
    await db.run(query);
    res.send(`Deleted ${ids.length} customers successfully.`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error deleting customers");
  }
});

// ----------------- UPSERT QUANTITY ------------------------
app.put("/quantity/", async (req, res) => {
  const entries = req.body;

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

// ----------------- GET QUANTITY BY DATE ------------------------
app.get("/quantity/", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).send("Date is required");
  }

  const query = `SELECT customer_id, quantity FROM quantity WHERE date = ?`;

  try {
    const rows = await db.all(query, [date]);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching quantities");
  }
});

// ----------------- BILLING ------------------------
app.get("/billing/", async (req, res) => {
  const { customer_id, month, cost } = req.query;

  if (!customer_id || !month || !cost) {
    return res.status(400).send("Missing inputs");
  }

  const [year, mon] = month.split("-");

  const query = `
    SELECT date, quantity
    FROM quantity
    WHERE customer_id = ?
      AND strftime('%Y', date) = ?
      AND strftime('%m', date) = ?
    ORDER BY date;
  `;

  try {
    const rows = await db.all(query, [customer_id, year, mon]);

    const result = rows.map((row) => ({
      date: row.date,
      quantity: row.quantity,
      price: row.quantity * Number(cost),
    }));

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating bill");
  }
});
