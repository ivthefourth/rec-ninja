import './layout.css';
import state from '../state/state';

state.route.on('change', function(e){
   if(e.val.length >= 2){
      $('#show-directions').attr('disabled', false);
   }
   else{
      $('#show-directions').attr('disabled', true);
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
   });
   $('#mobile-show-route').click(function(e){
      e.preventDefault();
      mobileShow('#route-container');
   });
   $('#mobile-show-map').click(function(e){
      e.preventDefault();
      mobileShow('#map');
   });
   $('#mobile-show-suggestions').click(function(e){
      e.preventDefault();
      mobileShow('#suggestions-container');
   });

   //non-mobile buttons:
   $('#show-interests').click(function(e){
      e.preventDefault();
      show('#interests-container');
   });
   $('#show-route').click(function(e){
      e.preventDefault();
      show('#route-container');
   });
   $('#show-suggestions').click(function(e){
      e.preventDefault();
      show('#suggestions-container');
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




