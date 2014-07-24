var app = {
  newCustomer: function() {
    var name = $('#name').val();
    var tab = new Number($('#tab').val());

    var valid = true;
    $('#name').parent('div').removeClass('has-error');
    $('#tab').parent('div').removeClass('has-error');

    if(!name) {
      $('#name').parent('div').addClass('has-error');
      valid = false;
    }
    if(!tab || isNaN(tab)) {
      $('#tab').parent('div').addClass('has-error');
      valid = false;
    }

    if(valid) {
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
        data: {name:name,teaser:teaser,recipe:recipe,price:price},
        success: function() {
          window.location = '/newdrink?success=true';
        }
      });
    }
    return false;
  }
};
