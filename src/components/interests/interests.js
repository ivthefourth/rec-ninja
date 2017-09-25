import './interests.css';
import state from '../state/state';

    
   
 function addChip() {
   for (let i = 0; i < state.interests.all.length; i++) {
      
      let newChip = $('<div class="chip center"></div>');
      $("#unselected-interests").append(newChip.text(state.interests.all[i].name));
      
      $(newChip).click(function() {
         state.interests.all[i].toggle();
      });
   state.interests.all[i].on('change', function(e) {
      
      if(e.val) {
         newChip.addClass("selected");
         $("#selected-interests").append(newChip);
      } else {
         newChip.removeClass('selected');
         $("#unselected-interests").prepend(newChip);
      }

   });
   }
}

$(document).ready(function(){
   addChip();


   $("#clear-interests").click(function() {
   
      state.interests.selected.forEach(function(clear) {
         clear.update(false, true);
      });
      state.interests.emit('change');
   });
})
