import './tutorial.css';
import hopscotch from 'hopscotch';
import '../../../node_modules/hopscotch/dist/css/hopscotch.min.css';


var bubbleWidth = 280;

$(document).ready(function (argument) {
   var hasDoneTutorial = localStorage.getItem('has-done-tutorial') === 'true';
   if (!hasDoneTutorial){
      doTutorial();
   }
   $('#tutorial-start').click((e) => {
      e.preventDefault();
      $('#tutorial-modal').modal('close');
      doTutorial();
   })
});

function doTutorial(){   
   var isMobile = matchMedia('(max-width: 600px)').matches;

   //need to improve mobile tutorial before using it 
   if (isMobile) return;

   var isMed = matchMedia('(min-width: 601px)').matches && 
      matchMedia('(max-width: 991px)').matches;
      
   var steps = [
      {
         title: 'Welcome to Rec Nninja',
         content: 'This tutorial will help you plan your first adventure!',
         target: $('.layout-logo')[0],
         placement: 'bottom'
      },
      {
         title: 'Interests',
         content: 'First, open up the interests section.',
         target: isMobile ? 'mobile-show-interests' : 'show-interests',
         placement: isMobile ? 'top' : 'bottom',
         nextOnTargetClick: true,
         showNextButton: false,
      },
      {
         title: 'Interests',
         content: 'Select some activities that you are interested in.',
         target: 'unselected-interests',
         placement: isMobile ? 'top' : 'right',
         delay: 200,
      },
      {
         title: 'Route',
         content: 'Now, open up the route section.',
         target: isMobile ? 'mobile-show-route' : 'show-route',
         placement: isMobile ? 'top' : 'bottom',
         nextOnTargetClick: true,
         showNextButton: false,
      },
      {
         title: 'Route',
         content: 'Add some locations that you want to travel to. Make sure to select from the dropdown menu.',
         target: 'destinations',
         placement: isMobile ? 'bottom' : 'right',
         delay: 200,
      },
      {
         title: 'Search',
         content: 'You should be able to search for recreation areas. If you can\'t, make sure that you have chosen at least one location and one interest.',
         target: isMobile ? 'mobile-find-rec' : 'find-rec',
         placement: 'bottom',
         xOffset: -bubbleWidth,
         arrowOffset: bubbleWidth - 5,
         nextOnTargetClick: true,
         showNextButton: false,
      },
      {
         title: 'Recreation Areas',
         content: 'Recreation areas will be displayed on the map. You can also view them in a list.',
         target: isMobile ? 'mobile-show-suggestions' : 'show-suggestions',
         placement: isMobile ? 'top' : 'bottom',
         xOffset: -bubbleWidth,
         arrowOffset: bubbleWidth - 5,
         nextOnTargetClick: true,
         showNextButton: false,
         delay: 500,
      },
      {
         title: 'Recreation Areas',
         content: 'You can view more information about recreation areas, bookmark them, and add them to your route.',
         target: 'filtered-container',
         placement: isMobile ? 'top' : isMed ? 'right' : 'left',
         delay: 200,
      },
      {
         title: 'Directions',
         content: 'If you have at least two locations in your route, you can view the directions for your trip.',
         target: isMobile ? 'mobile-show-directions' : 'show-directions',
         placement: 'bottom',
         xOffset: -bubbleWidth,
         arrowOffset: bubbleWidth - 5,
         nextOnTargetClick: true,
      },
      {
         title: 'Learn More',
         content: 'Thank you for using Rec Ninja; you can find more information about the project here.',
         target: isMobile ? 'mobile-show-about' : 'show-about',
         placement: 'bottom',
         xOffset: -bubbleWidth,
         arrowOffset: bubbleWidth - 5,
         nextOnTargetClick: true,
      },
   ]

   var tutorial = {
      id: 'tutorial' + Date.now(),
      steps: steps,
      onEnd: setTutorialSeen,
      onClose: closedTutorial
   }
   hopscotch.startTour(tutorial);
}

function setTutorialSeen(){
   localStorage.setItem('has-done-tutorial', 'true');
}

function closedTutorial(){
   var isMobile = matchMedia('(max-width: 600px)').matches;
   var closed = {
      id: 'closed' + Date.now(),
      onEnd: setTutorialSeen,
      onClose: setTutorialSeen,
      steps: [{
         title: 'Tutorial',
         content: 'If you want to view this tutorial in the future, you can find it in the about section.',
         target: isMobile ? 'mobile-show-about' : 'show-about',
         placement: 'bottom',
         xOffset: -bubbleWidth,
         arrowOffset: bubbleWidth - 5,
         nextOnTargetClick: true,
      }]
   }
   setTimeout(() => {hopscotch.startTour(closed)}, 200);
}

