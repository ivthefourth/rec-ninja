import './layout.css';
import state from '../state/state';

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
      mobileShow('#interests-container')
   });
   $('#mobile-show-route').click(function(e){
      e.preventDefault();
      mobileShow('#route-container')
   });
   $('#mobile-show-map').click(function(e){
      e.preventDefault();
      mobileShow('#map')
   });
   $('#mobile-show-suggestions').click(function(e){
      e.preventDefault();
      mobileShow('#suggestions-container')
   });

});

function mobileShow(divId){
   $('.layout-shown').removeClass('layout-shown');
   $(divId).addClass('layout-shown');
}




