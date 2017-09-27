import './layout.css';
import state from '../state/state';

state.route.on('change', function(e){
   if(e.val.length >= 2){
      $('#show-directions').attr('disabled', false);
      $('#show-directions').attr('tabindex', 0);

      $('#mobile-show-directions').removeClass('rec-navload-disabled');
      $('#mobile-show-directions i').removeClass('blue-grey-text text-darken-2');
      $('#mobile-show-directions').attr('tabindex', 0);
   }
   else{
      $('#show-directions').attr('disabled', true);
      $('#show-directions').attr('tabindex', -1);

      $('#mobile-show-directions').addClass('rec-navload-disabled');
      $('#mobile-show-directions i').addClass('blue-grey-text text-darken-2');
      $('#mobile-show-directions').attr('tabindex', -1);
   }
});

$(document).ready(function() {
    $('select').material_select();
	
	$(".destination-input").on('focus', function() {
 		if ($("#interests-header").hasClass('active')) {
 			$("#interests-header").click();
 		}
 	});

	$('#tutorial-modal').modal({
	  inDuration: 300,
	  startingTop: '40%', // Starting top style attribute
	  endingTop: '10%'
	});


   //mobile buttons:
   $('#mobile-show-interests').click(function(e){
      e.preventDefault();
      mobileShow('#interests-container');
      $(this).blur();
   });
   $('#mobile-show-route').click(function(e){
      e.preventDefault();
      mobileShow('#route-container');
      $(this).blur();
   });
   $('#mobile-show-map').click(function(e){
      e.preventDefault();
      mobileShow('#map');
      $(this).blur();
   });
   $('#mobile-show-suggestions').click(function(e){
      e.preventDefault();
      mobileShow('#suggestions-container');
      $(this).blur();
   });

   //non-mobile buttons:
   $('#show-interests').click(function(e){
      e.preventDefault();
      show('#interests-container');
      $(this).blur();
   });
   $('#show-route').click(function(e){
      e.preventDefault();
      show('#route-container');
      $(this).blur();
   });
   $('#show-suggestions').click(function(e){
      e.preventDefault();
      show('#suggestions-container');
      $(this).blur();
   });

});

function mobileShow(divId){
   $('.layout-shown-mobile').removeClass('layout-shown-mobile');
   $(divId).addClass('layout-shown-mobile');
}

function show(divId){
   if( $(divId).hasClass('layout-shown')){
      $(divId).removeClass('layout-shown');
   }
   else{
      $('.layout-shown').removeClass('layout-shown');
      $(divId).addClass('layout-shown');
   }
}




