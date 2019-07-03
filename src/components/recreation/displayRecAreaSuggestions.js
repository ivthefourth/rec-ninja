import state from '../state/state';
import {makeEmojis} from './constants';

    function telephoneCheck(strPhone){
      // Check that the value we get is a phone number
      var isPhone = new RegExp(/^\+?1?\s*?\(?\d{3}|\w{3}(?:\)|[-|\s])?\s*?\d{3}|\w{3}[-|\s]?\d{4}|\w{4}$/);
      return isPhone.test(strPhone);
    }

    function makeBookmarkButton(recarea){
        let callback = state.recreation.toggleBookmark.bind(state.recreation, recarea);
        let title;
        let icon = $('<i class="material-icons">')
        if(recarea.bookmarked){
            title = 'remove bookmark';
            icon.text('star');
        }
        else{
            title = 'add bookmark';
            icon.text('star_outline');
        }
        let bookmarkBtn = $('<a href="#!" title="' + title + '" class="rec-bookmark-icon">');
        bookmarkBtn.attr('data-id', recarea.id);
        bookmarkBtn.append(icon);
        bookmarkBtn.click((e) => {
            e.preventDefault();
            callback();
        });
        return bookmarkBtn;
    }

    function makeAddToRouteButton(recarea){
        let callback = state.recreation.toggleInRoute.bind(state.recreation, recarea);
        let title;
        let icon = $('<i class="material-icons">')
        if(recarea.inRoute){
            title = 'remove from route';
            icon.text('remove_circle_outline');
        }
        else{
            title = 'add to route';
            icon.text('add_circle_outline');
        }
        let routeBtn = $('<a href="#!" title="' + title + '" class="rec-route-icon">');
        routeBtn.attr('data-id', recarea.id);
        routeBtn.append(icon);
        routeBtn.click((e) => {
            e.preventDefault();
            callback();
        });
        return routeBtn;
    }

    function makeInfoButton(recarea){
        let callback = recarea.showDetails;
        let title = 'view details';
        let icon = $('<i class="material-icons">').text('info_outline');
        let routeBtn = $('<a href="#!" title="' + title + '" class="rec-info-icon">');
        routeBtn.attr('data-id', recarea.id);
        routeBtn.append(icon);
        routeBtn.click(callback);
        return routeBtn;
    }

    function displayRecAreaSummary(recdata, filteredType) {
        $(filteredType).empty();
        recdata.val.forEach((recarea) => {
            let container = $('<li class="suggestion-summary collection-item">');
            let info = $('<div class="rec-primary-content">')
            let title = $('<a class="title" href="#">').text(recarea.RecAreaName);
            title.click(recarea.showDetails);
            title.attr('title', recarea.RecAreaName);
            info.append(title);
            info.append($('<small class="rec-organization">').text((recarea.ORGANIZATION[0] || {OrgName: '- -'}).OrgName));
            info.append(makeEmojis(state, recarea));
            let buttons = $('<div class="secondary-content rec-buttons">');
            buttons.append(makeInfoButton(recarea));
            buttons.append(makeBookmarkButton(recarea));
            buttons.append(makeAddToRouteButton(recarea));
            container.append(info, buttons);
            container.hover(recarea.highlightMarker, recarea.unHighlightMarker);
            $(filteredType).append(container);
        });


       //  for (var i = 0; i <recdata.val.length; i++) {

       //      var recValAlias = recdata.val[i];

       //      var sugDivClass = $("<li class='suggestionSummary collection-item' id='areaId-" + recValAlias.id + "'>");

       //      var recNameText = $("<strong><li card-title>").text(recValAlias.RecAreaName);

       //      var recPhoneText = $("<li card-content>").text(recValAlias.RecAreaPhone);


       //      if (telephoneCheck(recValAlias.RecAreaPhone) == true){
       //          sugDivClass.append(recNameText, recPhoneText);
       //      } else
       //          sugDivClass.append(recNameText);

       //      //Get both the Title and URL values and create a link tag out of them
       //      // We're only grabbing the first instance of the LINK array
       //      if (recValAlias.LINK[0] != null) {
       //          var recAreaLinkTitle = recValAlias.LINK[0].Title;
       //          var recAreaUrl = recValAlias.LINK[0].URL;
       //          var recAreaLink = $("<a />", {
       //              href: recAreaUrl,
       //              text: recAreaLinkTitle,
       //              target: "_blank"});

       //          var recAreaLinkP = $("<li card-content>").append(recAreaLink);
                
       //          sugDivClass.append(recAreaLinkP);
       //      } else 
       //          sugDivClass.append("<li card-content>");

       //      $(filteredType).append(sugDivClass);

       //      sugDivClass.click(recValAlias.showDetails);
            
       //      sugDivClass.hover(recValAlias.highlightMarker, recValAlias.unHighlightMarker);

       // }

    if (recdata.val.length === 0){  
        var status = state.recreation.status; 
         if (filteredType === "#filtered" && 
            !(status.shouldLoad || status.firstLoad || !status.canLoad)
          ){
            $(filteredType).append("<li id='noneFound' class='center collection-item'>No recreation areas found.</li>");
         } else if (filteredType === "#bookmarked") {
            $(filteredType).append("<li id='no-bookmark' class='center collection-item'>Nothing bookmarked.</li>");
        }
     }
    }


$(document).ready(function(){
        $("#bookmarked").append("<li id='no-bookmark' class='center collection-item'>Nothing bookmarked.</div>");
});

state.recreation.filtered.on("change",  function(recdata){

        var filteredType = "#filtered";
        displayRecAreaSummary(recdata, filteredType);

});
state.recreation.bookmarked.on("change", function(recdata){

        var filteredType = "#bookmarked";
        displayRecAreaSummary(recdata, filteredType);
});
