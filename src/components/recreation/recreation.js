import './recreation.css';
import state from '../state/state';
import './displayRecAreaSuggestions';
import './recAreaDetails';

$(document).ready(function() {
   $('#mobile-find-rec').click(function(e) {
      e.preventDefault();
      $(this).blur();
      let status = state.recreation.status;
      if(status.canLoad && status.shouldLoad){
         state.recreation.search();
      }
   });
   $('#find-rec').click(function(e) {
      e.preventDefault();
      $(this).blur();
      let status = state.recreation.status;
      if(status.canLoad && status.shouldLoad){
         state.recreation.search();
      }
   });
})
