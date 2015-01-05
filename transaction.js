var Transaction = function(db) {
  var module = {};

  module.purchase = function(customer, drink, callback) {
    db.collection('customers').update(
      {_id:customer._id},
      {
        $inc: { tab: -drink.price }, // subtracts the price from the customer's tab
      },
      {safe:true},
      function(err, object) {
        callback(err, object);
      }
    );

    // also logs a transaction for this purchase
    module.transaction("purchase", drink.name, customer, -drink.price)
  }

  module.transaction = function(type, drinkName, customer, amount) {
    var timestamp = new Date();
    // create a transaction entry from the details provided
    db.collection('transactions').insert({type: type, drink: drinkName, customer: customer._id, timestamp: timestamp, amount: amount},
      {safe:true},
      function(err, transactions) {
        var transaction = transactions[0];
        console.log("Transaction #" + transaction._id + ": " + customer.name + " bought a " + drink.name + " for $" + drink.price);
      }
  );

  }


  console.log("transaction module ready");
  return module;
};

module.exports = Transaction;
