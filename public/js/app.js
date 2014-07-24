var app = {
  newCustomer: function() {
    var name = $('#name').val();
    var tab = new Number($('#tab').val());
    if(!name) {
      $('#name').parent('div').addClass('has-error');
    }
    else if(!tab || isNaN(tab)) {
      $('#tab').parent('div').addClass('has-error');
    }
    else {
      //valid
      $.ajax({
        type: 'POST',
        url: '/adddrink',
        data: {name:name,tab:tab},
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
    var price = new Number($('#cost').val());

    var valid = true;

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
      $('#tab').parent('div').addClass('has-error');
      valid = false;
    }

    if(valid) {
      $.ajax({
        type: 'POST',
        url: '/adddrink',
        data: {name:name,teaser:teaser,recipe:recipe,price:price},
        success: function() {
          window.location = '/newdrink?success=true';
        }
      });
    }
    return false;
  }
};
