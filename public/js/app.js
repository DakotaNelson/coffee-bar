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
        url: '/addcustomer',
        data: {name:name,tab:tab},
        success: function() {
          window.location='/';
        }
      });
    }
    return false;
  }
};
