// Initializes the npm packages
var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

// Initializes the connection to MySQL database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "RajuC1220",
  database: "bamazon",
  insecureAuth: true
});

// Connection with the server
connection.connect(function (err) {
  if (err) {
    console.error("error: " + err.stack);
  }
  productTableDataLoad();
});

// Load the products table from the database
function productTableDataLoad() {

  connection.query("SELECT * FROM products", function (err, res) {
    if (err) throw err;

    console.table(res);

    promptItemsToCustomer(res);
  });
}

// Prompt the customer to select product ID
function promptItemsToCustomer(catalog) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "itemOrQ",
        message: "Please type the ID number of the item you like to buy? [Type: Q to exit]",
        validate: function (val) {
          return !isNaN(val) || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function (val) {
      // Check if the user wants to quit the program
      toExit(val.itemOrQ);
      var itemId = parseInt(val.itemOrQ);
      var product = checkStoreInventory(itemId, catalog);

      if (product) {

        promptQuantityToCustomer(product);
      }
      else {
        // Let the user know the item is not in the inventory.
        console.log("\nYour item is not available in the catalog.");
        productTableDataLoad();
      }
    });
}

// Prompt the customer to enter the product quantity
function promptQuantityToCustomer(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "count",
        message: "How many items you like to buy? [Type: Q to exit]",
        validate: function (val) {
          return val > 0 || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function (val) {
      // Check if the user wants to quit the program
      toExit(val.count);
      var count = parseInt(val.count);

      // If there isn't enough of the item select, let the user
      if (count > product.stock_quantity) {
        console.log("\nInsufficient quantity!");
        productTableDataLoad();
      }
      else {
        //  let user the product information
        buyItems(product, count);
      }
    });
}

// Purchase the desired quantity of the desired item
function buyItems(product, count) {
 
  connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?",
    [count, product.item_id],
    function (err, res) {
      // Let the user know the purchase was successful
      console.log("\nYou purchased " + count + " item(s) of " + product.product_name + " successfully.");
      productTableDataLoad();
    }
  );
}

// Check the item user select is in the inventory
function checkStoreInventory(itemId, catalog) {
  for (var i = 0; i < catalog.length; i++) {
    if (catalog[i].item_id === itemId) {
      // If found, return the product
      return catalog[i];
    }
  }
  // Otherwise return null
  return null;
}

// If the user wants to quit the program
function toExit(itemOrQ) {
  if (itemOrQ.toLowerCase() === "q") {
    // Exit the current node process
    console.log("Goodbye!");
    process.exit(0);
  }
}
