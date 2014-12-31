var app = {
  newCustomer: function() {
    var name = $('#name').val();
    var venmo = $('#venmo').val();
    var tab = new Number($('#tab').val());

    var valid = true;
    $('#name').parent('div').removeClass('has-error');
    $('#venmo').parent('div').removeClass('has-error');
    $('#tab').parent('div').removeClass('has-error');

    if(!name) {
      $('#name').parent('div').addClass('has-error');
      valid = false;
    }
    /*if(!venmo) {
      $('#venmo').parent('div').addClass('has-error');
      valid = false;
    }*/
    // it's okay to not add a Venmo
    if(!tab || isNaN(tab)) {
      $('#tab').parent('div').addClass('has-error');
      valid = false;
    }

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/addcustomer',
        data: {name:name,venmo:venmo,tab:+tab},
        success: function() {
          window.location='/';
        }
      });
    }
    return false;
  },

  newDrink: function() {
    var name = $('#name').val();
    var teaser = $('#teaser').val();
    var recipe = $('#recipe').val();
    var price = new Number($('#price').val());

    var valid = true;
    $('#name').parent('div').removeClass('has-error');
    $('#teaser').parent('div').removeClass('has-error');
    $('#recipe').parent('div').removeClass('has-error');
    $('#price').parent('div').removeClass('has-error');

    if(!name) {
      $('#name').parent('div').addClass('has-error');
      valid = false;
    }
    if(!teaser) {
      $('#teaser').parent('div').addClass('has-error');
      valid = false;
    }
    if(!recipe) {
      $('#recipe').parent('div').addClass('has-error');
      valid = false;
    }
    if(!price || isNaN(price)) {
      $('#price').parent('div').addClass('has-error');
      valid = false;
    }

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/adddrink',
        data: {name:name,teaser:teaser,recipe:recipe,price:+price},
        success: function() {
          window.location = '/drinks?success=true';
        }
      });
    }
    return false;
  },

  customDrink: function() {
    var valid = true;

    var name = $('#name').val();
    var amount = $('#price').val();
    if(!amount || isNaN(amount)) {
      $('#price').parent('div').addClass('has-error');
      valid = false;
    }
    console.log(-amount);

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/modify-tab',
        data: {name:name, amount:-amount, type: "purchase", drink: "Custom Drink"},
        success: function() {
          window.location = '/';
        }
      });
    }
    return false;
  },

  makeDeposit: function() {
    var valid = true;

    var name = $("#name").text();

    var amount = $("#deposit").val();
    if(!amount || isNaN(amount)) {
      $('#price').parent('div').addClass('has-error');
      valid = false;
    }

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/modify-tab',
        data: {name:name, amount:+amount, type: "deposit", drink: null},
        success: function() {
          location.reload();
        }
      });
    }
    return false;
  },

  deleteDrink: function() {
    var name = $("#drink-name").text();
    $.ajax({
      type: 'POST',
      url: '/delete-drink',
      data: {name:name},
      success: function() {
        window.location = '/drinks';
      }
    });
  },

  addVenmo: function() {
    // update a user with their Venmo username
    var valid = true;

    var venmo = $("#venmo").val();
    var name = $("#name").text();

    if(!venmo) {
      $('#venmo').parent('div').addClass('has-error');
      valid = false;
    }
    // no check for name since it's a page element and is therefore guaranteed
    // to be good (as much as anything is, really)

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/add-venmo',
        data: {name:name,venmo:venmo},
        success: function() {
          delay(200); // allow time for db to update
          // this is a waste, but 200ms matters less to me than
          // the dev time to make it go away
          location.reload();
        }
      });
    }
    return false;
  },

  venmoCharge: function() {
  // tell the server to issue Venmo charges
    $.ajax({
      type: 'POST',
      url: '/venmo-charges',
      data: {},
      success: function() {
        location.reload();
      }
    });
    return false;
    // since we're refreshing anyway this doesn't matter, but whatever
  }
};
