import './map.css';
import state from '../state/state';
import map from './mapconstant';

const directionsService = new google.maps.DirectionsService();
const directionsDisplay = new google.maps.DirectionsRenderer();


directionsDisplay.setMap(map);
directionsDisplay.setPanel(document.getElementById('directions-container'));

let routeMarkers = [];

state.route.on('change', function(e){
   //remove all markers
   routeMarkers.forEach((m) => {
      m.setMap(null);
   });
   routeMarkers = [];

   // //add new markers
   if(state.route.locationCount === 1){
      directionsDisplay.set('directions', null);
      if(state.route.path[0].data.geometry){
         if(state.route.shouldZoomMap){
            map.fitBounds(e.val[0].data.geometry.viewport);
         }
         addMarker(e.val[0].data.geometry.location, 'route');
         //update route with one location
         state.map.directions.update(e.val[0].data.geometry.location);
      }
      else if(state.route.path[0].data.RecAreaName){
         let coords = new google.maps.LatLng({
            lat: e.val[0].data.RecAreaLatitude,
            lng: e.val[0].data.RecAreaLongitude
         });
         state.map.directions.update(coords);
         map.setCenter(coords);
         if(state.route.shouldZoomMap){
            map.setZoom(8);
         }
         addMarker(coords, 'route');
      }
      else{
         let coords = new google.maps.LatLng({
            lat: e.val[0].data.lat,
            lng: e.val[0].data.lng
         });
         state.map.directions.update(coords);
         map.setCenter(coords);
         if(state.route.shouldZoomMap){
            map.setZoom(8);
         }
         addMarker(coords, 'route');
      }
   }
   else if(state.route.locationCount){
      if(state.route.shouldZoomMap){
         directionsDisplay.set('preserveViewport', false);
      }
      else{
         directionsDisplay.set('preserveViewport', true);
      }
      //get directions
      let request = {
         origin: state.route.origin,
         destination: state.route.destination,
         travelMode: 'DRIVING'
      }
      if(state.route.waypoints)
         request.waypoints = state.route.waypoints;
      directionsService.route(request, function(result, status) {
         if (status == 'OK') {
            if(result.geocoded_waypoints.length === state.route.locationCount){
               state.map.directions.update(result.routes[0]);
               directionsDisplay.setDirections(result);
            }
         }
         else if (status === 'ZERO_RESULTS') {
            Materialize.toast(
               'Can not generate directions for given locations.'
            , 4000);
         }
         else {
            Materialize.toast(
               'Something went wrong.'
            , 4000);
         }
      });
   }
   else{
      state.map.directions.update(null);
   }
   state.route.shouldZoomMap = true;
})

let recAreaMarkers = [];

state.recreation.filtered.on('change', function(e){
   let markerMap = {};
   let newMarkers = [];
   e.val.forEach((r) => {
      if(!r.marker){
         r.addMarker();
         r.marker.setMap(map);
      }
      else if(!r.markerDisplayed){
         r.marker.setMap(map);
      }
      r.markerDisplayed = true;
      markerMap[r.id] = true;
      newMarkers.push(r);
   });

   //remove filtered out markers
   recAreaMarkers.forEach((r) => {
      if(!markerMap[r.id]){
         r.marker.setMap(null);
         r.markerDisplayed = false;
      }
   });
   recAreaMarkers = newMarkers;
});



function addMarker(location, type, area) {
   let kwargs = {
      position: location,
      map: map
   }
   if(type === 'route'){
      kwargs.label = 'A';
   }
   let marker = new google.maps.Marker(kwargs);
   if(area){
      let info = new google.maps.InfoWindow({content: makePreview(area)});
      marker.addListener('mouseover', (e) => {
         info.open(map, marker);
      });
      marker.addListener('mouseout', (e) => {
         info.close();
      });
      marker.addListener('click', area.showDetails);
   }
   if( type === 'rec'){
      recAreaMarkers.push(marker);
   }
   else if(type === 'route'){
      routeMarkers.push(marker);
   }
   else{
      throw new Error('marker type must be either "rec" or "route"');
   }
}

map.addListener('idle', function(){
   state.recreation.filterAll();
})

$(document).ready(function(){
   $('#directions-modal').modal();
   // var directionsBtn = $('<a href="#">')
   // .append($('<i class="material-icons">').text('directions'))
   // .css({
   //    'background-color': '#fff',
   //    color: '#747474',
   //    'border-radius': '2px',
   //    margin: '10px',
   //    padding: '0 3px',
   //    height: '25px',
   //    'line-height': '25px',
   //    'box-shadow': 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px'
   // })
   // .click(function(){
   //    $('#directions-modal').modal('open');
   // });
   // map.controls[google.maps.ControlPosition.TOP_CENTER].push(directionsBtn[0]);

   var slider = $('#radius-slider');
   var circles = [];
   slider.on('mousedown focus', function(){
      //set radius from slider val
      state.recreation.searchRadius = slider.val() * 1609.34;
      let rad = state.recreation.searchRadius;
      var coords = state.map.directions.getCoordsByRadius(rad);
      if(coords){
         coords.forEach((c) => {
            let circle = new google.maps.Circle({
               center: c,
               radius: rad,
               fillColor: 'blue',
               fillOpacity: 0.33,
               strokeColor: 'red',
               strokeOpacity: 0,
               map: map
            });
            circles.push(circle);
         });
      }
   });
   slider.on('mouseup focusout', function(){
      circles.forEach((c) => {
         c.setMap(null);
      })
      circles = [];
      state.recreation.filterAll();
   });
   slider.on('touchend', function(){
      slider.blur();
   })
   slider.on('input', function(){
      circles.forEach((c) => {
         c.setMap(null);
      })
      circles = [];
      state.recreation.searchRadius = slider.val() * 1609.34;
      let rad = state.recreation.searchRadius;
      var coords = state.map.directions.getCoordsByRadius(rad);
      if(coords){
         coords.forEach((c) => {
            let circle = new google.maps.Circle({
               center: c,
               radius: rad,
               fillColor: 'blue',
               fillOpacity: 0.33,
               strokeColor: 'red',
               strokeOpacity: 0,
               map: map
            });
            circles.push(circle);
         });
      }
   });
})

