/* Retrieve the data for a recreation area 
*  Display the data to a modal on the web page */

import './recreation.css';
import state from '../state/state';
import sanitize from 'sanitize-html';
import {makeEmojis} from './constants';

var bookMarkItem;
var unsetBookMark;
var addRecToRoute;

function telephoneCheck(strPhone){
  // Check that the value we get is a phone number
    var isPhone = new RegExp(/^\+?1?\s*?\(?\d{3}|\w{3}(?:\)|[-|\s])?\s*?\d{3}|\w{3}[-|\s]?\d{4}|\w{4}$/);
    return isPhone.test(strPhone);
}

// display the data in a modal box
export function retrieveSingleRecArea(recarea) {
    var modalContent = $('#modal1-content');
    modalContent.empty();

    var header = $('<header class="rec-modal-header">');
    modalContent.append(header);

    // The recreation Area Title
    var recNameText = $("<h1 class='rec-modal-title'>").text(recarea.RecAreaName);
    header.append(recNameText);

    //The published phone number of the area
    if(telephoneCheck(recarea.RecAreaPhone)){
        var recPhoneText = $("<a class='rec-modal-phone'>")
        .text(recarea.RecAreaPhone)
        .attr('href', `tel:${recarea.RecAreaPhone}`);
        header.append(recPhoneText);
    }

    var recAreaEmail = $("<a class='rec-modal-email'>")
    .text(recarea.RecAreaEmail)
    .attr('href', `mailto:${recarea.RecAreaEmail}`);
    header.append(recAreaEmail);


    // RecAreaDescription
    var desc = sanitize(recarea.RecAreaDescription, {
        allowedTags: sanitize.defaults.allowedTags.concat([ 'h1', 'h2' ])
    });
    modalContent.append($('<section class="rec-desc-container">').html(desc));

    // Check and see if the link array is empty or not 
    if(recarea.LINK.length){
        var links = $('<section class="rec-modal-links">');
        var linksList = $('<ul>');
        recarea.LINK.forEach(function(link){
            var anchor = $("<a />", {
                href: link.URL,
                text: link.Title,
                target: "_blank",
            })
            linksList.append($('<li>').append(anchor));
        });
        links.append($('<h2>').text('Links'), linksList);
        modalContent.append(links);
    }

    // Append the Activities to the modal
    if(recarea.ACTIVITY.length){
        var activities = $('<section class="rec-modal-activities">');
        activities.append($('<h2>').text('Activities'));
        activities.append(makeEmojis(state, recarea));
        modalContent.append(activities);
    }

    // RECAREAADDRESS
    if(recarea.RECAREAADDRESS.length){
        modalContent.append($('<h2>').text('Location'));

        var addresses = $('<section class="rec-modal-addresses">');
        recarea.RECAREAADDRESS.forEach(function(address){
            var addressDiv = $('<div class="rec-address">');
            var addressType = address.RecAreaAddressType ? address.RecAreaAddressType + ' ' : '';
            addressDiv.append($("<strong>").text(`${addressType}Address:`));

            if(address.RecAreaStreetAddress1){
                addressDiv.append(
                    $("<span class='rec-address-line'>").text(address.RecAreaStreetAddress1)
                );
            }

            if(address.RecAreaStreetAddress2){
                addressDiv.append(
                    $("<span class='rec-address-line'>").text(address.RecAreaStreetAddress2)
                );
            }

            var postalString = '';
            postalString += address.City ? address.City + ', ' : '';
            postalString += address.AddressStateCode? address.AddressStateCode + ' ' : '';
            postalString += address.PostalCode || '';
            if(postalString){
                addressDiv.append(
                    $('<span class="rec-address-line">').text(postalString)
                );
            }
            addresses.append(addressDiv);
        });
        modalContent.append(addresses);
    }


    // Set/Unset the bookmark item
    bookMarkItem = function(){
        if (recarea.bookmarked === false) {
          state.recreation.addBookmark(recarea);
        } else {
            $('#book-mark-btn').text("Unbookmark");           
            state.recreation.removeBookmark(recarea);
        }
    }

        if (recarea.bookmarked === false) {
            $("#book-mark-btn").text("Bookmark");
        } else {
            $('#book-mark-btn').text("Unbookmark");         
        }

   // Need to add a button that adds the recarea to route

    addRecToRoute = function() {
        if(recarea.inRoute === false) {
            state.recreation.addToRoute(recarea);
        } else {
            $('#addToRouteBtn').text("Remove from Route");
            state.recreation.removeFromRoute(recarea);
        }
    }

        if (recarea.inRoute === false) {
            $('#addToRouteBtn').text("Add to Route");
        } else {
            $('#addToRouteBtn').text("Remove from Route");
        }

    // Last step is to open the modal after everything is appended
        $('#modal1').modal('open');

}


$(document).ready(function(){

    $('#modal1').modal();

    $('#book-mark-btn').click(function(e){
        e.preventDefault();
         bookMarkItem();
    });

    // Create button to add a route to the modal footer

        var addToRouteButton = $("<a />", {
            href: "#!",
            text: "Add to Route",
            class: "modal-action modal-close waves-effect btn btn-flat right",
            id: "addToRouteBtn"});

        $('#rec-area-detail-modal-footer').append(addToRouteButton);

    $('#addToRouteBtn').click(function(e){
        e.preventDefault();
        addRecToRoute();
    })
 
 });

