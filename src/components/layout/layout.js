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
   $('#collapse-interests').click(function(e){
      e.preventDefault();
      medShow('#interests-container');

      largeShow('layout-show-interests', true);
   });
   $('#show-route').click(function(e){
      e.preventDefault();
      medShow('#route-container');

      largeShow('layout-show-route');
      $(this).blur();
   });
   $('#collapse-route').click(function(e){
      e.preventDefault();
      medShow('#route-container');

      largeShow('layout-show-route', true);
   });
   $('#show-suggestions').click(function(e){
      e.preventDefault();
      medShow('#suggestions-container');

      largeShow('layout-show-suggestions');
      $(this).blur();
   });
   $('#collapse-suggestions').click(function(e){
      e.preventDefault();
      medShow('#suggestions-container');

      largeShow('layout-show-suggestions');
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
      div.addClass('layout-med-shown layout-med-visible');
      clearTimeout(timerIds[divId]);
   }
}

function largeShow(className, clickedFromCollapse){
   let body = $('body').first();
   if(
      clickedFromCollapse &&
      body.hasClass('layout-show-interests') && 
      body.hasClass('layout-show-route')
   ){
      body.removeClass(className);
      return;
   }
   else if(clickedFromCollapse && !body.hasClass(className)){
      body.addClass(className);
      return;
   }

   //if this is to show suggestions
   if( className === 'layout-show-suggestions'){
      //just toggle whether suggestions is open/closed
      if(body.hasClass(className)){
         body.removeClass(className);
         timerIds[className] = setTimeout(() => { 
            body.removeClass('layout-right-sb-visible');
         }, 500);
      }
      else{
         clearTimeout(timerIds[className]);
         body.addClass('layout-right-sb-visible ' + className);
      }
   }
   else{
      //if interests and route are both open
      if(
         body.hasClass('layout-left-sb-open') &&
         body.hasClass('layout-show-interests') && 
         body.hasClass('layout-show-route')
      ){
         //just remove the not selected 
         body.removeClass('layout-show-interests layout-show-route');
         body.addClass(className);
      }
      //else if neither is open
      else if(!body.hasClass('layout-left-sb-open')){
         //open sidebar and show selected 
         clearTimeout(timerIds.leftSideBar);
         body.removeClass('layout-show-interests layout-show-route');
         body.addClass('layout-left-sb-visible layout-left-sb-open');
         body.addClass(className);
         setTimeout(() => {body.addClass('layout-left-height-should-animate')}, 1);
      }
      //else if the selected is not open
      else if (!body.hasClass(className)){
         //close the unselected and open selected
         body.addClass(className);
         if(className === 'layout-show-interests'){
            body.removeClass('layout-show-route');
            //need to set visibility on route layout-container-body to hidden
            //after animation...
            //or make it so tabbing into route shows route
         }
         else{
            body.removeClass('layout-show-interests');
            //need to set visibility on interests layout-container-body to hidden
            //after animation
         }
      }
      //else if the selected is open
      else{
         //close the sidebar and set timeout to remove the class
         body.removeClass('layout-left-height-should-animate');
         body.removeClass('layout-left-sb-open');
         timerIds.leftSideBar = setTimeout(() => {
            body.removeClass('layout-left-sb-visible');
            body.removeClass(className);
         }, 500);
      }
   }
   //Note: side bar open class should allow heights to animate?
}




