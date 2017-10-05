import './interests.css';
import state from '../state/state';
import {emojiMap} from '../recreation/constants';

    
   
 function addChip() {
   for (let i = 0; i < state.interests.all.length; i++) {
      
      let newChip = $('<a class="chip" href="#"></a>');
      $("#unselected-interests").append(
         newChip.text(state.interests.all[i].name)
         .prepend(emojiMap[state.interests.all[i].id])
      );
      
      $(newChip).click(function(e) {
         e.preventDefault();
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

state.interests.on('change', (e) => {
   if (!e.val.selected.length){
      $('#interests-none-selected').removeClass('hide');
   }
   else{
      $('#interests-none-selected').addClass('hide');
   }
})

$(document).ready(function(){
   addChip();


   $("#clear-interests").click(function(e) {
      e.preventDefault();
   
      state.interests.selected.forEach(function(clear) {
         clear.update(false, true);
      });
      state.interests.emit('change');
   });
})
