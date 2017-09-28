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
      medShow('#interests-container');

      largeShow('layout-show-interests');
      $(this).blur();
   });
   $('#show-route').click(function(e){
      e.preventDefault();
      medShow('#route-container');

      largeShow('layout-show-route');
      $(this).blur();
   });
   $('#show-suggestions').click(function(e){
      e.preventDefault();
      medShow('#suggestions-container');

      largeShow('layout-show-suggestions');
      $(this).blur();
   });

});

function mobileShow(divId){
   $('.layout-shown-mobile').removeClass('layout-shown-mobile');
   $(divId).addClass('layout-shown-mobile');
}

const timerIds = {
}
function medShow(divId){
   let div = $(divId);
   if( div.hasClass('layout-med-shown')){
      div.removeClass('layout-med-shown');
      timerIds[divId] = setTimeout(() => { 
         div.removeClass('layout-med-visible');
      }, 500);
   }
   else{
      let shown = $('.layout-med-shown');
      if(shown.length){
         timerIds[ '#' + shown.first().attr('id')] = setTimeout(() => { 
            shown.removeClass('layout-med-visible');
         }, 500);
         shown.removeClass('layout-med-shown');
      }
      console.log(timerIds);
      div.addClass('layout-med-shown layout-med-visible');
      clearTimeout(timerIds[divId]);
   }
}

function largeShow(className){
   let body = $('body').first();
   body.toggleClass(className);
}




