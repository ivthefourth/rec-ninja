/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__recreation_recAreaDetails__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__recreation_constants__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__map_mapconstant__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__map_distance__ = __webpack_require__(11);





class EventObject{
   constructor(eventsArr){
      let events = this.events = {};
      eventsArr.forEach(function(e){
         //this array will contain callback functions
         events[e] = [];
      });
   }

   //set event listener
   on(event, callback){
      if(this.events[event] == undefined){
         throw new Error(`"${event}" event does not exist on ${this}`)
      }
      else if(typeof callback !== 'function'){
         throw new Error(`Second argument to "${this}.on()" must be a function.`)
      }
      else{
         this.events[event].push(callback);
      }
   }

   //trigger event listeners for given event
   emit(event, prevEvent = {}){
      if(this.events[event] == undefined){
         throw new Error(`"${event}" event does not exist on ${this}`)
      }
      else if(!prevEvent.stopPropagation){
         let callbacks = this.events[event];
         let e = this.makeEvent(event);
         //execute all callbacks
         callbacks.forEach(function(c){
            c(e);
         })
      }
   }

   //provides event object for event listeners; should be overwritten by inheritor
   makeEvent(){
      console.warn(`No makeEvent method set on ${this}`);
   }
}


/*************\    
   Interests    
\*************/
class Interest extends EventObject{
   constructor(interest){
      super(['change']);
      this.name = interest.ActivityName;
      this.id = interest.ActivityID;
      this.iconId = interest.Emoji

      this.selected = false;

      this.eventShouldPropagate = true;

      this.makeEvent = this.makeEvent.bind(this);
      this.toggle = this.toggle.bind(this);
   }
   //toggles selected property
   toggle(){
      this.selected = !this.selected;
      this.emit('change');
   }
   update(selected, stopPropagation){
      this.selected = selected;
      if(stopPropagation)
         this.eventShouldPropagate = false;
      this.emit('change');
      this.eventShouldPropagate = true;
   }
   toString(){
      return "Interest";
   }
   makeEvent(){
      return {
         val: this.selected, 
         stopPropagation: !this.eventShouldPropagate
      };
   }
}

class Interests extends EventObject{
   //list is list of interests, to be provided by recreation module 
   constructor(list){
      super(['change']);
      this.all = list.map(function(i){
         let interest = new Interest(i);
         interest.on('change', this.emit.bind(this, 'change'));
         return interest;
      }.bind(this));

      this.makeEvent = this.makeEvent.bind(this);
   }
   get selected(){
      return this.all.filter(function(i){
         return i.selected;
      });
   }
   toString(){
      return "state.interests";
   }
   makeEvent(){
      return {
         val: {
            all: this.all,
            selected: this.selected
         }
      };
   }
}


/*************\    
     Route    
\*************/
class Location{
   constructor(object){
      if( object.hasOwnProperty('RecAreaName')){
          this.type = 'recarea';
      }
      else if(object.hasOwnProperty('place_id')){
         //google places place... somehow test for google place and 
         //throw error if neither 
         this.type = 'place';
      }
      //maybe remove after dev
      else{
         throw new Error('Provided location is not a PlaceResult or RecArea');
      }
      this.data = object;
   }
}

class Route extends EventObject{
   constructor(){
      super(['change']);
      this.path = [];
      this.shouldZoomMap = true;
   }
   get locationCount(){
      return this.path.length;
   }

   get origin(){
      return this.convertLocationForGoogle(this.path[0]);
   }
   get waypoints(){
      if( this.locationCount < 3){
         return null;
      }
      else{
         return this.path.slice(1, this.locationCount - 1).map((l) => {
            return {
               location: this.convertLocationForGoogle(l),
               stopover: true
            };
         });
      }
   }
   get destination(){
      if( this.locationCount < 2){
         return null;
      }
      else{
         return this.convertLocationForGoogle(
            this.path[this.locationCount - 1]
         );
      }
   }

   convertLocationForGoogle(location){
      if(!location){
         return null;
      }
      else if(location.type === 'place'){
         return {placeId: location.data.place_id};
      }
      else if(location.type === 'recarea'){
         return {
            lat: location.data.RecAreaLatitude,
            lng: location.data.RecAreaLongitude
         }
      }
   }

   add(location, dontEmit){
      if (!(location instanceof Location)){
         location = new Location(location);
      }
      this.path.push(location);
      if( !dontEmit)
         this.emit('change');
   }
   insert(location, index){
      if (!(location instanceof Location)){
         location = new Location(location);
      }
      this.path.splice(index, 0, location);
      this.emit('change');
   }
   remove(index, dontEmit){
      this.path.splice(index, 1);
      if( !dontEmit)
         this.emit('change');
   }
   invert(){
      if( this.locationCount !== 2){
         throw new Error(
            'Can only invert route if route.path contains exactly two locations'
         );
      }
      else{
         this.path.push(this.path.shift());
         this.emit('change');
      }
   }
   setData(arr){
      this.path = arr;
      this.emit('change');
   }

   getLocationObject(location){
      return new Location(location);
   }

   addRecArea(area){
      this.shouldZoomMap = false;
      var areaLocation = new Location(area);
      if( this.locationCount === 0){
         this.add(areaLocation);
      }
      if( this.locationCount <= 1){  
         let origin = this.convertLocationForGoogle(areaLocation);
         let destinations = [this.convertLocationForGoogle(this.path[0])]
         var callback = function(response, status){
            if(status === 'OK'){
               if(response.rows[0].elements[0].status === 'ZERO_RESULTS'){
                  area.setInRoute(false);
                  Materialize.toast(
                     'Could not add recreation area to route. Try adding it manually.'
                  , 4000);
               }
               else{
                  this.add(areaLocation);
               }
            }
            else{
               area.setInRoute(false);
            }
         }.bind(this);
         __WEBPACK_IMPORTED_MODULE_3__map_distance__["a" /* default */].getDistanceMatrix({
            origins: [origin],
            destinations: destinations,
            travelMode: 'DRIVING'
         }, callback);
      }
      else if( this.locationCount === 2){
         if(this.path[1].type === 'place'){
            let origin = this.convertLocationForGoogle(areaLocation);
            let destinations = [this.convertLocationForGoogle(this.path[0])]
            var callback = function(response, status){
               if(status === 'OK'){
                  if(response.rows[0].elements[0].status === 'ZERO_RESULTS'){
                     area.setInRoute(false);
                     Materialize.toast(
                        'Could not add recreation area to route. Try adding it manually.'
                     , 4000);
                  }
                  else{
                     this.insert(areaLocation, 1);
                  }
               }
               else{
                  area.setInRoute(false);
               }
            }.bind(this);
            __WEBPACK_IMPORTED_MODULE_3__map_distance__["a" /* default */].getDistanceMatrix({
               origins: [origin],
               destinations: destinations,
               travelMode: 'DRIVING'
            }, callback);
         }
         else{
            //but what if path[0] is a recreation area??
            let origin = this.convertLocationForGoogle(this.path[0]);
            let destinations = [
               this.convertLocationForGoogle(this.path[1]),
               this.convertLocationForGoogle(areaLocation)
            ]
            var callback = function(response, status){
               if(status === 'OK'){
                  if(response.rows[0].elements[1].status === 'ZERO_RESULTS'){
                     area.setInRoute(false);
                     Materialize.toast(
                        'Could not add recreation area to route. Try adding it manually.'
                     , 4000);
                     return;
                  }
                  if(
                     response.rows[0].elements[0].distance.value >
                     response.rows[0].elements[1].distance.value
                  ){
                     this.insert(areaLocation, 1);
                  }
                  else{
                     this.add(areaLocation);
                  }
               }
               else{
                  area.setInRoute(false);
               }
            }.bind(this);
            __WEBPACK_IMPORTED_MODULE_3__map_distance__["a" /* default */].getDistanceMatrix({
               origins: [origin],
               destinations: destinations,
               travelMode: 'DRIVING'
            }, callback);
         }
      }
      else{
         let destinations = this.path.map((l) => {
            return this.convertLocationForGoogle(l);
         })
         let origin = this.convertLocationForGoogle(areaLocation);
         var callback = function(response, status){
            if(status === 'OK'){
               let arr = response.rows[0].elements;
               let closestIndex = 1;
               if(arr[1].status === 'ZERO_RESULTS'){
                  area.setInRoute(false);
                  Materialize.toast(
                     'Could not add recreation area to route. Try adding it manually.'
                  , 4000)
                  return;
               }
               //find route point this recarea is closest to
               let smallestDistance = arr[1].distance.value;
               for(let i = 1; i < arr.length; i++){
                  if( arr[i].distance.value < smallestDistance){
                     closestIndex = i;
                     smallestDistance = arr[i].distance.value;
                  }
               }
               //if it's closest to the starting location, 
               //insert it right after the starting location
               if(closestIndex === 1){
                  this.insert(areaLocation, 1);
               }
               //otherwise, if it's not closest to the final location...
               else if(closestIndex !== arr.length - 1){
                  //insert it by the location it's closest to
                  //B is closest to R, A is right before B, C is right after B
                  let aToB = response.rows[closestIndex].elements[closestIndex - 1].distance.value;
                  let aToR = arr[closestIndex - 1].distance.value;
                  let rToB = smallestDistance;
                  let bToC = response.rows[closestIndex].elements[closestIndex + 1].distance.value;
                  let bToR = rToB;
                  let rToC = arr[closestIndex + 1].distance.value;
                  if( 
                     aToR + rToB + bToC < aToB + bToR + rToC
                  ){
                     this.insert(areaLocation, closestIndex - 1);
                  }
                  else{
                     this.insert(areaLocation, closestIndex);
                  }
               }
               //otherwise, if it's closest to the last location
               else{
                  //if the last location is a recarea, see if this area
                  //should be between the last and second to last locations
                  //or after the last 
                  if( this.path[this.locationCount - 1].type === 'recarea'){
                     //if the distance between this area and the second to last 
                     //location is less than the distance between the second
                     //to last location and the last location
                     if(
                        arr[arr.length - 2].distance.value < 
                        response.rows[response.rows.length - 2].elements[arr.length - 1].distance.value
                     ){
                        this.insert(areaLocation, closestIndex - 1);
                     }
                     else{
                        this.add(areaLocation);
                     }
                  }
                  //otherwise, insert it before the final destination
                  else{
                     this.insert(areaLocation, this.locationCount - 1);
                  }

               }
            }
            else{
               status === 'MAX_ELEMENTS_EXCEEDED' && Materialize.toast(
                  'Too many locations in route. Try adding it manually.'
               , 4000);
               area.setInRoute(false);
            }
         }.bind(this);
         __WEBPACK_IMPORTED_MODULE_3__map_distance__["a" /* default */].getDistanceMatrix({
            origins: [origin, ...destinations],
            destinations: [origin, ...destinations],
            travelMode: 'DRIVING'
         }, callback);
      }
   }
   removeRecArea(area){
      this.shouldZoomMap = false;
      for(let i = 0; i < this.path.length; i++){
         if(this.path[i].data === area){
            this.remove(i);
            break;
         }
      };
   }

   makeEvent(){
      return {val: this.path}
   }

   toString(){
      return 'state.route';
   }
}

/*************\    
      Map    
\*************/
class Directions extends EventObject{
   constructor(){
      super(['change']);
      //array of coordinates along directions route
      this.routeCoords = [];
      //array of coordinates that will be used for rec api calls
      this.searchCoords = [];
      this.origin = null;
   }

   update(route){
      if(route == null){
         this.routeCoords = [];
         this.searchCoords = [];
         this.origin = null;
      }
      else if(!route.legs){
         this.routeCoords = [route];
         this.searchCoords = [route];
         this.origin = route;
      }
      else{
         this.origin = route.legs[0].start_location;
         this.routeCoords = route.overview_path;

         //route coordinates separated by 100 miles
         this.searchCoords = this.getCoordsByRadius(160934);
         let dist = google.maps.geometry.spherical.computeDistanceBetween(
            this.searchCoords[this.searchCoords.length - 1],
            this.routeCoords[this.routeCoords.length - 1]
         );
         if(dist > 80467.2){
            this.searchCoords.push(this.routeCoords[this.routeCoords.length - 1]);
         }
      }
      this.emit('change');
   }

   getCoordsByRadius(radius){
      if(!this.routeCoords.length) return null;

      return this.routeCoords.reduce((arr, coord) => {
         let distance = google.maps.geometry.spherical.computeDistanceBetween(
            coord, arr[arr.length - 1]); 
         if(distance > radius){
            return arr.concat([coord]);
         }
         else{
            return arr;
         }
      }, [this.origin]);
   }

   makeEvent(){
      return {val: this};
   }
}

class Map{
   constructor(){
      this.directions = new Directions();
   }
   toString(){
      return 'state.map';
   }
}

/**************\    
   Recreation    
\**************/
const requiredProps = [
   'RecAreaName',
   'RECAREAADDRESS',
   'FACILITY',
   'OrgRecAreaID',
   'GEOJSON',
   'LastUpdatedDate',
   'EVENT',
   'ORGANIZATION',
   'RecAreaEmail',
   'RecAreaReservationURL',
   'RecAreaLongitude',
   'RecAreaID',
   'RecAreaPhone',
   'MEDIA',
   'LINK',
   'RecAreaDescription',
   'RecAreaMapURL',
   'RecAreaLatitude',
   'StayLimit',
   'RecAreaFeeDescription',
   'RecAreaDirections',
   'Keywords',
   'ACTIVITY'
];

class RecArea extends EventObject{
   constructor(area){
      super(['bookmarked', 'inroute']);
      this.id = area.RecAreaID;
      this.activities = area.ACTIVITY.map(function(a){ 
         return a.ActivityID; 
      });
      requiredProps.forEach(function(prop){
         this[prop] = area[prop];
      }.bind(this));

      this.bookmarked = false;
      this.inRoute = false;

      this.marker = null;
      this.markerDisplayed = false;
      this.markerHighlighted = false;

      this.on('bookmarked', () => {
         Object(__WEBPACK_IMPORTED_MODULE_1__recreation_constants__["d" /* updateIcons */])('bookmark', this.id, this.bookmarked);
      });
      this.on('inroute', () => {
         Object(__WEBPACK_IMPORTED_MODULE_1__recreation_constants__["d" /* updateIcons */])('route', this.id, this.inRoute);
      });

      this.showDetails = this.showDetails.bind(this);
      this.highlightMarker = this.highlightMarker.bind(this)
      this.unHighlightMarker = this.unHighlightMarker.bind(this)
   }
   showDetails(e){
      if(e && e.preventDefault instanceof Function) 
         e.preventDefault();
      Object(__WEBPACK_IMPORTED_MODULE_0__recreation_recAreaDetails__["a" /* retrieveSingleRecArea */])(this);
   }

   //WARNING: should only set one event listener per RecArea
   //that updates all of a certain element with data matching
   //the RecArea to avoid memory leaks and issues with removed elements 
   setBookmarked(/*boolean*/ value){
      this.bookmarked = value;
      this.emit('bookmarked');
      if(!value){
         this.unHighlightMarker();
      }
   }
   setInRoute(/*boolean*/ value){
      this.inRoute = value;
      if(this.marker){
         this.marker.setVisible(!value);
      }
      this.emit('inroute');
   }
   //setFocus > change

   highlightMarker(){
      if(this.marker && !this.markerHighlighted){
         this.marker.setAnimation(google.maps.Animation.BOUNCE);
         this.markerHighlighted = true;
         if(this.inRoute){
            this.marker.setVisible(true);
         }
      }
   }
   unHighlightMarker(){
      if(this.marker && this.markerHighlighted){
         this.marker.setAnimation(null);
         this.markerHighlighted = false;
         if(this.inRoute){
            this.marker.setVisible(false);
         }
      }
   }

   addMarker(){
      let latLng = {
         lat: this.RecAreaLatitude,
         lng: this.RecAreaLongitude
      };
      this.marker = new google.maps.Marker({
         position: latLng,
         map: __WEBPACK_IMPORTED_MODULE_2__map_mapconstant__["a" /* default */]
      });
      let info = new google.maps.InfoWindow({
         content: this.makeMapPreview()
      });
      this.marker.addListener('mouseover', (e) => {
         info.open(__WEBPACK_IMPORTED_MODULE_2__map_mapconstant__["a" /* default */], this.marker);
      });
      this.marker.addListener('mouseout', (e) => {
         info.close();
      });
      this.marker.addListener('click', this.showDetails);
   }

   makeMapPreview(){
      return `
      <strong>${this.RecAreaName}</strong>
      `
   }

   makeEvent(event){
      //console.warn(event);
   }
   toString(){
      return 'RecArea';
   }
}

class RecAreaCollection extends EventObject{
   constructor(name){
      super(['change']);
      this.name = name;

      //array of "RecArea"s 
      this.RECDATA = [];

      //hash map like storage of which rec areas are currently 
      //in this collection (by id)
      this.idMap = {};
   }

   addData(recdata){
      let change = false;
      if( !(recdata instanceof Array)){
         if( !(recdata instanceof RecArea) ){
            recdata = new RecArea(recdata);
         }
         recdata = [recdata];
      }
      recdata.forEach(function(area){
         if(!this.idMap[area.id]){
            change = true;
            this.RECDATA.push(area);
            this.idMap[area.id] = true;
         }
      }.bind(this));
      if(change){
         this.emit('change');
      }
   }
   setData(recdata){
      this.idMap = {};
      this.RECDATA = [];
      if( !(recdata instanceof Array)){
         recdata = [recdata];
      }
      recdata.forEach(function(area){
         this.RECDATA.push(area);
         this.idMap[area.id] = true;
      }.bind(this));
      this.emit('change');
   }
   //change to allow an array or something?
   remove(area){
      if(this.idMap[area.id]){
         this.RECDATA.splice(this.RECDATA.indexOf(area), 1);
         delete this.idMap[area.id];
         this.emit('change');
      }
   }

   makeEvent(){
      return {val: this.RECDATA}
   }
   toString(){
      return `state.recreation.${this.name}`;
   }
}

class RecStatus extends EventObject{
   constructor(){
      super(['change', 'percent']);
      this.loading = false;
      this.percentLoaded = 100;
      this.shouldLoad = false;
      this.canLoad = false;
      this.firstLoad = true;

      this.loadedActivities = {};
      this.filteredActivities = {};

      this.loadedSearchCoords = [];
      //if the route changes, this should be true.
      this.shouldResetLoadedActivities = false;
      this.shouldResetLoadedCoords = false;
   }
   update({loading, percentLoaded, shouldLoad, canLoad, firstLoad} = {}){
      let change = false;
      if(loading !== undefined && loading !== this.loading){
         this.loading = loading;
         change = true;
      }
      if(shouldLoad !== undefined && shouldLoad !== this.shouldLoad){
         this.shouldLoad = shouldLoad;
         change = true;
      }
      if(canLoad !== undefined && canLoad !== this.canLoad){
         this.canLoad = canLoad;
         change = true;
      }
      if(firstLoad !== undefined && firstLoad !== this.firstLoad){
         this.firstLoad = firstLoad;
         change = true;
      }
      if(change){
         this.emit('change');
      }
      if(percentLoaded !== undefined && percentLoaded !== this.percentLoaded){
         this.percentLoaded = percentLoaded;
         this.emit('percent');
      }
   }

   makeEvent(){
      return {val: {
         loading: this.loading,
         percentLoaded: this.percentLoaded,
         shouldLoad: this.shouldLoad,
         firstLoad: this.firstLoad,
         canLoad: this.canLoad
      }};
   }

   toString(){
      return 'state.recreation.status';
   }
}

class Recreation{
   constructor(){
      this.all = new RecAreaCollection('all');
      this.filtered = new RecAreaCollection('filtered');
      this.bookmarked = new RecAreaCollection('bookmarked');
      //this.inRoute = new RecAreaCollection('inRoute');

      //searchRadius in meters
      this.searchRadius = 80467.2;

      this.apiCall = __WEBPACK_IMPORTED_MODULE_1__recreation_constants__["c" /* recApiQuery */];

      this.status = new RecStatus;
      this.search = this.search.bind(this);
      this.filterAll = this.filterAll.bind(this);
   }
   addRecAreas(recdata){
      var data = recdata.reduce(function(arr, area){
         let temp = [];
         if( !this.all.idMap[area.RecAreaID] ){
            temp.push(new RecArea(area));
         }
         return arr.concat(temp);
      }.bind(this), []);
      this.all.addData(data);
   }

   addBookmark(area){
      if(!this.bookmarked.idMap[area.id]){
         area.setBookmarked(true);
         this.bookmarked.addData(area);
      }
   }
   removeBookmark(area){
      if(this.bookmarked.idMap[area.id]){
         area.setBookmarked(false);
         this.bookmarked.remove(area);
      }
   }
   toggleBookmark(area){
      if(area.bookmarked){
         this.removeBookmark(area);
         Materialize.toast('Bookmark removed!', 1000);
      }
      else{
         this.addBookmark(area);
         Materialize.toast('Bookmark added!', 1000);
      }
   }
   addToRoute(area){
      if(!area.inRoute){
         area.setInRoute(true);
         state.route.addRecArea(area);
      }
      //else could show toast saying it's already in route 
   }
   removeFromRoute(area){
      if(area.inRoute){
         area.setInRoute(false);
         state.route.removeRecArea(area);
      }
   }
   toggleInRoute(area){
      if(area.inRoute){
         this.removeFromRoute(area);
         if(!area.inRoute) Materialize.toast('Removed from Route!', 1000);
      }
      else{
         this.addToRoute(area);
         if(area.inRoute) Materialize.toast('Added to Route!', 1000);
      }
   }

   //sends api request(s) 
   search(){
      var requestCount = 0;
      if(this.status.shouldResetLoadedActivities){
         this.status.loadedActivities = {};
         this.status.shouldResetLoadedActivities = false;
         //clear this.all???
      }
      if(this.status.shouldResetLoadedCoords){
         this.status.shouldResetLoadedCoords = false;
         //clear this.all???
      }
      this.status.loadedSearchCoords = state.map.directions.searchCoords;

      var loaded = this.status.loadedActivities;
      var interests = state.interests.selected.reduce((idString, interest) => {
         //if we've already loaded recareas with this activity, don't add to activities
         if(loaded[interest.id]){
            return idString;
         }
         //otherwise, we will load it and keep track
         else{
            loaded[interest.id] = true;
            this.status.filteredActivities[interest.id] = true;
         }

         if( idString.length)
            return idString + ',' + interest.id;
         else
            return idString + interest.id;
      }, '');


      var callback = function(response){
         this.addRecAreas(response.RECDATA);
         requestCount -= 1;
         if(requestCount === 0 ){
            this.status.update({loading: false});
            this.filterAll(true);
         }
      }.bind(this);

      //temporary... eventually change to along route
      state.map.directions.searchCoords.forEach((l) => {
         requestCount += 1;
         this.apiCall(
            l.lat(),
            l.lng(),
            100,
            interests,
            callback
         );
      });

      this.status.update({shouldLoad: false, loading: true, firstLoad: false});
   }

   filterAll(fitMap){
      const mapBounds = __WEBPACK_IMPORTED_MODULE_2__map_mapconstant__["a" /* default */].getBounds();
      let markerBounds = new google.maps.LatLngBounds();
      markerBounds.extend(mapBounds.getNorthEast());
      markerBounds.extend(mapBounds.getSouthWest());
      var data;
      if(!state.interests.selected.length){
         data = [];
      }
      else if(!state.route.locationCount){
         data = [];
      }
      else{
         data = this.all.RECDATA;
      }
      const filterCoords = state.map.directions.getCoordsByRadius(this.searchRadius);
      data = data.filter((area) => {
         var coord = new google.maps.LatLng({
            lat: area.RecAreaLatitude,
            lng: area.RecAreaLongitude
         });

         //if it's not a new load, filter based on map viewport
         if(!fitMap && !mapBounds.contains(coord)) {
            return false;
         }

         //filter based on proximity to route
         var isAlongRoute = false;
         for(let i = 0; i < filterCoords.length; i++){
            let distance = google.maps.geometry.spherical.computeDistanceBetween(
               filterCoords[i], coord);
            if( distance < this.searchRadius){
               isAlongRoute = true;
               break;
            }
         }
         if(!isAlongRoute) {
            return false;
         }


         //filter based on selected activities
         var hasActivity = false;
         for( let i = 0; i < area.activities.length; i++){
            let activity = area.activities[i];
            if(state.recreation.status.filteredActivities[activity]){
               hasActivity = true;
               break;
            }
         }
         if(!hasActivity) {
            return false;
         }

         markerBounds.extend(coord);
         return true;
      })

      this.filtered.setData(data);

      //if the filter is due to new load, and there are points,
      //and the bounds to contain these points are larger than the 
      //current viewport, change the map viewport to show everything
      if(fitMap && data.length){
         if( markerBounds.equals(mapBounds) )
            __WEBPACK_IMPORTED_MODULE_2__map_mapconstant__["a" /* default */].fitBounds(markerBounds, 0);
         else
            __WEBPACK_IMPORTED_MODULE_2__map_mapconstant__["a" /* default */].fitBounds(markerBounds);
      }
   }

   toString(){
      return 'state.recreation';
   }
}

/*************\    
 Overall State
\*************/
class State extends EventObject{
   constructor(){
      super(['ready']);
      this.recreation = new Recreation();
      this.route = new Route();
      this.interests = new Interests(__WEBPACK_IMPORTED_MODULE_1__recreation_constants__["a" /* interestList */]);
      this.map = new Map();
   }
   
   //refactor this, use export and import from a separate file (not recreation.js)
   // setInterests(list){
   //    this.interests = new Interests(list);
   // }
   toString(){
      return 'state';
   }
   makeEvent(){
      return {val: null};
   }
}

const state = new State;


/* harmony default export */ __webpack_exports__["a"] = (state);




/***/ }),
/* 1 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(10);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(9);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(2)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./recreation.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./recreation.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = retrieveSingleRecArea;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__recreation_css__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__recreation_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__recreation_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);
/* Retrieve the data for a recreation area 
*  Display the data to a modal on the web page */




var bookMarkItem;
var unsetBookMark;
var addRecToRoute;

// display the data in a modal box
function retrieveSingleRecArea(recarea) {
    $('#modal1-content').empty();
    // retrieve the data using recAreaId

    // The recreation Area Title
    var recNameText = $("<div id='recNameModal'>").text(recarea.RecAreaName);

    //The published phone number of the area
    var recPhoneText = $("<div id='recPhoneModal'>").text(recarea.RecAreaPhone);

    var recAreaEmail = $("<div id='recEmailModal'>").text(recarea.RecAreaEmail);

    // Check and see if the link array is empty or not 
    if (recarea.LINK[0] != null) {
        var recAreaLinkTitle = recarea.LINK[0].Title;
        var recAreaUrl = recarea.LINK[0].URL;
        var recAreaLink = $("<a />", {
            href: recAreaUrl,
            text: recAreaLinkTitle,
            target: "_blank",
            id: "recUrlModal"});
    }

            function telephoneCheck(strPhone){
              // Check that the value we get is a phone number
                var isPhone = new RegExp(/^\+?1?\s*?\(?\d{3}|\w{3}(?:\)|[-|\s])?\s*?\d{3}|\w{3}[-|\s]?\d{4}|\w{4}$/);
                return isPhone.test(strPhone);
            }

    // Append the details of the recarea to the modal
    // Checks whether a phone number matches a pattern before appending to the modal
    if (telephoneCheck(recarea.RecAreaPhone) == true){    
        $('#modal1-content').append(recNameText,recPhoneText,recAreaEmail,recAreaLink);
    } else
        $('#modal1-content').append(recNameText,recAreaEmail,recAreaLink);

    // RecAreaDescription

    $('#modal1-content').append(`<strong><div id='descModal'>Description:</strong> ${recarea.RecAreaDescription}`);

    // Append the Activities to the modal
    $('#modal1-content').append("<strong><div id='activityModalHead' class='collection-header'>Activities</div>");
    recarea.ACTIVITY.forEach(function(activity){
        $('#modal1-content').append("<ul>");
        $('#modal1-content').append("<li id='activityTypeModal'>" + activity.ActivityName);
    })

    // RECAREAADDRESS
    recarea.RECAREAADDRESS.forEach(function(address){
        $('#modal1-content').append("<strong><div id='addressHeadModal'>Address");
        $('#modal1-content').append("<div class='addressModal'>" + address.RecAreaStreetAddress1);
        $('#modal1-content').append("<div class='addressModal'>" + address.RecAreaStreetAddress2);
        $('#modal1-content').append(`<div class='addressModal'> ${address.City}, ${address.AddressStateCode} ${address.PostalCode}`);
    })


    // Set/Unset the bookmark item
    bookMarkItem = function(){
        if (recarea.bookmarked === false) {
          __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.addBookmark(recarea);
        } else {
            $('#book-mark-btn').text("Unbookmark");           
            __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.removeBookmark(recarea);
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
            __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.addToRoute(recarea);
        } else {
            $('#addToRouteBtn').text("Remove from Route");
            __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.removeFromRoute(recarea);
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

    $('#book-mark-btn').click(function(){
         bookMarkItem();
    });

    // Create button to add a route to the modal footer

        var addToRouteButton = $("<a />", {
            href: "#!",
            text: "Add to Route",
            class: "modal-action modal-close waves-effect btn btn-flat right",
            id: "addToRouteBtn"});

        $('#rec-area-detail-modal-footer').append(addToRouteButton);

    $('#addToRouteBtn').click(function(){
        addRecToRoute();
    })
 
 });



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return interestList; });
/* harmony export (immutable) */ __webpack_exports__["d"] = updateIcons;
/* harmony export (immutable) */ __webpack_exports__["c"] = recApiQuery;
/* harmony export (immutable) */ __webpack_exports__["b"] = recApiById;
var interestList = [
    {"ActivityName": "BIKING",
     "ActivityID": 5,
     "Emoji": "🚴"
    },
    {"ActivityName": "CLIMBING",
     "ActivityID": 7,
     "Emoji": "A"
    },
    {"ActivityName": "CAMPING",
     "ActivityID": 9,
     "Emoji": "A"
     },
     {"ActivityName": "HIKING",
      "ActivityID": 14,
      "Emoji": "A"
    },
    {"ActivityName": "PICNICKING",
      "ActivityID": 20,
      "Emoji": "A"
     },
     {"ActivityName": "RECREATIONAL VEHICLES",
      "ActivityID": 23,
      "Emoji": "A"
     },
     {"ActivityName": "VISITOR CENTER",
      "ActivityID": 24,
      "Emoji": "A"
    },
    {"ActivityName": "WATER SPORTS",
     "ActivityID": 25,
     "Emoji": "A"
    },
    {"ActivityName": "WILDLIFE VIEWING",
     "ActivityID": 26,
     "Emoji": "A"
    },
    {"ActivityName": "HORSEBACK RIDING",
     "ActivityID": 15,
     "Emoji": "A"
    }

]

//type is 'route' or 'bookmark'
function updateIcons(type, id, value) {
    let btns = $(`.rec-${type}-icon[data-id="${id}"]`);
    if(type === 'route'){
        if(value){
            btns.attr('title', 'remove from route');
            btns.children().text('remove_circle_outline');
        }
        else{
            btns.attr('title', 'add to route');
            btns.children().text('add_circle_outline');
        }
    }
    else if( type === 'bookmark'){
        if(value){
            btns.attr('title', 'remove bookmark');
            btns.children().text('star');
        }
        else{
            btns.attr('title', 'add bookmark');
            btns.children().text('star_outline');
        }
    }
}


function recApiQuery(latitudeVal,longitudeVal,radiusVal,activityVal,callback) {

    var recQueryURL = "https://ridb.recreation.gov/api/v1/recareas.json?apikey=2C1B2AC69E1945DE815B69BBCC9C7B19&full&latitude="
    + latitudeVal + "&longitude=" + longitudeVal + "&radius=" + radiusVal + "&activity=" + activityVal;

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}

function recApiById(id, callback) {

    var recQueryURL = "https://ridb.recreation.gov/api/v1/recareas/" + id + ".json?apikey=2C1B2AC69E1945DE815B69BBCC9C7B19&full"

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const map = new google.maps.Map(document.getElementById('map'), {
  center: {lat: 39.7642548, lng: -104.9951937},
  zoom: 5,
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  gestureHandling: 'greedy'
});

/* harmony default export */ __webpack_exports__["a"] = (map);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_recreation_recreation__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_recreation_loadButton__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_interests_interests__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_layout_layout__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_map_map__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__components_route_route__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__components_localstorage_localstorage__ = __webpack_require__(26);









/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__recreation_css__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__recreation_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__recreation_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__displayRecAreaSuggestions__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__recAreaDetails__ = __webpack_require__(4);





$(document).ready(function() {
   $('#mobile-find-rec').click(function(e) {
      e.preventDefault();
      $(this).blur();
      let status = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.status;
      if(status.canLoad && status.shouldLoad){
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.search();
      }
   });
   $('#find-rec').click(function(e) {
      e.preventDefault();
      $(this).blur();
      let status = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.status;
      if(status.canLoad && status.shouldLoad){
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.search();
      }
   });
})


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, "#filtered-container .collection, #bookmarked.collection{\n   border-right: none;\n   border-left: none;\n}\n\n.suggestion-summary{\n   overflow: hidden;\n}\n\n.suggestion-summary .title{\n   line-height: 1;\n   margin-top: 0.5em;\n   overflow: hidden;\n   white-space: nowrap;\n   text-overflow: ellipsis;\n   width: 100%;\n   display: inline-block;\n   font-size: 1.1em;\n   color: rgba(0,0,0,0.87);\n}\n\n.suggestion-summary .rec-emojis{\n   width: 100%;\n   display: inline-block;\n}\n\n.suggestion-summary .rec-primary-content{\n   float: left;\n   width: calc(100% - 40px);\n}\n\n.rec-buttons{\n   width: 24px;\n}\n.rec-buttons a:last-child i{\n   vertical-align: middle;\n}\n\n.rec-navload-disabled{\n   cursor: default;\n   pointer-events: none;\n}", ""]);

// exports


/***/ }),
/* 10 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var service = new google.maps.DistanceMatrixService();
/* harmony default export */ __webpack_exports__["a"] = (service);


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__state_state__ = __webpack_require__(0);


    function telephoneCheck(strPhone){
      // Check that the value we get is a phone number
      var isPhone = new RegExp(/^\+?1?\s*?\(?\d{3}|\w{3}(?:\)|[-|\s])?\s*?\d{3}|\w{3}[-|\s]?\d{4}|\w{4}$/);
      return isPhone.test(strPhone);
    }

    function makeBookmarkButton(recarea){
        let callback = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.toggleBookmark.bind(__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation, recarea);
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
        let callback = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.toggleInRoute.bind(__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation, recarea);
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
            info.append($('<small class="rec-organization">').text(recarea.ORGANIZATION[0].OrgName));
            info.append($('<span class="rec-emojis">').text('emojis go here'));
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
         if (filteredType === "#filtered"){
            $(filteredType).append("<li id='noneFound' class='center collection-item'>No recreation areas found.</li>");
         } else if (filteredType === "#bookmarked") {
            $(filteredType).append("<li id='no-bookmark' class='center collection-item'>Nothing bookmarked.</li>");
        }
     }
    }


$(document).ready(function(){
        $("#bookmarked").append("<li id='no-bookmark' class='center collection-item'>Nothing bookmarked.</div>");
});

__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.filtered.on("change",  function(recdata){

        var filteredType = "#filtered";
        displayRecAreaSummary(recdata, filteredType);

});
__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.bookmarked.on("change", function(recdata){

        var filteredType = "#bookmarked";
        displayRecAreaSummary(recdata, filteredType);
});


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__state_state__ = __webpack_require__(0);


let currentTimerId;

function setButtonStatus(canLoad){
   if(canLoad){
      $('#mobile-find-rec').removeClass('rec-navload-disabled');
      $('#mobile-find-rec i').removeClass('blue-grey-text text-darken-2');
      $('#mobile-find-rec').attr('tabindex', 0);

      $('#find-rec').addClass('pulse').attr('disabled', false);
      $('#find-rec').attr('tabindex', 0);
      clearTimeout(currentTimerId);
      currentTimerId = setTimeout(() => {$('#find-rec').removeClass('pulse')}, 10000);
   }
   else{
      $('#mobile-find-rec').addClass('rec-navload-disabled');
      $('#mobile-find-rec i').addClass('blue-grey-text text-darken-2');
      $('#mobile-find-rec').attr('tabindex', -1);

      $('#find-rec').removeClass('pulse').attr('disabled', true);
      $('#find-rec').attr('tabindex', -1);
      clearTimeout(currentTimerId);
   }
}

function showButton(status) {
   var container = $('#button-container');
   var text;
   var btn = $('<button class="btn center">')
      .text('Find Recreation')
      .click(__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.search)
      .css({
         display: 'block',
         margin: '0 auto'
      });
   var icon = $('<i class="material-icons pink-text text-accent3"></i>').text('warning');

   var noInterest = !__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.selected.length;
   var noLocation = !__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.locationCount;
   if(status.val.firstLoad && noInterest && noLocation){
      text = 'Select some interests and choose at least one location to get started';
      btn.attr('disabled', true);
      setButtonStatus(false);
   }
   else if(status.val.firstLoad && noInterest){
      text = 'Select at least one interest to get started';
      btn.attr('disabled', true);
      setButtonStatus(false);
   }
   else if(status.val.firstLoad && noLocation){
      text = 'Select at least one location to get started';
      btn.attr('disabled', true);
      setButtonStatus(false);
   }
   else if(status.val.firstLoad){
      text = 'Click the button to get started'
      icon = null;
      setButtonStatus(true);
      btn.addClass('pulse');
      setTimeout(function(){
         btn.removeClass('pulse');
      }, 500);
   }
   else if(noInterest){
      text = 'Select at least one interest to search for recreation areas';
      btn.attr('disabled', true);
      setButtonStatus(false);
   }
   else if(noLocation){
      text = 'Select at least one location to search for recreation areas';
      btn.attr('disabled', true);
      setButtonStatus(false);
   }
   else{
      text = 'New recreation areas may be available.'
      icon = null;
      setButtonStatus(true);
      btn.addClass('pulse');
      setTimeout(function(){
         btn.removeClass('pulse');
      }, 500);
   }

   container.empty();
   if( status.val.shouldLoad || status.val.firstLoad || !status.val.canLoad){
      container.append($('<p>').text(text).prepend(icon), btn);
      $('#layout-loading-areas').hide();
   }
   else if(status.val.loading){
      setButtonStatus(false);
      $('#layout-loading-areas').show();
      text = 'Loading recreation areas…'
      container.append($('<p>').text(text), 
         `<div class="preloader-wrapper big active">
             <div class="spinner-layer spinner-blue-only">
               <div class="circle-clipper left">
                 <div class="circle"></div>
               </div><div class="gap-patch">
                 <div class="circle"></div>
               </div><div class="circle-clipper right">
                 <div class="circle"></div>
               </div>
             </div>
           </div>`);
   }
   else{
      setButtonStatus(false);
      $('#layout-loading-areas').hide();
   }
}

__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.on('change', function(e){
   var loaded = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.loadedActivities;
   var filtered = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.filteredActivities;
   var shouldLoad = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.shouldResetLoadedActivities;
   var shouldFilter = false;
   var resetCoords = false;
   e.val.all.forEach((interest) => {
      if(!loaded[interest.id] && interest.selected){
         shouldLoad = true;
         resetCoords = true;
      }
      if(interest.selected !== filtered[interest.id]){
         shouldFilter = true;
         filtered[interest.id] = interest.selected;
      }
   });
   var canLoad = !!e.val.selected.length && !!__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.locationCount;
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.shouldResetLoadedCoords = resetCoords;
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.update({shouldLoad: shouldLoad, canLoad: canLoad});
   if( shouldFilter){
      __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.filterAll();
   }
});

//returns true if the area of A is (mostly) contained in the area of B
function isContained(arrA, radA, arrB, radB){
   let allContained = true;
   for (let i = 0; i < arrA.length && allContained; i++){
      let currentContained = false;
      for( let j = 0; j < arrB.length && !currentContained; j++){
         let distance = google.maps.geometry.spherical.computeDistanceBetween(
            arrA[i], arrB[j]);
         if(distance <= radB - radA){
            currentContained = true;
         }
         if(!currentContained && j < arrB.length - 1){
            let d1 = distance;
            let d2 = google.maps.geometry.spherical.computeDistanceBetween(
            arrA[i], arrB[j + 1]);
            currentContained = d1 < radB && d2 < radB;
         }
      }
      allContained = currentContained;
   }
   return allContained;
}

__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].map.directions.on('change', function(e){
   //make this constant 50 miles!
   var radius = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.searchRadius;
   var loadedSearchCoords = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.loadedSearchCoords;
   var newRouteCoords = e.val.getCoordsByRadius(radius);
   var shouldLoad = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.shouldResetLoadedCoords;
   var shouldFilter = true;
   var resetActivities = false;

   //if there is no location given
   if(newRouteCoords == null){
      //do nothing;
   }
   //if nothing has been loaded
   else if(!loadedSearchCoords.length){
      shouldLoad = true;
      resetActivities = true;
   }
   else{
      let newArea = !isContained(newRouteCoords, radius, loadedSearchCoords, 160934);
      shouldLoad = newArea || shouldLoad;
      resetActivities = newArea;
   }

   var canLoad = !!__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.locationCount && !!__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.selected.length;
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.shouldResetLoadedActivities = resetActivities;

   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.update({shouldLoad: shouldLoad, canLoad: canLoad});
   if( shouldFilter){
      __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.filterAll();
   }
});

// //might have to wait for directions to come back and be processed...
// state.route.on('change', function(e){
//    state.recreation.status.shouldResetLoadedActivities = true;
//    var shouldLoad = !!e.val.length;
//    var canLoad = !!e.val.length && !!state.interests.selected.length;
//    state.recreation.status.update({shouldLoad: shouldLoad, canLoad: canLoad});
// })

$(document).ready(() => showButton(__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.makeEvent()));
__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.status.on('change', showButton);


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__interests_css__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__interests_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__interests_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);



    
   
 function addChip() {
   for (let i = 0; i < __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.all.length; i++) {
      
      let newChip = $('<a class="chip center" href="#"></a>');
      $("#unselected-interests").append(newChip.text(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.all[i].name));
      
      $(newChip).click(function(e) {
         e.preventDefault();
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.all[i].toggle();
      });
   __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.all[i].on('change', function(e) {
      
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

__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.on('change', (e) => {
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
   
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.selected.forEach(function(clear) {
         clear.update(false, true);
      });
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].interests.emit('change');
   });
})


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(16);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(2)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./interests.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./interests.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, ".interests-chips-container .chip{\n   width: calc(50% - 5px);\n   overflow: hidden;\n}\n\n#interests h3{\n   font-size: 1rem;\n}\n\n#interests h3:first-child{\n   margin-top: 0.5rem;\n   margin-bottom: 0;\n}", ""]);

// exports


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__layout_css__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__layout_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__layout_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);



__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.on('change', function(e){
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

	$('#tutorial-modal').modal();


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

//this should be refactored to not be so hideous and repetitive
function largeShow(className, clickedFromCollapse){
   let body = $('body').first();
   if(
      clickedFromCollapse &&
      body.hasClass('layout-show-interests') && 
      body.hasClass('layout-show-route')
   ){
      body.removeClass(className);
      if(className === 'layout-show-route'){
         timerIds.routeVisibility = setTimeout(() => {
            body.removeClass('layout-route-visible');
         }, 500);
      }
      else if(className === 'layout-show-interests'){
         timerIds.interestsVisibility = setTimeout(() => {
            body.removeClass('layout-interests-visible');
         }, 500);
      }
      return;
   }
   else if(clickedFromCollapse && !body.hasClass(className)){
      body.addClass(className);
      if(className === 'layout-show-route'){
         body.addClass('layout-route-visible');
         clearTimeout(timerIds.routeVisibility);
      }
      else if(className === 'layout-show-interests'){
         body.addClass('layout-interests-visible');
         clearTimeout(timerIds.interestsVisibility);
      }
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
         if(className === 'layout-show-route'){
            timerIds.routeVisibility = setTimeout(() => {
               body.removeClass('layout-route-visible');
            }, 500);
         }
         else if(className === 'layout-show-interests'){
            timerIds.interestsVisibility = setTimeout(() => {
               body.removeClass('layout-interests-visible');
            }, 500);
         }
      }
      //else if neither is open
      else if(!body.hasClass('layout-left-sb-open')){
         //open sidebar and show selected 
         clearTimeout(timerIds.leftSideBar);
         body.removeClass('layout-show-interests layout-show-route');
         body.addClass('layout-left-sb-visible layout-left-sb-open');
         body.addClass(className);
         if(className === 'layout-show-route'){
            body.addClass('layout-route-visible');
            clearTimeout(timerIds.routeVisibility);
         }
         else if(className === 'layout-show-interests'){
            body.addClass('layout-interests-visible');
            clearTimeout(timerIds.interestsVisibility);
         }
         setTimeout(() => {body.addClass('layout-left-height-should-animate')}, 1);
      }
      //else if the selected is not open
      else if (!body.hasClass(className)){
         //close the unselected and open selected
         body.addClass(className);
         if(className === 'layout-show-route'){
            body.addClass('layout-route-visible');
            clearTimeout(timerIds.routeVisibility);
         }
         else if(className === 'layout-show-interests'){
            body.addClass('layout-interests-visible');
            clearTimeout(timerIds.interestsVisibility);
         }
         if(className === 'layout-show-interests'){
            body.removeClass('layout-show-route');
            timerIds.routeVisibility = setTimeout(() => {
               body.removeClass('layout-route-visible');
            }, 500);
         }
         else{
            body.removeClass('layout-show-interests');
            timerIds.interestsVisibility = setTimeout(() => {
               body.removeClass('layout-interests-visible');
            }, 500);
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
         if(className === 'layout-show-route'){
            timerIds.routeVisibility = setTimeout(() => {
               body.removeClass('layout-route-visible');
            }, 500);
         }
         else if(className === 'layout-show-interests'){
            timerIds.interestsVisibility = setTimeout(() => {
               body.removeClass('layout-interests-visible');
            }, 500);
         }
      }
   }
   //Note: side bar open class should allow heights to animate?
}






/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(19);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(2)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./layout.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./layout.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, "/*fix for weird safari overflow*/\n.chip{\n   white-space: nowrap;\n   text-overflow: ellipsis;\n}\n\n.layout-header-menu .btn-floating:focus, \n.layout-footer-menu .btn-floating:focus,\n.layout-header-menu .btn-floating:hover, \n.layout-footer-menu .btn-floating:hover{\n   transform: scale(1.2);\n}\n\n\n#layout-loading-areas{\n   margin: 0;\n   z-index: 2;\n}\n\n.layout-sug-tabs, .layout-container-header{\n   z-index: 3;\n   position: relative;\n}\n\nbody{\n   opacity: 1;\n   width: 100vw;\n   height: 100vh;\n   overflow: hidden;\n}\n\n@media screen and (min-width: 993px){\n   .layout-logo{\n      left: 0.5rem;\n   }\n}\n\n.layout-menu-options--footer{\n   display: inline-block;\n}\n\n\n.layout-footer-menu, .layout-header-menu{\n   z-index: 10;\n   position: relative;\n}\n\n.layout-footer-menu{\n   position: fixed;\n   bottom: 0;\n}\n\n#map, .layout-container{\n   position: absolute;\n   top: 56px;\n   width: 100%;\n   height: calc(100vh - 112px);\n   z-index: 0;\n   background-color: #fff;\n\n   visibility: hidden;\n   opacity: 0;\n}\n.layout-container{\n   overflow-y: hidden;\n}\n.layout-shown-mobile, #map.layout-shown-mobile{\n   z-index: 2;\n   visibility: visible;\n   opacity: 1;\n}\n\n.layout-container-header{\n   display: flex;\n   line-height: 1.5;\n   padding: 1rem;\n   background-color: #fff;\n   border-bottom: 1px solid #ddd;\n   overflow: hidden;\n}\n.layout-container-header h2{\n   font-size: 1.5rem;\n   display: inline-block;\n   margin: 0;\n   width: 100%;\n}\n.layout-container-header h2 a{\n   float: right;\n   visibility: hidden;\n}\n\n.layout-container-header i{\n   vertical-align: middle;\n}\n\n.layout-container .layout-container-body{\n   height: calc(100vh - 165px);\n   overflow-y: auto;\n   overflow-x: hidden;\n   padding-bottom: 40px;\n   padding-top: 20px;\n}\n\n.layout-suggestion-list{\n   height: calc(100vh - 213px);\n   overflow-y: auto;\n   padding-bottom: 40px;\n   padding-top: 20px;\n}\n\n.layout-scroll-top{\n   pointer-events: none;\n   z-index: 2;\n   top: 53px;\n   position: absolute;\n   width: calc(100% - 0.75rem);\n   background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%,rgba(255, 255, 255, 0.5) 60%,rgba(255,255,255,0) 100%);\n   height: 20px;\n}\n.layout-scroll-bottom{\n   pointer-events: none;\n   z-index: 2;\n   bottom: 0;\n   position: absolute;\n   width: calc(100% - 0.75rem);\n   background: linear-gradient(to top, rgba(255, 255, 255, 1) 0%,rgba(255, 255, 255, 0.5) 60%,rgba(255,255,255,0) 100%);\n   height: 40px;\n}\n\n#suggestions-container .layout-scroll-top{\n   top: 101px;\n}\n\n@media all and (min-width: 601px){\n   .layout-shown-mobile{\n      visibility: hidden;\n      opacity: 0;\n   }\n   #map{\n      visibility: visible;\n      opacity: 1;\n   }\n   #map, .layout-container{\n      margin-bottom: 0;\n      top: 64px;\n      height: calc(100vh - 64px);\n   }\n   .layout-container{\n      transform: translateX(-330px);\n      transition: transform 0.5s ease;\n      width: 320px;\n      z-index: 3;    \n      -webkit-box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2);\n      box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2);\n   }\n   .layout-container-header h2 a{\n      visibility: visible;\n   }\n   .layout-container-header a i{\n      display: none;\n   }\n   .layout-container-header a i:nth-child(3){\n      display: inline;\n   }\n   #suggestions-container .layout-container-header a i:nth-child(2){\n      display: inline;\n   }\n   .layout-container .layout-container-body{\n      height: calc(100vh - 117px);\n   }\n\n   .layout-med-shown{\n      transform: none;\n   }\n   .layout-med-visible{\n      visibility: visible;\n      opacity: 1;\n   }\n\n   .layout-suggestion-list{\n      height: calc(100vh - 165px);\n   }\n   #layout-loading-areas{\n      margin: 0;\n      z-index: 5;\n   }\n}\n\n@media all and (min-width: 992px){\n   .layout-scroll-top{\n      top: 55px;\n   }\n   #suggestions-container .layout-scroll-top{\n      top: 103px;\n   }\n\n   .layout-container{\n      transform: translateX(-330px);\n      visibility: hidden;\n      opacity: 0;\n   }\n   .layout-container-header a{\n      display: none;\n   }\n\n   #route-container{\n      bottom: 0;\n      top: auto;  \n      height: auto;\n   }\n   #route-container .layout-container-body,\n   #interests-container .layout-container-body{\n      height: calc(100vh - 174px);\n      visibility: hidden;\n   }\n   #route-container .layout-container-header{\n      border-top: 1px solid #ddd;\n   }\n\n   #interests-container{\n      height: auto;\n   }\n\n   #suggestions-container{\n      right: 0;\n      transform: translateX(330px);\n   }\n\n   /*collabsable arrows*/\n   /*used nth-child(n) for specificity*/\n   .layout-container-header a i:nth-child(n){\n      display: none;\n   }\n   #suggestions-container .layout-container-header a i:nth-child(2){\n      display: none;\n   }\n   #suggestions-container .layout-container-header a i:nth-child(1){\n      display: inline;\n   }\n   .layout-show-interests:not(.layout-show-route) #interests-container .layout-hi-hide{\n      display: inline; \n   }\n   .layout-show-interests:not(.layout-show-route) #route-container .layout-hi-collapse{\n      display: inline; \n   }\n   .layout-show-route:not(.layout-show-interests) #route-container .layout-hi-hide{\n      display: inline; \n   }\n   .layout-show-route:not(.layout-show-interests) #interests-container .layout-hi-expand{\n      display: inline; \n   }\n   .layout-show-route.layout-show-interests #interests-container .layout-hi-collapse{\n      display: inline;\n   }\n   .layout-show-route.layout-show-interests #route-container .layout-hi-expand{\n      display: inline;\n   }\n\n   /*interests open*/\n   .layout-show-interests #route-container .layout-container-body{\n      height: 0;\n      padding-top: 0;\n      padding-bottom: 0;\n   }\n   .layout-interests-visible #interests-container .layout-container-body{\n      visibility: visible;\n   }\n\n   /*route open*/\n   .layout-show-route #route-container .layout-container-body{\n      padding-top: 20px;\n      padding-bottom: 40px;\n      height: calc(100vh - 174px);\n   }\n   .layout-route-visible #route-container .layout-container-body{\n      visibility: visible;\n   }\n\n   /*route AND interests open*/\n   .layout-show-route.layout-show-interests #route-container .layout-container-body,\n   .layout-show-route.layout-show-interests #interests-container .layout-container-body{\n      height: calc(50vh - 87px);\n      padding-top: 20px;\n      padding-bottom: 40px;\n   }\n\n   /*route AND/OR interests open */\n   .layout-left-sb-visible #route-container,\n   .layout-left-sb-visible #interests-container{\n      visibility: visible;\n      opacity: 1;\n   }\n   .layout-left-sb-visible #route-container .layout-container-header a,\n   .layout-left-sb-visible #interests-container .layout-container-header a{\n      display: inline;\n   }\n   .layout-left-sb-open #route-container,\n   .layout-left-sb-open #interests-container{\n      transform: none;\n   }\n   .layout-left-height-should-animate #route-container .layout-container-body,\n   .layout-left-height-should-animate #interests-container .layout-container-body{\n      transition: height 0.5s ease, padding 0.5s ease;\n   }\n\n   /*suggestions open*/\n   .layout-right-sb-visible #suggestions-container{\n      visibility: visible;\n      opacity: 1;\n   }\n   .layout-right-sb-visible #suggestions-container .layout-container-header a{\n      display: inline;\n   }\n   .layout-show-suggestions #suggestions-container{\n      transform: none;\n   }\n}\n\n\n/*MODALS*/\n.layout-modal-close{\n   border: none;\n   background: transparent;\n   display: inline;\n   padding: 0;\n   position: absolute;\n   top:0;\n   right: 0;\n   margin: 1rem;\n   z-index: 1;\n}\n.layout-modal-close:focus{\n   background: transparent;\n   outline:  #039be5 auto;\n}\n.layout-modal-close:focus:active{\n   background: transparent;\n   outline:  none;\n}\n.layout-modal-no-footer.modal-fixed-footer .modal-content{\n   height: auto;\n}\n@media screen and (max-width: 600px){\n   #storage-modal .btn-flat, #modal1 .btn-flat{\n      width: 50%;\n      padding-left: 0.5rem;\n      padding-right: 0.5rem;\n      text-align: center;\n   }\n   .modal{\n      width: 100%;\n      max-height: 80%;\n   }\n   .modal.modal-fixed-footer{\n      height: 80%;\n   }\n}\n\n@media print{\n   body{\n      height: auto;\n   }\n   #directions-modal{ \n      display: block !important;\n      position: absolute !important;\n      top: 0 !important;\n      width: 100% !important;\n      min-height: 100vh !important;\n      height: auto !important;\n      max-height: none !important;\n      opacity: 1 !important;\n      transform: none !important;\n   }\n   #directions-modal .modal-content{\n      height: auto !important;\n      max-height: none !important;\n      position: relative !important;\n   }\n}\n", ""]);

// exports


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__map_css__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__map_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__map_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__mapconstant__ = __webpack_require__(6);




const directionsService = new google.maps.DirectionsService();
const directionsDisplay = new google.maps.DirectionsRenderer();


directionsDisplay.setMap(__WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]);
directionsDisplay.setPanel(document.getElementById('directions-container'));

let routeMarkers = [];

__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.on('change', function(e){
   //remove all markers
   routeMarkers.forEach((m) => {
      m.setMap(null);
   });
   routeMarkers = [];

   // //add new markers
   if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.locationCount === 1){
      directionsDisplay.set('directions', null);
      if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[0].data.geometry){
         if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.shouldZoomMap){
            __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].fitBounds(e.val[0].data.geometry.viewport);
         }
         addMarker(e.val[0].data.geometry.location, 'route');
         //update route with one location
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.update(e.val[0].data.geometry.location);
      }
      else if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[0].data.RecAreaName){
         let coords = new google.maps.LatLng({
            lat: e.val[0].data.RecAreaLatitude,
            lng: e.val[0].data.RecAreaLongitude
         });
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.update(coords);
         __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].setCenter(coords);
         if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.shouldZoomMap){
            __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].setZoom(8);
         }
         addMarker(coords, 'route');
      }
      else{
         let coords = new google.maps.LatLng({
            lat: e.val[0].data.lat,
            lng: e.val[0].data.lng
         });
         __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.update(coords);
         __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].setCenter(coords);
         if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.shouldZoomMap){
            __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].setZoom(8);
         }
         addMarker(coords, 'route');
      }
   }
   else if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.locationCount){
      if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.shouldZoomMap){
         directionsDisplay.set('preserveViewport', false);
      }
      else{
         directionsDisplay.set('preserveViewport', true);
      }
      //get directions
      let request = {
         origin: __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.origin,
         destination: __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.destination,
         travelMode: 'DRIVING'
      }
      if(__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.waypoints)
         request.waypoints = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.waypoints;
      directionsService.route(request, function(result, status) {
         if (status == 'OK') {
            __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.update(result.routes[0]);
            directionsDisplay.setDirections(result);
         }
         //else show some error toast?
      });
   }
   else{
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.update(null);
   }
   __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.shouldZoomMap = true;
})

let recAreaMarkers = [];

__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.filtered.on('change', function(e){
   let markerMap = {};
   let newMarkers = [];
   e.val.forEach((r) => {
      if(!r.marker){
         r.addMarker();
         r.marker.setMap(__WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]);
      }
      else if(!r.markerDisplayed){
         r.marker.setMap(__WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]);
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
      map: __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]
   }
   if(type === 'route'){
      kwargs.label = 'A';
   }
   let marker = new google.maps.Marker(kwargs);
   if(area){
      let info = new google.maps.InfoWindow({content: makePreview(area)});
      marker.addListener('mouseover', (e) => {
         info.open(__WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */], marker);
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

__WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */].addListener('idle', function(){
   __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.filterAll();
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
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.searchRadius = slider.val() * 1609.34;
      let rad = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.searchRadius;
      var coords = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.getCoordsByRadius(rad);
      if(coords){
         coords.forEach((c) => {
            let circle = new google.maps.Circle({
               center: c,
               radius: rad,
               fillColor: 'blue',
               fillOpacity: 0.33,
               strokeColor: 'red',
               strokeOpacity: 0,
               map: __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]
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
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.filterAll();
   });
   slider.on('touchend', function(){
      slider.blur();
   })
   slider.on('input', function(){
      circles.forEach((c) => {
         c.setMap(null);
      })
      circles = [];
      __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.searchRadius = slider.val() * 1609.34;
      let rad = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].recreation.searchRadius;
      var coords = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].map.directions.getCoordsByRadius(rad);
      if(coords){
         coords.forEach((c) => {
            let circle = new google.maps.Circle({
               center: c,
               radius: rad,
               fillColor: 'blue',
               fillOpacity: 0.33,
               strokeColor: 'red',
               strokeOpacity: 0,
               map: __WEBPACK_IMPORTED_MODULE_2__mapconstant__["a" /* default */]
            });
            circles.push(circle);
         });
      }
   });
})



/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(22);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(2)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./map.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./map.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, "\n", ""]);

// exports


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__route_css__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__route_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__route_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__state_state__ = __webpack_require__(0);



var tooltip = $(
	'<span class= "route-tooltip" data-tooltip="Select from the drop-down menu." data-position="right">'
);
tooltip.tooltip({delay: 50});

// Function to manage the sorting of Google Places locations.
// Using jquery.ui for sorting function.
$(function() {
  $( ".sortable" ).sortable({
    revert: true, 
    handle: '.route-move-icon',
    containment: '#route-container',
    stop: function() {
      var children = inputSection.children();
      var checker = 0;
      var stateLocation;
      var listLocation;
      // Logic created to determine where the original destination was located, where it was moved, and to update the location in State.
      for (let i = 0; i < children.length; i++) {
      	listLocation = children[i].dataset.number;
      	if (listLocation != checker){
	      	if (listLocation > checker+1){
						tooltip.mouseleave();
						tooltip.detach();
						stateLocation = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[listLocation].data;
						__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(listLocation, true);
						__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.insert(stateLocation, i);
	      	} else if (listLocation == checker+1){
	      		checker++;
	      	} else if (listLocation < checker-1){
					tooltip.mouseleave();
					tooltip.detach();
	    			stateLocation = __WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[listLocation].data;
	    			__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(listLocation, true);
					__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.insert(stateLocation, i);
	      	}
	      }
      	checker++;
      }
    }
  });
});

// Options object that will be fed into the Google Places API call.
var options = {
  componentRestrictions: {country: 'us'}
};

// Variables for the new sections within the #destinations container for the sorting and for the button/new inputs.
var inputSection = $("<div>");
var buttonSection = $('<div class="route-btn-container">');

// Applies the "sortable" class to the inputSection area so only that section can be sorted.
inputSection.attr("class", "sortable");

// Appending the new divs to the #destination section.
$("#destinations").append(inputSection);
$("#destinations").append(buttonSection);

// On page load, calls the newInputField function to load a "Starting Location" input field.
newInputField();

// Function to update the state object when something within the object is changed.
__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.on("change", function (e){
	var path = e.val;
	// Resets the input and button Section divs to avoid duplications.
	inputSection.empty();
	buttonSection.empty();
	// If all destinations have been removed, calls the newInputField function to re-add "Starting Location" input field.
	if (path.length == 0) {
		newInputField();
	} else {
		// Populates the destinations section with the locations stored in the state object.
		for (let i = 0; i < e.val.length; i++) {
			let location = e.val[i];
			let newInput;
			var inputContainer = $("<div>");
			// Adds ui-state-default class to allow input boxes to be sortable via jquery.ui.
			inputContainer.attr("class", "route-input-container ui-state-default");
			// Stores data number in the inputContainer for manipulation in the sortable function.
			inputContainer.attr("data-number", i);
			// Creates a clean view of Google Address from the Places name and address stored in the state object.
			if (location.type == "place") {
				newInput = $("<input>").val(location.data.name + ' (' + location.data.formatted_address + ')');
			}
			// Creates a clean view of the Google Address from the recreation list in case that is the field type stored in the state object.
			else {
				newInput = $("<input>").val(location.data.RecAreaName);
			}
			// Adds and appends all classes, buttons, and functions inside the inputContainer.
			newInput.attr("class", "route-choice");
			let closeInput = $('<a href="#" class="grey-text">').append($("<i class='material-icons route-close-icon'>").text('close'));
			let moveInput = $('<a href="#" class="grey-text">').append($("<i class='material-icons route-move-icon'>").text('drag_handle'));
			inputContainer.append(moveInput, newInput, closeInput);			
			moveInput.click(function(e){
				e.preventDefault();
			});
			// Function to remove the inputContainer if the close (X) button is pressed.			
			closeInput.click(function(e){
				e.preventDefault();
				if (location.type === "recarea"){
			 		__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[i].data.setInRoute(false);
				}
				tooltip.mouseleave();
				tooltip.detach();
			 	__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(i);
			});
			// Function to remove the inputContainer if the user focuses out of the input while it is blank.			
			newInput.focusout(function(){
			 	if (newInput.val() == ""){
			 		if (location.type === "recarea"){
			 			__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[i].data.setInRoute(false);
					}
					tooltip.mouseleave();
					tooltip.detach();
			 		__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(i);
			 	}
			});
			// Function to remove the inputContainer if enter is pressed while the input is blank.
			newInput.keypress(function (e) {
				if (e.which === 13 && newInput.val() == ""){
			 		if (location.type === "recarea"){
			 			__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[i].data.setInRoute(false);
					}
					tooltip.mouseleave();
					tooltip.detach();
					__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(i);
				}
			});
			// Adds the completed inputContainer to the inputSection.
			inputSection.append(inputContainer);
			// Sends the newInput, inputContainer, bulian value, and state position to the autofill function.
			autofill(newInput[0], inputContainer, false, i);
		} 
		// Creates and appends buttons to the buttonSection when a completed input is filled in.
		buttonSection.append("<div id='newbuttons'>");
		$("#newbuttons")
		.append(
			$("<a class='btn waves-effect waves-light' id='route-addBtn' href='#'>")
			.text('Add Location')
			.prepend('<i class="material-icons left">add</i>')
		);
		$("#route-addBtn").click(newInputField);
	}
});

// Applied autofill code to the new input fields and sends input to state object.
// Takes the newInput, inputContainer, bulian value, and state postion as variable in the autofill function.
// Tooltips included for user error handling.
function autofill(input, container, add, index){
	var autocomplete = new google.maps.places.Autocomplete(input, options);
	// Google Places function - uses "autocomplete" placeholder defined in line above.
	autocomplete.addListener('place_changed', function (){
		var place = autocomplete.getPlace();
		if (place.place_id){
			if (add){
				tooltip.mouseleave();
				tooltip.detach();
				__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.add(place);
			}
			else {
				tooltip.mouseleave();
				tooltip.detach();
		 		if (__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[index].type === "recarea"){
		 			__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.path[index].data.setInRoute(false);
				}
				__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.remove(index, true);
				__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.insert(place, index);
			}
		} else {
			if (place.name != ""){
				container.append(tooltip);
				tooltip.mouseenter();
			}
		}
	});
}

// Get the HTML input element for the autocomplete search box and create the autocomplete object.
function newInputField(e) {
	if(e) e.preventDefault();
	$("#newbuttons").remove();
	var inputfield = $("<input>");
	buttonSection.append(inputfield);
	inputfield.addClass("destination-input");
	// Changes the placeholder value within the new input field based on the length of the state object.
	if (__WEBPACK_IMPORTED_MODULE_1__state_state__["a" /* default */].route.locationCount == 0) {
		inputfield.attr("placeholder", "Starting Location: ");
	}
	else {
		inputfield.attr("placeholder", "Next Stop: ");
		inputfield.focus();
	}
	autofill(inputfield[0], buttonSection, true);
}

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(25);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(2)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./route.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./route.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, ".route-input-container{\n   background-color: #fff;\n   position: relative;\n   margin-bottom: 20px;\n}\n\n.route-input-container i{\n   background-color: #fff;\n   width: 3rem;\n   vertical-align: middle;\n   text-align: center;\n   height: 2.8rem;\n   height: calc(3rem - 1px);\n   line-height: 3rem;\n   position: absolute;\n   top: 0;\n}\n.route-move-icon{\n   left: 0;\n}\n.route-close-icon{\n   right: 0;\n}\n.route-input-container a:focus i{\n   outline:  #039be5 auto;\n}\n\n.route-input-container input{\n   box-sizing: border-box;\n   padding-left: 3rem;\n   margin-bottom: 0;\n}\n\n.route-btn-container{\n   text-align: center;\n}", ""]);

// exports


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__state_state__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__recreation_constants__ = __webpack_require__(5);



//interests
__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.on('change', function(e) {
   var interests = {};

   e.val.selected.forEach(function(interest) {
      interests[interest.id] = true;
   });
   localStorage.setItem('interests', JSON.stringify(interests));
   localStorage.setItem('has-stored', 'true');
});

//route
__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.on('change', function(e){
   var locations = e.val.map((l) => {
      if(l.type === 'place'){
         return{
            type: 'place',
            place_id: l.data.place_id,
            name: l.data.name,
            formatted_address:l.data.formatted_address,
            lat: l.data.lat || l.data.geometry.location.lat(),
            lng: l.data.lng || l.data.geometry.location.lng()
         };
      }
      else{
         return{
            type: 'recarea',
            id: l.data.id,
            RecAreaName: l.data.RecAreaName,
            RecAreaLatitude: l.data.RecAreaLatitude,
            RecAreaLongitude: l.data.RecAreaLongitude
         };
      }
   });
   localStorage.setItem('route', JSON.stringify(locations));
   localStorage.setItem('has-stored', 'true');
})

//bookmarks
__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.bookmarked.on('change', function(e){
   var bookmarked = e.val.map((r) => {
         return r.id;
   });
   localStorage.setItem('bookmarked', JSON.stringify(bookmarked));
   localStorage.setItem('has-stored', 'true');
})

function resetStorage(e){
   e.preventDefault();
   hasLoaded = true;
   localStorage.setItem('has-stored', null);
   localStorage.setItem('bookmarked', null);
   localStorage.setItem('route', null);
   localStorage.setItem('interests', null);
   $('#storage-modal').modal('close');
}

function loadStorage(e){
   e.preventDefault();
   if(hasLoaded) return;
   var interests = JSON.parse(localStorage.getItem('interests')) || {};
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.all.forEach((a) => {
      if(interests[a.id]){
         a.update(true, true);
      }
   });
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].interests.emit('change');

   var route = JSON.parse(localStorage.getItem('route')) || [];
   var routeArr = [];
   let requestCount = 0;
   var routeCallback = function(index, response){
      requestCount -= 1;
      if(response.RecAreaID){
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.all.addData(response);
         let area = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.all.RECDATA.find((r) => {
            return r.id == response.RecAreaID;
         });
         area.setInRoute(true);
         routeArr[index] = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.getLocationObject(area);
      }
      if(requestCount === 0){
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.setData(routeArr);
      }
   }
   route.forEach((location, index) => {
      if(location.type === 'place'){
         routeArr[index] = __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.getLocationObject(location);
      }
      else{
         requestCount += 1;
         Object(__WEBPACK_IMPORTED_MODULE_1__recreation_constants__["b" /* recApiById */])(location.id, routeCallback.bind(null, index));
      }
   });
   if(requestCount === 0){
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].route.setData(routeArr);
   }
}

function getBookmarks(){
   if(hasLoaded) return;
   hasLoaded = true;
   $('#storage-modal').modal('close');
   let requestCount = 0;
   var bookmarked = JSON.parse(localStorage.getItem('bookmarked')) || [];
   var bookmarkCallback = function(response){
      requestCount -= 1;
      if(response.RecAreaID){
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.all.addData(response);
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.addBookmark(__WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.all.RECDATA.find((r) => {
            return r.id == response.RecAreaID;
         }));
      }
      if(requestCount === 0){
         //need to wait for directions to load
         __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].recreation.filterAll();
      }
   }
   bookmarked.forEach((b) => {
      requestCount += 1;
      Object(__WEBPACK_IMPORTED_MODULE_1__recreation_constants__["b" /* recApiById */])(b, bookmarkCallback);
   });
}

//make sure this is set false if they choose not to load storage!
var hasStorage = localStorage.getItem('has-stored') === 'true';
var hasLoaded = false;
if( hasStorage){
   __WEBPACK_IMPORTED_MODULE_0__state_state__["a" /* default */].map.directions.on('change', getBookmarks);
}

window.loadStorage = loadStorage;

$(document).ready(function(){
   $('#storage-modal').modal({
      dismissible: false
   });
   if(hasStorage){
      $('#storage-modal').modal('open');
      $('#new-session').click(resetStorage);
      $('#continue-session').click(loadStorage);
   }
});


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjlkZjBjMDRjODdjNTJkOWQyZjYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvc3RhdGUvc3RhdGUuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9yZWNyZWF0aW9uL3JlY3JlYXRpb24uY3NzPzNiYzYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9yZWNBcmVhRGV0YWlscy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9yZWNyZWF0aW9uL2NvbnN0YW50cy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9tYXAvbWFwY29uc3RhbnQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwcC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9yZWNyZWF0aW9uL3JlY3JlYXRpb24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9yZWNyZWF0aW9uLmNzcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi91cmxzLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL21hcC9kaXN0YW5jZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9yZWNyZWF0aW9uL2Rpc3BsYXlSZWNBcmVhU3VnZ2VzdGlvbnMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9sb2FkQnV0dG9uLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2ludGVyZXN0cy9pbnRlcmVzdHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvaW50ZXJlc3RzL2ludGVyZXN0cy5jc3M/YWQ2OCIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9pbnRlcmVzdHMvaW50ZXJlc3RzLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9sYXlvdXQvbGF5b3V0LmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2xheW91dC9sYXlvdXQuY3NzPzJmMzAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbGF5b3V0L2xheW91dC5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbWFwL21hcC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9tYXAvbWFwLmNzcz8zNDY3Iiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL21hcC9tYXAuY3NzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3JvdXRlL3JvdXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3JvdXRlL3JvdXRlLmNzcz9lMDY1Iiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3JvdXRlL3JvdXRlLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9sb2NhbHN0b3JhZ2UvbG9jYWxzdG9yYWdlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0Q4QjtBQUNpQjtBQUMvQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsTUFBTSw0QkFBNEIsS0FBSztBQUNwRTtBQUNBO0FBQ0EsZ0RBQWdELEtBQUs7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBLDZCQUE2QixNQUFNLDRCQUE0QixLQUFLO0FBQ3BFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7O0FBRUEsK0NBQStDO0FBQy9DO0FBQ0EsaURBQWlELEtBQUs7QUFDdEQ7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QixnQkFBZ0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixzQkFBc0I7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsY0FBYztBQUNkOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBLGNBQWM7QUFDZDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzRDtBQUNBLDZCO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQSxnQkFBZ0IsaUJBQWlCO0FBQ2pDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxpQ0FBaUMsVUFBVTtBQUMzQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyx1REFBdUQsS0FBSztBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOzs7QUFHUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQyxlQUFlO0FBQy9DO0FBQ0E7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Q0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZEOztBQUVBLDZCQUE2QixtQkFBbUI7O0FBRWhEOztBQUVBOztBQUVBO0FBQ0E7Ozs7Ozs7QUNoV0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsZ0NBQWdDLFVBQVUsRUFBRTtBQUM1QyxDOzs7Ozs7Ozs7O0FDekJBO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QjtBQUM5Qjs7QUFFQTtBQUNBO0FBQ0EsMERBQTBELEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO0FBQ2pIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHNEO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7O0FBRUEscUZBQXFGLDJCQUEyQjs7QUFFaEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRSxhQUFhLElBQUkseUJBQXlCLEdBQUcsbUJBQW1CO0FBQ2xJLEtBQUs7OztBQUdMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULG1EO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsbUQ7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7OztBQUdBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxLQUFLOztBQUVMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDOztBQUVoQzs7QUFFQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTCxFQUFFOzs7Ozs7Ozs7Ozs7O0FDaElGO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQSxNQUFNO0FBQ04sTUFBTTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQSxNQUFNO0FBQ04sTUFBTTtBQUNOO0FBQ0E7QUFDQSxNQUFNO0FBQ04sTUFBTTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXlCLEtBQUssaUJBQWlCLEdBQUc7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOzs7Ozs7OztBQzNGQTtBQUNBLFdBQVcsbUNBQW1DO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKLENBQUM7Ozs7Ozs7QUN0QkQ7QUFDQTs7O0FBR0E7QUFD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Q0E7O0FBRUE7QUFDQSxJQUFJOztBQUVKLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEM7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVFO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixtREFBbUQ7QUFDOUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FB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QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyIsImZpbGUiOiJhcHAuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gNyk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgYjlkZjBjMDRjODdjNTJkOWQyZjYiLCJpbXBvcnQge3JldHJpZXZlU2luZ2xlUmVjQXJlYX0gZnJvbSAnLi4vcmVjcmVhdGlvbi9yZWNBcmVhRGV0YWlscyc7XG5pbXBvcnQge3JlY0FwaVF1ZXJ5LCBpbnRlcmVzdExpc3QsIHVwZGF0ZUljb25zfSBmcm9tICcuLi9yZWNyZWF0aW9uL2NvbnN0YW50cyc7XG5pbXBvcnQgbWFwIGZyb20gJy4uL21hcC9tYXBjb25zdGFudCc7XG5pbXBvcnQgZGlzdGFuY2VNYXRyaXggZnJvbSAnLi4vbWFwL2Rpc3RhbmNlJztcblxuY2xhc3MgRXZlbnRPYmplY3R7XG4gICBjb25zdHJ1Y3RvcihldmVudHNBcnIpe1xuICAgICAgbGV0IGV2ZW50cyA9IHRoaXMuZXZlbnRzID0ge307XG4gICAgICBldmVudHNBcnIuZm9yRWFjaChmdW5jdGlvbihlKXtcbiAgICAgICAgIC8vdGhpcyBhcnJheSB3aWxsIGNvbnRhaW4gY2FsbGJhY2sgZnVuY3Rpb25zXG4gICAgICAgICBldmVudHNbZV0gPSBbXTtcbiAgICAgIH0pO1xuICAgfVxuXG4gICAvL3NldCBldmVudCBsaXN0ZW5lclxuICAgb24oZXZlbnQsIGNhbGxiYWNrKXtcbiAgICAgIGlmKHRoaXMuZXZlbnRzW2V2ZW50XSA9PSB1bmRlZmluZWQpe1xuICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBcIiR7ZXZlbnR9XCIgZXZlbnQgZG9lcyBub3QgZXhpc3Qgb24gJHt0aGlzfWApXG4gICAgICB9XG4gICAgICBlbHNlIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY29uZCBhcmd1bWVudCB0byBcIiR7dGhpc30ub24oKVwiIG11c3QgYmUgYSBmdW5jdGlvbi5gKVxuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgIH1cblxuICAgLy90cmlnZ2VyIGV2ZW50IGxpc3RlbmVycyBmb3IgZ2l2ZW4gZXZlbnRcbiAgIGVtaXQoZXZlbnQsIHByZXZFdmVudCA9IHt9KXtcbiAgICAgIGlmKHRoaXMuZXZlbnRzW2V2ZW50XSA9PSB1bmRlZmluZWQpe1xuICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBcIiR7ZXZlbnR9XCIgZXZlbnQgZG9lcyBub3QgZXhpc3Qgb24gJHt0aGlzfWApXG4gICAgICB9XG4gICAgICBlbHNlIGlmKCFwcmV2RXZlbnQuc3RvcFByb3BhZ2F0aW9uKXtcbiAgICAgICAgIGxldCBjYWxsYmFja3MgPSB0aGlzLmV2ZW50c1tldmVudF07XG4gICAgICAgICBsZXQgZSA9IHRoaXMubWFrZUV2ZW50KGV2ZW50KTtcbiAgICAgICAgIC8vZXhlY3V0ZSBhbGwgY2FsbGJhY2tzXG4gICAgICAgICBjYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIGMoZSk7XG4gICAgICAgICB9KVxuICAgICAgfVxuICAgfVxuXG4gICAvL3Byb3ZpZGVzIGV2ZW50IG9iamVjdCBmb3IgZXZlbnQgbGlzdGVuZXJzOyBzaG91bGQgYmUgb3ZlcndyaXR0ZW4gYnkgaW5oZXJpdG9yXG4gICBtYWtlRXZlbnQoKXtcbiAgICAgIGNvbnNvbGUud2FybihgTm8gbWFrZUV2ZW50IG1ldGhvZCBzZXQgb24gJHt0aGlzfWApO1xuICAgfVxufVxuXG5cbi8qKioqKioqKioqKioqXFwgICAgXG4gICBJbnRlcmVzdHMgICAgXG5cXCoqKioqKioqKioqKiovXG5jbGFzcyBJbnRlcmVzdCBleHRlbmRzIEV2ZW50T2JqZWN0e1xuICAgY29uc3RydWN0b3IoaW50ZXJlc3Qpe1xuICAgICAgc3VwZXIoWydjaGFuZ2UnXSk7XG4gICAgICB0aGlzLm5hbWUgPSBpbnRlcmVzdC5BY3Rpdml0eU5hbWU7XG4gICAgICB0aGlzLmlkID0gaW50ZXJlc3QuQWN0aXZpdHlJRDtcbiAgICAgIHRoaXMuaWNvbklkID0gaW50ZXJlc3QuRW1vamlcblxuICAgICAgdGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLmV2ZW50U2hvdWxkUHJvcGFnYXRlID0gdHJ1ZTtcblxuICAgICAgdGhpcy5tYWtlRXZlbnQgPSB0aGlzLm1ha2VFdmVudC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy50b2dnbGUgPSB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpO1xuICAgfVxuICAgLy90b2dnbGVzIHNlbGVjdGVkIHByb3BlcnR5XG4gICB0b2dnbGUoKXtcbiAgICAgIHRoaXMuc2VsZWN0ZWQgPSAhdGhpcy5zZWxlY3RlZDtcbiAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICB9XG4gICB1cGRhdGUoc2VsZWN0ZWQsIHN0b3BQcm9wYWdhdGlvbil7XG4gICAgICB0aGlzLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICBpZihzdG9wUHJvcGFnYXRpb24pXG4gICAgICAgICB0aGlzLmV2ZW50U2hvdWxkUHJvcGFnYXRlID0gZmFsc2U7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgICAgdGhpcy5ldmVudFNob3VsZFByb3BhZ2F0ZSA9IHRydWU7XG4gICB9XG4gICB0b1N0cmluZygpe1xuICAgICAgcmV0dXJuIFwiSW50ZXJlc3RcIjtcbiAgIH1cbiAgIG1ha2VFdmVudCgpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgIHZhbDogdGhpcy5zZWxlY3RlZCwgXG4gICAgICAgICBzdG9wUHJvcGFnYXRpb246ICF0aGlzLmV2ZW50U2hvdWxkUHJvcGFnYXRlXG4gICAgICB9O1xuICAgfVxufVxuXG5jbGFzcyBJbnRlcmVzdHMgZXh0ZW5kcyBFdmVudE9iamVjdHtcbiAgIC8vbGlzdCBpcyBsaXN0IG9mIGludGVyZXN0cywgdG8gYmUgcHJvdmlkZWQgYnkgcmVjcmVhdGlvbiBtb2R1bGUgXG4gICBjb25zdHJ1Y3RvcihsaXN0KXtcbiAgICAgIHN1cGVyKFsnY2hhbmdlJ10pO1xuICAgICAgdGhpcy5hbGwgPSBsaXN0Lm1hcChmdW5jdGlvbihpKXtcbiAgICAgICAgIGxldCBpbnRlcmVzdCA9IG5ldyBJbnRlcmVzdChpKTtcbiAgICAgICAgIGludGVyZXN0Lm9uKCdjaGFuZ2UnLCB0aGlzLmVtaXQuYmluZCh0aGlzLCAnY2hhbmdlJykpO1xuICAgICAgICAgcmV0dXJuIGludGVyZXN0O1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgdGhpcy5tYWtlRXZlbnQgPSB0aGlzLm1ha2VFdmVudC5iaW5kKHRoaXMpO1xuICAgfVxuICAgZ2V0IHNlbGVjdGVkKCl7XG4gICAgICByZXR1cm4gdGhpcy5hbGwuZmlsdGVyKGZ1bmN0aW9uKGkpe1xuICAgICAgICAgcmV0dXJuIGkuc2VsZWN0ZWQ7XG4gICAgICB9KTtcbiAgIH1cbiAgIHRvU3RyaW5nKCl7XG4gICAgICByZXR1cm4gXCJzdGF0ZS5pbnRlcmVzdHNcIjtcbiAgIH1cbiAgIG1ha2VFdmVudCgpe1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgIHZhbDoge1xuICAgICAgICAgICAgYWxsOiB0aGlzLmFsbCxcbiAgICAgICAgICAgIHNlbGVjdGVkOiB0aGlzLnNlbGVjdGVkXG4gICAgICAgICB9XG4gICAgICB9O1xuICAgfVxufVxuXG5cbi8qKioqKioqKioqKioqXFwgICAgXG4gICAgIFJvdXRlICAgIFxuXFwqKioqKioqKioqKioqL1xuY2xhc3MgTG9jYXRpb257XG4gICBjb25zdHJ1Y3RvcihvYmplY3Qpe1xuICAgICAgaWYoIG9iamVjdC5oYXNPd25Qcm9wZXJ0eSgnUmVjQXJlYU5hbWUnKSl7XG4gICAgICAgICAgdGhpcy50eXBlID0gJ3JlY2FyZWEnO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihvYmplY3QuaGFzT3duUHJvcGVydHkoJ3BsYWNlX2lkJykpe1xuICAgICAgICAgLy9nb29nbGUgcGxhY2VzIHBsYWNlLi4uIHNvbWVob3cgdGVzdCBmb3IgZ29vZ2xlIHBsYWNlIGFuZCBcbiAgICAgICAgIC8vdGhyb3cgZXJyb3IgaWYgbmVpdGhlciBcbiAgICAgICAgIHRoaXMudHlwZSA9ICdwbGFjZSc7XG4gICAgICB9XG4gICAgICAvL21heWJlIHJlbW92ZSBhZnRlciBkZXZcbiAgICAgIGVsc2V7XG4gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVkIGxvY2F0aW9uIGlzIG5vdCBhIFBsYWNlUmVzdWx0IG9yIFJlY0FyZWEnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGF0YSA9IG9iamVjdDtcbiAgIH1cbn1cblxuY2xhc3MgUm91dGUgZXh0ZW5kcyBFdmVudE9iamVjdHtcbiAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICBzdXBlcihbJ2NoYW5nZSddKTtcbiAgICAgIHRoaXMucGF0aCA9IFtdO1xuICAgICAgdGhpcy5zaG91bGRab29tTWFwID0gdHJ1ZTtcbiAgIH1cbiAgIGdldCBsb2NhdGlvbkNvdW50KCl7XG4gICAgICByZXR1cm4gdGhpcy5wYXRoLmxlbmd0aDtcbiAgIH1cblxuICAgZ2V0IG9yaWdpbigpe1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVydExvY2F0aW9uRm9yR29vZ2xlKHRoaXMucGF0aFswXSk7XG4gICB9XG4gICBnZXQgd2F5cG9pbnRzKCl7XG4gICAgICBpZiggdGhpcy5sb2NhdGlvbkNvdW50IDwgMyl7XG4gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgICByZXR1cm4gdGhpcy5wYXRoLnNsaWNlKDEsIHRoaXMubG9jYXRpb25Db3VudCAtIDEpLm1hcCgobCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZShsKSxcbiAgICAgICAgICAgICAgIHN0b3BvdmVyOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgfSk7XG4gICAgICB9XG4gICB9XG4gICBnZXQgZGVzdGluYXRpb24oKXtcbiAgICAgIGlmKCB0aGlzLmxvY2F0aW9uQ291bnQgPCAyKXtcbiAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZShcbiAgICAgICAgICAgIHRoaXMucGF0aFt0aGlzLmxvY2F0aW9uQ291bnQgLSAxXVxuICAgICAgICAgKTtcbiAgICAgIH1cbiAgIH1cblxuICAgY29udmVydExvY2F0aW9uRm9yR29vZ2xlKGxvY2F0aW9uKXtcbiAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYobG9jYXRpb24udHlwZSA9PT0gJ3BsYWNlJyl7XG4gICAgICAgICByZXR1cm4ge3BsYWNlSWQ6IGxvY2F0aW9uLmRhdGEucGxhY2VfaWR9O1xuICAgICAgfVxuICAgICAgZWxzZSBpZihsb2NhdGlvbi50eXBlID09PSAncmVjYXJlYScpe1xuICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxhdDogbG9jYXRpb24uZGF0YS5SZWNBcmVhTGF0aXR1ZGUsXG4gICAgICAgICAgICBsbmc6IGxvY2F0aW9uLmRhdGEuUmVjQXJlYUxvbmdpdHVkZVxuICAgICAgICAgfVxuICAgICAgfVxuICAgfVxuXG4gICBhZGQobG9jYXRpb24sIGRvbnRFbWl0KXtcbiAgICAgIGlmICghKGxvY2F0aW9uIGluc3RhbmNlb2YgTG9jYXRpb24pKXtcbiAgICAgICAgIGxvY2F0aW9uID0gbmV3IExvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGF0aC5wdXNoKGxvY2F0aW9uKTtcbiAgICAgIGlmKCAhZG9udEVtaXQpXG4gICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgfVxuICAgaW5zZXJ0KGxvY2F0aW9uLCBpbmRleCl7XG4gICAgICBpZiAoIShsb2NhdGlvbiBpbnN0YW5jZW9mIExvY2F0aW9uKSl7XG4gICAgICAgICBsb2NhdGlvbiA9IG5ldyBMb2NhdGlvbihsb2NhdGlvbik7XG4gICAgICB9XG4gICAgICB0aGlzLnBhdGguc3BsaWNlKGluZGV4LCAwLCBsb2NhdGlvbik7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgfVxuICAgcmVtb3ZlKGluZGV4LCBkb250RW1pdCl7XG4gICAgICB0aGlzLnBhdGguc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGlmKCAhZG9udEVtaXQpXG4gICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgfVxuICAgaW52ZXJ0KCl7XG4gICAgICBpZiggdGhpcy5sb2NhdGlvbkNvdW50ICE9PSAyKXtcbiAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdDYW4gb25seSBpbnZlcnQgcm91dGUgaWYgcm91dGUucGF0aCBjb250YWlucyBleGFjdGx5IHR3byBsb2NhdGlvbnMnXG4gICAgICAgICApO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIHRoaXMucGF0aC5wdXNoKHRoaXMucGF0aC5zaGlmdCgpKTtcbiAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICAgICB9XG4gICB9XG4gICBzZXREYXRhKGFycil7XG4gICAgICB0aGlzLnBhdGggPSBhcnI7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgfVxuXG4gICBnZXRMb2NhdGlvbk9iamVjdChsb2NhdGlvbil7XG4gICAgICByZXR1cm4gbmV3IExvY2F0aW9uKGxvY2F0aW9uKTtcbiAgIH1cblxuICAgYWRkUmVjQXJlYShhcmVhKXtcbiAgICAgIHRoaXMuc2hvdWxkWm9vbU1hcCA9IGZhbHNlO1xuICAgICAgdmFyIGFyZWFMb2NhdGlvbiA9IG5ldyBMb2NhdGlvbihhcmVhKTtcbiAgICAgIGlmKCB0aGlzLmxvY2F0aW9uQ291bnQgPT09IDApe1xuICAgICAgICAgdGhpcy5hZGQoYXJlYUxvY2F0aW9uKTtcbiAgICAgIH1cbiAgICAgIGlmKCB0aGlzLmxvY2F0aW9uQ291bnQgPD0gMSl7ICBcbiAgICAgICAgIGxldCBvcmlnaW4gPSB0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZShhcmVhTG9jYXRpb24pO1xuICAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFt0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZSh0aGlzLnBhdGhbMF0pXVxuICAgICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cyl7XG4gICAgICAgICAgICBpZihzdGF0dXMgPT09ICdPSycpe1xuICAgICAgICAgICAgICAgaWYocmVzcG9uc2Uucm93c1swXS5lbGVtZW50c1swXS5zdGF0dXMgPT09ICdaRVJPX1JFU1VMVFMnKXtcbiAgICAgICAgICAgICAgICAgIGFyZWEuc2V0SW5Sb3V0ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICBNYXRlcmlhbGl6ZS50b2FzdChcbiAgICAgICAgICAgICAgICAgICAgICdDb3VsZCBub3QgYWRkIHJlY3JlYXRpb24gYXJlYSB0byByb3V0ZS4gVHJ5IGFkZGluZyBpdCBtYW51YWxseS4nXG4gICAgICAgICAgICAgICAgICAsIDQwMDApO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKGFyZWFMb2NhdGlvbik7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgYXJlYS5zZXRJblJvdXRlKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgIGRpc3RhbmNlTWF0cml4LmdldERpc3RhbmNlTWF0cml4KHtcbiAgICAgICAgICAgIG9yaWdpbnM6IFtvcmlnaW5dLFxuICAgICAgICAgICAgZGVzdGluYXRpb25zOiBkZXN0aW5hdGlvbnMsXG4gICAgICAgICAgICB0cmF2ZWxNb2RlOiAnRFJJVklORydcbiAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoIHRoaXMubG9jYXRpb25Db3VudCA9PT0gMil7XG4gICAgICAgICBpZih0aGlzLnBhdGhbMV0udHlwZSA9PT0gJ3BsYWNlJyl7XG4gICAgICAgICAgICBsZXQgb3JpZ2luID0gdGhpcy5jb252ZXJ0TG9jYXRpb25Gb3JHb29nbGUoYXJlYUxvY2F0aW9uKTtcbiAgICAgICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSBbdGhpcy5jb252ZXJ0TG9jYXRpb25Gb3JHb29nbGUodGhpcy5wYXRoWzBdKV1cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBzdGF0dXMpe1xuICAgICAgICAgICAgICAgaWYoc3RhdHVzID09PSAnT0snKXtcbiAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLnJvd3NbMF0uZWxlbWVudHNbMF0uc3RhdHVzID09PSAnWkVST19SRVNVTFRTJyl7XG4gICAgICAgICAgICAgICAgICAgICBhcmVhLnNldEluUm91dGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgTWF0ZXJpYWxpemUudG9hc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ291bGQgbm90IGFkZCByZWNyZWF0aW9uIGFyZWEgdG8gcm91dGUuIFRyeSBhZGRpbmcgaXQgbWFudWFsbHkuJ1xuICAgICAgICAgICAgICAgICAgICAgLCA0MDAwKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChhcmVhTG9jYXRpb24sIDEpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIGFyZWEuc2V0SW5Sb3V0ZShmYWxzZSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICBkaXN0YW5jZU1hdHJpeC5nZXREaXN0YW5jZU1hdHJpeCh7XG4gICAgICAgICAgICAgICBvcmlnaW5zOiBbb3JpZ2luXSxcbiAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uczogZGVzdGluYXRpb25zLFxuICAgICAgICAgICAgICAgdHJhdmVsTW9kZTogJ0RSSVZJTkcnXG4gICAgICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgICAgICB9XG4gICAgICAgICBlbHNle1xuICAgICAgICAgICAgLy9idXQgd2hhdCBpZiBwYXRoWzBdIGlzIGEgcmVjcmVhdGlvbiBhcmVhPz9cbiAgICAgICAgICAgIGxldCBvcmlnaW4gPSB0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZSh0aGlzLnBhdGhbMF0pO1xuICAgICAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtcbiAgICAgICAgICAgICAgIHRoaXMuY29udmVydExvY2F0aW9uRm9yR29vZ2xlKHRoaXMucGF0aFsxXSksXG4gICAgICAgICAgICAgICB0aGlzLmNvbnZlcnRMb2NhdGlvbkZvckdvb2dsZShhcmVhTG9jYXRpb24pXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKXtcbiAgICAgICAgICAgICAgIGlmKHN0YXR1cyA9PT0gJ09LJyl7XG4gICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5yb3dzWzBdLmVsZW1lbnRzWzFdLnN0YXR1cyA9PT0gJ1pFUk9fUkVTVUxUUycpe1xuICAgICAgICAgICAgICAgICAgICAgYXJlYS5zZXRJblJvdXRlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgIE1hdGVyaWFsaXplLnRvYXN0KFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvdWxkIG5vdCBhZGQgcmVjcmVhdGlvbiBhcmVhIHRvIHJvdXRlLiBUcnkgYWRkaW5nIGl0IG1hbnVhbGx5LidcbiAgICAgICAgICAgICAgICAgICAgICwgNDAwMCk7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnJvd3NbMF0uZWxlbWVudHNbMF0uZGlzdGFuY2UudmFsdWUgPlxuICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2Uucm93c1swXS5lbGVtZW50c1sxXS5kaXN0YW5jZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGFyZWFMb2NhdGlvbiwgMSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGQoYXJlYUxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICBhcmVhLnNldEluUm91dGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgZGlzdGFuY2VNYXRyaXguZ2V0RGlzdGFuY2VNYXRyaXgoe1xuICAgICAgICAgICAgICAgb3JpZ2luczogW29yaWdpbl0sXG4gICAgICAgICAgICAgICBkZXN0aW5hdGlvbnM6IGRlc3RpbmF0aW9ucyxcbiAgICAgICAgICAgICAgIHRyYXZlbE1vZGU6ICdEUklWSU5HJ1xuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSB0aGlzLnBhdGgubWFwKChsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb252ZXJ0TG9jYXRpb25Gb3JHb29nbGUobCk7XG4gICAgICAgICB9KVxuICAgICAgICAgbGV0IG9yaWdpbiA9IHRoaXMuY29udmVydExvY2F0aW9uRm9yR29vZ2xlKGFyZWFMb2NhdGlvbik7XG4gICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKXtcbiAgICAgICAgICAgIGlmKHN0YXR1cyA9PT0gJ09LJyl7XG4gICAgICAgICAgICAgICBsZXQgYXJyID0gcmVzcG9uc2Uucm93c1swXS5lbGVtZW50cztcbiAgICAgICAgICAgICAgIGxldCBjbG9zZXN0SW5kZXggPSAxO1xuICAgICAgICAgICAgICAgaWYoYXJyWzFdLnN0YXR1cyA9PT0gJ1pFUk9fUkVTVUxUUycpe1xuICAgICAgICAgICAgICAgICAgYXJlYS5zZXRJblJvdXRlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIE1hdGVyaWFsaXplLnRvYXN0KFxuICAgICAgICAgICAgICAgICAgICAgJ0NvdWxkIG5vdCBhZGQgcmVjcmVhdGlvbiBhcmVhIHRvIHJvdXRlLiBUcnkgYWRkaW5nIGl0IG1hbnVhbGx5LidcbiAgICAgICAgICAgICAgICAgICwgNDAwMClcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIC8vZmluZCByb3V0ZSBwb2ludCB0aGlzIHJlY2FyZWEgaXMgY2xvc2VzdCB0b1xuICAgICAgICAgICAgICAgbGV0IHNtYWxsZXN0RGlzdGFuY2UgPSBhcnJbMV0uZGlzdGFuY2UudmFsdWU7XG4gICAgICAgICAgICAgICBmb3IobGV0IGkgPSAxOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgIGlmKCBhcnJbaV0uZGlzdGFuY2UudmFsdWUgPCBzbWFsbGVzdERpc3RhbmNlKXtcbiAgICAgICAgICAgICAgICAgICAgIGNsb3Nlc3RJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICBzbWFsbGVzdERpc3RhbmNlID0gYXJyW2ldLmRpc3RhbmNlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgLy9pZiBpdCdzIGNsb3Nlc3QgdG8gdGhlIHN0YXJ0aW5nIGxvY2F0aW9uLCBcbiAgICAgICAgICAgICAgIC8vaW5zZXJ0IGl0IHJpZ2h0IGFmdGVyIHRoZSBzdGFydGluZyBsb2NhdGlvblxuICAgICAgICAgICAgICAgaWYoY2xvc2VzdEluZGV4ID09PSAxKXtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGFyZWFMb2NhdGlvbiwgMSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvL290aGVyd2lzZSwgaWYgaXQncyBub3QgY2xvc2VzdCB0byB0aGUgZmluYWwgbG9jYXRpb24uLi5cbiAgICAgICAgICAgICAgIGVsc2UgaWYoY2xvc2VzdEluZGV4ICE9PSBhcnIubGVuZ3RoIC0gMSl7XG4gICAgICAgICAgICAgICAgICAvL2luc2VydCBpdCBieSB0aGUgbG9jYXRpb24gaXQncyBjbG9zZXN0IHRvXG4gICAgICAgICAgICAgICAgICAvL0IgaXMgY2xvc2VzdCB0byBSLCBBIGlzIHJpZ2h0IGJlZm9yZSBCLCBDIGlzIHJpZ2h0IGFmdGVyIEJcbiAgICAgICAgICAgICAgICAgIGxldCBhVG9CID0gcmVzcG9uc2Uucm93c1tjbG9zZXN0SW5kZXhdLmVsZW1lbnRzW2Nsb3Nlc3RJbmRleCAtIDFdLmRpc3RhbmNlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgbGV0IGFUb1IgPSBhcnJbY2xvc2VzdEluZGV4IC0gMV0uZGlzdGFuY2UudmFsdWU7XG4gICAgICAgICAgICAgICAgICBsZXQgclRvQiA9IHNtYWxsZXN0RGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgICBsZXQgYlRvQyA9IHJlc3BvbnNlLnJvd3NbY2xvc2VzdEluZGV4XS5lbGVtZW50c1tjbG9zZXN0SW5kZXggKyAxXS5kaXN0YW5jZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgIGxldCBiVG9SID0gclRvQjtcbiAgICAgICAgICAgICAgICAgIGxldCByVG9DID0gYXJyW2Nsb3Nlc3RJbmRleCArIDFdLmRpc3RhbmNlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgaWYoIFxuICAgICAgICAgICAgICAgICAgICAgYVRvUiArIHJUb0IgKyBiVG9DIDwgYVRvQiArIGJUb1IgKyByVG9DXG4gICAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQoYXJlYUxvY2F0aW9uLCBjbG9zZXN0SW5kZXggLSAxKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChhcmVhTG9jYXRpb24sIGNsb3Nlc3RJbmRleCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvL290aGVyd2lzZSwgaWYgaXQncyBjbG9zZXN0IHRvIHRoZSBsYXN0IGxvY2F0aW9uXG4gICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgLy9pZiB0aGUgbGFzdCBsb2NhdGlvbiBpcyBhIHJlY2FyZWEsIHNlZSBpZiB0aGlzIGFyZWFcbiAgICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGJldHdlZW4gdGhlIGxhc3QgYW5kIHNlY29uZCB0byBsYXN0IGxvY2F0aW9uc1xuICAgICAgICAgICAgICAgICAgLy9vciBhZnRlciB0aGUgbGFzdCBcbiAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLnBhdGhbdGhpcy5sb2NhdGlvbkNvdW50IC0gMV0udHlwZSA9PT0gJ3JlY2FyZWEnKXtcbiAgICAgICAgICAgICAgICAgICAgIC8vaWYgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhpcyBhcmVhIGFuZCB0aGUgc2Vjb25kIHRvIGxhc3QgXG4gICAgICAgICAgICAgICAgICAgICAvL2xvY2F0aW9uIGlzIGxlc3MgdGhhbiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgc2Vjb25kXG4gICAgICAgICAgICAgICAgICAgICAvL3RvIGxhc3QgbG9jYXRpb24gYW5kIHRoZSBsYXN0IGxvY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyclthcnIubGVuZ3RoIC0gMl0uZGlzdGFuY2UudmFsdWUgPCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnJvd3NbcmVzcG9uc2Uucm93cy5sZW5ndGggLSAyXS5lbGVtZW50c1thcnIubGVuZ3RoIC0gMV0uZGlzdGFuY2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChhcmVhTG9jYXRpb24sIGNsb3Nlc3RJbmRleCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKGFyZWFMb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvL290aGVyd2lzZSwgaW5zZXJ0IGl0IGJlZm9yZSB0aGUgZmluYWwgZGVzdGluYXRpb25cbiAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChhcmVhTG9jYXRpb24sIHRoaXMubG9jYXRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgc3RhdHVzID09PSAnTUFYX0VMRU1FTlRTX0VYQ0VFREVEJyAmJiBNYXRlcmlhbGl6ZS50b2FzdChcbiAgICAgICAgICAgICAgICAgICdUb28gbWFueSBsb2NhdGlvbnMgaW4gcm91dGUuIFRyeSBhZGRpbmcgaXQgbWFudWFsbHkuJ1xuICAgICAgICAgICAgICAgLCA0MDAwKTtcbiAgICAgICAgICAgICAgIGFyZWEuc2V0SW5Sb3V0ZShmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICBkaXN0YW5jZU1hdHJpeC5nZXREaXN0YW5jZU1hdHJpeCh7XG4gICAgICAgICAgICBvcmlnaW5zOiBbb3JpZ2luLCAuLi5kZXN0aW5hdGlvbnNdLFxuICAgICAgICAgICAgZGVzdGluYXRpb25zOiBbb3JpZ2luLCAuLi5kZXN0aW5hdGlvbnNdLFxuICAgICAgICAgICAgdHJhdmVsTW9kZTogJ0RSSVZJTkcnXG4gICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgICB9XG4gICB9XG4gICByZW1vdmVSZWNBcmVhKGFyZWEpe1xuICAgICAgdGhpcy5zaG91bGRab29tTWFwID0gZmFsc2U7XG4gICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5wYXRoLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgIGlmKHRoaXMucGF0aFtpXS5kYXRhID09PSBhcmVhKXtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICB9XG4gICAgICB9O1xuICAgfVxuXG4gICBtYWtlRXZlbnQoKXtcbiAgICAgIHJldHVybiB7dmFsOiB0aGlzLnBhdGh9XG4gICB9XG5cbiAgIHRvU3RyaW5nKCl7XG4gICAgICByZXR1cm4gJ3N0YXRlLnJvdXRlJztcbiAgIH1cbn1cblxuLyoqKioqKioqKioqKipcXCAgICBcbiAgICAgIE1hcCAgICBcblxcKioqKioqKioqKioqKi9cbmNsYXNzIERpcmVjdGlvbnMgZXh0ZW5kcyBFdmVudE9iamVjdHtcbiAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICBzdXBlcihbJ2NoYW5nZSddKTtcbiAgICAgIC8vYXJyYXkgb2YgY29vcmRpbmF0ZXMgYWxvbmcgZGlyZWN0aW9ucyByb3V0ZVxuICAgICAgdGhpcy5yb3V0ZUNvb3JkcyA9IFtdO1xuICAgICAgLy9hcnJheSBvZiBjb29yZGluYXRlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgcmVjIGFwaSBjYWxsc1xuICAgICAgdGhpcy5zZWFyY2hDb29yZHMgPSBbXTtcbiAgICAgIHRoaXMub3JpZ2luID0gbnVsbDtcbiAgIH1cblxuICAgdXBkYXRlKHJvdXRlKXtcbiAgICAgIGlmKHJvdXRlID09IG51bGwpe1xuICAgICAgICAgdGhpcy5yb3V0ZUNvb3JkcyA9IFtdO1xuICAgICAgICAgdGhpcy5zZWFyY2hDb29yZHMgPSBbXTtcbiAgICAgICAgIHRoaXMub3JpZ2luID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoIXJvdXRlLmxlZ3Mpe1xuICAgICAgICAgdGhpcy5yb3V0ZUNvb3JkcyA9IFtyb3V0ZV07XG4gICAgICAgICB0aGlzLnNlYXJjaENvb3JkcyA9IFtyb3V0ZV07XG4gICAgICAgICB0aGlzLm9yaWdpbiA9IHJvdXRlO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIHRoaXMub3JpZ2luID0gcm91dGUubGVnc1swXS5zdGFydF9sb2NhdGlvbjtcbiAgICAgICAgIHRoaXMucm91dGVDb29yZHMgPSByb3V0ZS5vdmVydmlld19wYXRoO1xuXG4gICAgICAgICAvL3JvdXRlIGNvb3JkaW5hdGVzIHNlcGFyYXRlZCBieSAxMDAgbWlsZXNcbiAgICAgICAgIHRoaXMuc2VhcmNoQ29vcmRzID0gdGhpcy5nZXRDb29yZHNCeVJhZGl1cygxNjA5MzQpO1xuICAgICAgICAgbGV0IGRpc3QgPSBnb29nbGUubWFwcy5nZW9tZXRyeS5zcGhlcmljYWwuY29tcHV0ZURpc3RhbmNlQmV0d2VlbihcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoQ29vcmRzW3RoaXMuc2VhcmNoQ29vcmRzLmxlbmd0aCAtIDFdLFxuICAgICAgICAgICAgdGhpcy5yb3V0ZUNvb3Jkc1t0aGlzLnJvdXRlQ29vcmRzLmxlbmd0aCAtIDFdXG4gICAgICAgICApO1xuICAgICAgICAgaWYoZGlzdCA+IDgwNDY3LjIpe1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hDb29yZHMucHVzaCh0aGlzLnJvdXRlQ29vcmRzW3RoaXMucm91dGVDb29yZHMubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgIH1cblxuICAgZ2V0Q29vcmRzQnlSYWRpdXMocmFkaXVzKXtcbiAgICAgIGlmKCF0aGlzLnJvdXRlQ29vcmRzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIHJldHVybiB0aGlzLnJvdXRlQ29vcmRzLnJlZHVjZSgoYXJyLCBjb29yZCkgPT4ge1xuICAgICAgICAgbGV0IGRpc3RhbmNlID0gZ29vZ2xlLm1hcHMuZ2VvbWV0cnkuc3BoZXJpY2FsLmNvbXB1dGVEaXN0YW5jZUJldHdlZW4oXG4gICAgICAgICAgICBjb29yZCwgYXJyW2Fyci5sZW5ndGggLSAxXSk7IFxuICAgICAgICAgaWYoZGlzdGFuY2UgPiByYWRpdXMpe1xuICAgICAgICAgICAgcmV0dXJuIGFyci5jb25jYXQoW2Nvb3JkXSk7XG4gICAgICAgICB9XG4gICAgICAgICBlbHNle1xuICAgICAgICAgICAgcmV0dXJuIGFycjtcbiAgICAgICAgIH1cbiAgICAgIH0sIFt0aGlzLm9yaWdpbl0pO1xuICAgfVxuXG4gICBtYWtlRXZlbnQoKXtcbiAgICAgIHJldHVybiB7dmFsOiB0aGlzfTtcbiAgIH1cbn1cblxuY2xhc3MgTWFwe1xuICAgY29uc3RydWN0b3IoKXtcbiAgICAgIHRoaXMuZGlyZWN0aW9ucyA9IG5ldyBEaXJlY3Rpb25zKCk7XG4gICB9XG4gICB0b1N0cmluZygpe1xuICAgICAgcmV0dXJuICdzdGF0ZS5tYXAnO1xuICAgfVxufVxuXG4vKioqKioqKioqKioqKipcXCAgICBcbiAgIFJlY3JlYXRpb24gICAgXG5cXCoqKioqKioqKioqKioqL1xuY29uc3QgcmVxdWlyZWRQcm9wcyA9IFtcbiAgICdSZWNBcmVhTmFtZScsXG4gICAnUkVDQVJFQUFERFJFU1MnLFxuICAgJ0ZBQ0lMSVRZJyxcbiAgICdPcmdSZWNBcmVhSUQnLFxuICAgJ0dFT0pTT04nLFxuICAgJ0xhc3RVcGRhdGVkRGF0ZScsXG4gICAnRVZFTlQnLFxuICAgJ09SR0FOSVpBVElPTicsXG4gICAnUmVjQXJlYUVtYWlsJyxcbiAgICdSZWNBcmVhUmVzZXJ2YXRpb25VUkwnLFxuICAgJ1JlY0FyZWFMb25naXR1ZGUnLFxuICAgJ1JlY0FyZWFJRCcsXG4gICAnUmVjQXJlYVBob25lJyxcbiAgICdNRURJQScsXG4gICAnTElOSycsXG4gICAnUmVjQXJlYURlc2NyaXB0aW9uJyxcbiAgICdSZWNBcmVhTWFwVVJMJyxcbiAgICdSZWNBcmVhTGF0aXR1ZGUnLFxuICAgJ1N0YXlMaW1pdCcsXG4gICAnUmVjQXJlYUZlZURlc2NyaXB0aW9uJyxcbiAgICdSZWNBcmVhRGlyZWN0aW9ucycsXG4gICAnS2V5d29yZHMnLFxuICAgJ0FDVElWSVRZJ1xuXTtcblxuY2xhc3MgUmVjQXJlYSBleHRlbmRzIEV2ZW50T2JqZWN0e1xuICAgY29uc3RydWN0b3IoYXJlYSl7XG4gICAgICBzdXBlcihbJ2Jvb2ttYXJrZWQnLCAnaW5yb3V0ZSddKTtcbiAgICAgIHRoaXMuaWQgPSBhcmVhLlJlY0FyZWFJRDtcbiAgICAgIHRoaXMuYWN0aXZpdGllcyA9IGFyZWEuQUNUSVZJVFkubWFwKGZ1bmN0aW9uKGEpeyBcbiAgICAgICAgIHJldHVybiBhLkFjdGl2aXR5SUQ7IFxuICAgICAgfSk7XG4gICAgICByZXF1aXJlZFByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCl7XG4gICAgICAgICB0aGlzW3Byb3BdID0gYXJlYVtwcm9wXTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgIHRoaXMuYm9va21hcmtlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5pblJvdXRlID0gZmFsc2U7XG5cbiAgICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICAgIHRoaXMubWFya2VyRGlzcGxheWVkID0gZmFsc2U7XG4gICAgICB0aGlzLm1hcmtlckhpZ2hsaWdodGVkID0gZmFsc2U7XG5cbiAgICAgIHRoaXMub24oJ2Jvb2ttYXJrZWQnLCAoKSA9PiB7XG4gICAgICAgICB1cGRhdGVJY29ucygnYm9va21hcmsnLCB0aGlzLmlkLCB0aGlzLmJvb2ttYXJrZWQpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm9uKCdpbnJvdXRlJywgKCkgPT4ge1xuICAgICAgICAgdXBkYXRlSWNvbnMoJ3JvdXRlJywgdGhpcy5pZCwgdGhpcy5pblJvdXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnNob3dEZXRhaWxzID0gdGhpcy5zaG93RGV0YWlscy5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5oaWdobGlnaHRNYXJrZXIgPSB0aGlzLmhpZ2hsaWdodE1hcmtlci5iaW5kKHRoaXMpXG4gICAgICB0aGlzLnVuSGlnaGxpZ2h0TWFya2VyID0gdGhpcy51bkhpZ2hsaWdodE1hcmtlci5iaW5kKHRoaXMpXG4gICB9XG4gICBzaG93RGV0YWlscyhlKXtcbiAgICAgIGlmKGUgJiYgZS5wcmV2ZW50RGVmYXVsdCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSBcbiAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHJpZXZlU2luZ2xlUmVjQXJlYSh0aGlzKTtcbiAgIH1cblxuICAgLy9XQVJOSU5HOiBzaG91bGQgb25seSBzZXQgb25lIGV2ZW50IGxpc3RlbmVyIHBlciBSZWNBcmVhXG4gICAvL3RoYXQgdXBkYXRlcyBhbGwgb2YgYSBjZXJ0YWluIGVsZW1lbnQgd2l0aCBkYXRhIG1hdGNoaW5nXG4gICAvL3RoZSBSZWNBcmVhIHRvIGF2b2lkIG1lbW9yeSBsZWFrcyBhbmQgaXNzdWVzIHdpdGggcmVtb3ZlZCBlbGVtZW50cyBcbiAgIHNldEJvb2ttYXJrZWQoLypib29sZWFuKi8gdmFsdWUpe1xuICAgICAgdGhpcy5ib29rbWFya2VkID0gdmFsdWU7XG4gICAgICB0aGlzLmVtaXQoJ2Jvb2ttYXJrZWQnKTtcbiAgICAgIGlmKCF2YWx1ZSl7XG4gICAgICAgICB0aGlzLnVuSGlnaGxpZ2h0TWFya2VyKCk7XG4gICAgICB9XG4gICB9XG4gICBzZXRJblJvdXRlKC8qYm9vbGVhbiovIHZhbHVlKXtcbiAgICAgIHRoaXMuaW5Sb3V0ZSA9IHZhbHVlO1xuICAgICAgaWYodGhpcy5tYXJrZXIpe1xuICAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZSghdmFsdWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5lbWl0KCdpbnJvdXRlJyk7XG4gICB9XG4gICAvL3NldEZvY3VzID4gY2hhbmdlXG5cbiAgIGhpZ2hsaWdodE1hcmtlcigpe1xuICAgICAgaWYodGhpcy5tYXJrZXIgJiYgIXRoaXMubWFya2VySGlnaGxpZ2h0ZWQpe1xuICAgICAgICAgdGhpcy5tYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xuICAgICAgICAgdGhpcy5tYXJrZXJIaWdobGlnaHRlZCA9IHRydWU7XG4gICAgICAgICBpZih0aGlzLmluUm91dGUpe1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZSh0cnVlKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cbiAgIHVuSGlnaGxpZ2h0TWFya2VyKCl7XG4gICAgICBpZih0aGlzLm1hcmtlciAmJiB0aGlzLm1hcmtlckhpZ2hsaWdodGVkKXtcbiAgICAgICAgIHRoaXMubWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgIHRoaXMubWFya2VySGlnaGxpZ2h0ZWQgPSBmYWxzZTtcbiAgICAgICAgIGlmKHRoaXMuaW5Sb3V0ZSl7XG4gICAgICAgICAgICB0aGlzLm1hcmtlci5zZXRWaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cblxuICAgYWRkTWFya2VyKCl7XG4gICAgICBsZXQgbGF0TG5nID0ge1xuICAgICAgICAgbGF0OiB0aGlzLlJlY0FyZWFMYXRpdHVkZSxcbiAgICAgICAgIGxuZzogdGhpcy5SZWNBcmVhTG9uZ2l0dWRlXG4gICAgICB9O1xuICAgICAgdGhpcy5tYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgIHBvc2l0aW9uOiBsYXRMbmcsXG4gICAgICAgICBtYXA6IG1hcFxuICAgICAgfSk7XG4gICAgICBsZXQgaW5mbyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICAgICAgIGNvbnRlbnQ6IHRoaXMubWFrZU1hcFByZXZpZXcoKVxuICAgICAgfSk7XG4gICAgICB0aGlzLm1hcmtlci5hZGRMaXN0ZW5lcignbW91c2VvdmVyJywgKGUpID0+IHtcbiAgICAgICAgIGluZm8ub3BlbihtYXAsIHRoaXMubWFya2VyKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5tYXJrZXIuYWRkTGlzdGVuZXIoJ21vdXNlb3V0JywgKGUpID0+IHtcbiAgICAgICAgIGluZm8uY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5zaG93RGV0YWlscyk7XG4gICB9XG5cbiAgIG1ha2VNYXBQcmV2aWV3KCl7XG4gICAgICByZXR1cm4gYFxuICAgICAgPHN0cm9uZz4ke3RoaXMuUmVjQXJlYU5hbWV9PC9zdHJvbmc+XG4gICAgICBgXG4gICB9XG5cbiAgIG1ha2VFdmVudChldmVudCl7XG4gICAgICAvL2NvbnNvbGUud2FybihldmVudCk7XG4gICB9XG4gICB0b1N0cmluZygpe1xuICAgICAgcmV0dXJuICdSZWNBcmVhJztcbiAgIH1cbn1cblxuY2xhc3MgUmVjQXJlYUNvbGxlY3Rpb24gZXh0ZW5kcyBFdmVudE9iamVjdHtcbiAgIGNvbnN0cnVjdG9yKG5hbWUpe1xuICAgICAgc3VwZXIoWydjaGFuZ2UnXSk7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gICAgICAvL2FycmF5IG9mIFwiUmVjQXJlYVwicyBcbiAgICAgIHRoaXMuUkVDREFUQSA9IFtdO1xuXG4gICAgICAvL2hhc2ggbWFwIGxpa2Ugc3RvcmFnZSBvZiB3aGljaCByZWMgYXJlYXMgYXJlIGN1cnJlbnRseSBcbiAgICAgIC8vaW4gdGhpcyBjb2xsZWN0aW9uIChieSBpZClcbiAgICAgIHRoaXMuaWRNYXAgPSB7fTtcbiAgIH1cblxuICAgYWRkRGF0YShyZWNkYXRhKXtcbiAgICAgIGxldCBjaGFuZ2UgPSBmYWxzZTtcbiAgICAgIGlmKCAhKHJlY2RhdGEgaW5zdGFuY2VvZiBBcnJheSkpe1xuICAgICAgICAgaWYoICEocmVjZGF0YSBpbnN0YW5jZW9mIFJlY0FyZWEpICl7XG4gICAgICAgICAgICByZWNkYXRhID0gbmV3IFJlY0FyZWEocmVjZGF0YSk7XG4gICAgICAgICB9XG4gICAgICAgICByZWNkYXRhID0gW3JlY2RhdGFdO1xuICAgICAgfVxuICAgICAgcmVjZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGFyZWEpe1xuICAgICAgICAgaWYoIXRoaXMuaWRNYXBbYXJlYS5pZF0pe1xuICAgICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuUkVDREFUQS5wdXNoKGFyZWEpO1xuICAgICAgICAgICAgdGhpcy5pZE1hcFthcmVhLmlkXSA9IHRydWU7XG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgaWYoY2hhbmdlKXtcbiAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICAgICB9XG4gICB9XG4gICBzZXREYXRhKHJlY2RhdGEpe1xuICAgICAgdGhpcy5pZE1hcCA9IHt9O1xuICAgICAgdGhpcy5SRUNEQVRBID0gW107XG4gICAgICBpZiggIShyZWNkYXRhIGluc3RhbmNlb2YgQXJyYXkpKXtcbiAgICAgICAgIHJlY2RhdGEgPSBbcmVjZGF0YV07XG4gICAgICB9XG4gICAgICByZWNkYXRhLmZvckVhY2goZnVuY3Rpb24oYXJlYSl7XG4gICAgICAgICB0aGlzLlJFQ0RBVEEucHVzaChhcmVhKTtcbiAgICAgICAgIHRoaXMuaWRNYXBbYXJlYS5pZF0gPSB0cnVlO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICB9XG4gICAvL2NoYW5nZSB0byBhbGxvdyBhbiBhcnJheSBvciBzb21ldGhpbmc/XG4gICByZW1vdmUoYXJlYSl7XG4gICAgICBpZih0aGlzLmlkTWFwW2FyZWEuaWRdKXtcbiAgICAgICAgIHRoaXMuUkVDREFUQS5zcGxpY2UodGhpcy5SRUNEQVRBLmluZGV4T2YoYXJlYSksIDEpO1xuICAgICAgICAgZGVsZXRlIHRoaXMuaWRNYXBbYXJlYS5pZF07XG4gICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgICAgfVxuICAgfVxuXG4gICBtYWtlRXZlbnQoKXtcbiAgICAgIHJldHVybiB7dmFsOiB0aGlzLlJFQ0RBVEF9XG4gICB9XG4gICB0b1N0cmluZygpe1xuICAgICAgcmV0dXJuIGBzdGF0ZS5yZWNyZWF0aW9uLiR7dGhpcy5uYW1lfWA7XG4gICB9XG59XG5cbmNsYXNzIFJlY1N0YXR1cyBleHRlbmRzIEV2ZW50T2JqZWN0e1xuICAgY29uc3RydWN0b3IoKXtcbiAgICAgIHN1cGVyKFsnY2hhbmdlJywgJ3BlcmNlbnQnXSk7XG4gICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucGVyY2VudExvYWRlZCA9IDEwMDtcbiAgICAgIHRoaXMuc2hvdWxkTG9hZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jYW5Mb2FkID0gZmFsc2U7XG4gICAgICB0aGlzLmZpcnN0TG9hZCA9IHRydWU7XG5cbiAgICAgIHRoaXMubG9hZGVkQWN0aXZpdGllcyA9IHt9O1xuICAgICAgdGhpcy5maWx0ZXJlZEFjdGl2aXRpZXMgPSB7fTtcblxuICAgICAgdGhpcy5sb2FkZWRTZWFyY2hDb29yZHMgPSBbXTtcbiAgICAgIC8vaWYgdGhlIHJvdXRlIGNoYW5nZXMsIHRoaXMgc2hvdWxkIGJlIHRydWUuXG4gICAgICB0aGlzLnNob3VsZFJlc2V0TG9hZGVkQWN0aXZpdGllcyA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG91bGRSZXNldExvYWRlZENvb3JkcyA9IGZhbHNlO1xuICAgfVxuICAgdXBkYXRlKHtsb2FkaW5nLCBwZXJjZW50TG9hZGVkLCBzaG91bGRMb2FkLCBjYW5Mb2FkLCBmaXJzdExvYWR9ID0ge30pe1xuICAgICAgbGV0IGNoYW5nZSA9IGZhbHNlO1xuICAgICAgaWYobG9hZGluZyAhPT0gdW5kZWZpbmVkICYmIGxvYWRpbmcgIT09IHRoaXMubG9hZGluZyl7XG4gICAgICAgICB0aGlzLmxvYWRpbmcgPSBsb2FkaW5nO1xuICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmKHNob3VsZExvYWQgIT09IHVuZGVmaW5lZCAmJiBzaG91bGRMb2FkICE9PSB0aGlzLnNob3VsZExvYWQpe1xuICAgICAgICAgdGhpcy5zaG91bGRMb2FkID0gc2hvdWxkTG9hZDtcbiAgICAgICAgIGNoYW5nZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZihjYW5Mb2FkICE9PSB1bmRlZmluZWQgJiYgY2FuTG9hZCAhPT0gdGhpcy5jYW5Mb2FkKXtcbiAgICAgICAgIHRoaXMuY2FuTG9hZCA9IGNhbkxvYWQ7XG4gICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYoZmlyc3RMb2FkICE9PSB1bmRlZmluZWQgJiYgZmlyc3RMb2FkICE9PSB0aGlzLmZpcnN0TG9hZCl7XG4gICAgICAgICB0aGlzLmZpcnN0TG9hZCA9IGZpcnN0TG9hZDtcbiAgICAgICAgIGNoYW5nZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZihjaGFuZ2Upe1xuICAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgICAgIH1cbiAgICAgIGlmKHBlcmNlbnRMb2FkZWQgIT09IHVuZGVmaW5lZCAmJiBwZXJjZW50TG9hZGVkICE9PSB0aGlzLnBlcmNlbnRMb2FkZWQpe1xuICAgICAgICAgdGhpcy5wZXJjZW50TG9hZGVkID0gcGVyY2VudExvYWRlZDtcbiAgICAgICAgIHRoaXMuZW1pdCgncGVyY2VudCcpO1xuICAgICAgfVxuICAgfVxuXG4gICBtYWtlRXZlbnQoKXtcbiAgICAgIHJldHVybiB7dmFsOiB7XG4gICAgICAgICBsb2FkaW5nOiB0aGlzLmxvYWRpbmcsXG4gICAgICAgICBwZXJjZW50TG9hZGVkOiB0aGlzLnBlcmNlbnRMb2FkZWQsXG4gICAgICAgICBzaG91bGRMb2FkOiB0aGlzLnNob3VsZExvYWQsXG4gICAgICAgICBmaXJzdExvYWQ6IHRoaXMuZmlyc3RMb2FkLFxuICAgICAgICAgY2FuTG9hZDogdGhpcy5jYW5Mb2FkXG4gICAgICB9fTtcbiAgIH1cblxuICAgdG9TdHJpbmcoKXtcbiAgICAgIHJldHVybiAnc3RhdGUucmVjcmVhdGlvbi5zdGF0dXMnO1xuICAgfVxufVxuXG5jbGFzcyBSZWNyZWF0aW9ue1xuICAgY29uc3RydWN0b3IoKXtcbiAgICAgIHRoaXMuYWxsID0gbmV3IFJlY0FyZWFDb2xsZWN0aW9uKCdhbGwnKTtcbiAgICAgIHRoaXMuZmlsdGVyZWQgPSBuZXcgUmVjQXJlYUNvbGxlY3Rpb24oJ2ZpbHRlcmVkJyk7XG4gICAgICB0aGlzLmJvb2ttYXJrZWQgPSBuZXcgUmVjQXJlYUNvbGxlY3Rpb24oJ2Jvb2ttYXJrZWQnKTtcbiAgICAgIC8vdGhpcy5pblJvdXRlID0gbmV3IFJlY0FyZWFDb2xsZWN0aW9uKCdpblJvdXRlJyk7XG5cbiAgICAgIC8vc2VhcmNoUmFkaXVzIGluIG1ldGVyc1xuICAgICAgdGhpcy5zZWFyY2hSYWRpdXMgPSA4MDQ2Ny4yO1xuXG4gICAgICB0aGlzLmFwaUNhbGwgPSByZWNBcGlRdWVyeTtcblxuICAgICAgdGhpcy5zdGF0dXMgPSBuZXcgUmVjU3RhdHVzO1xuICAgICAgdGhpcy5zZWFyY2ggPSB0aGlzLnNlYXJjaC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5maWx0ZXJBbGwgPSB0aGlzLmZpbHRlckFsbC5iaW5kKHRoaXMpO1xuICAgfVxuICAgYWRkUmVjQXJlYXMocmVjZGF0YSl7XG4gICAgICB2YXIgZGF0YSA9IHJlY2RhdGEucmVkdWNlKGZ1bmN0aW9uKGFyciwgYXJlYSl7XG4gICAgICAgICBsZXQgdGVtcCA9IFtdO1xuICAgICAgICAgaWYoICF0aGlzLmFsbC5pZE1hcFthcmVhLlJlY0FyZWFJRF0gKXtcbiAgICAgICAgICAgIHRlbXAucHVzaChuZXcgUmVjQXJlYShhcmVhKSk7XG4gICAgICAgICB9XG4gICAgICAgICByZXR1cm4gYXJyLmNvbmNhdCh0ZW1wKTtcbiAgICAgIH0uYmluZCh0aGlzKSwgW10pO1xuICAgICAgdGhpcy5hbGwuYWRkRGF0YShkYXRhKTtcbiAgIH1cblxuICAgYWRkQm9va21hcmsoYXJlYSl7XG4gICAgICBpZighdGhpcy5ib29rbWFya2VkLmlkTWFwW2FyZWEuaWRdKXtcbiAgICAgICAgIGFyZWEuc2V0Qm9va21hcmtlZCh0cnVlKTtcbiAgICAgICAgIHRoaXMuYm9va21hcmtlZC5hZGREYXRhKGFyZWEpO1xuICAgICAgfVxuICAgfVxuICAgcmVtb3ZlQm9va21hcmsoYXJlYSl7XG4gICAgICBpZih0aGlzLmJvb2ttYXJrZWQuaWRNYXBbYXJlYS5pZF0pe1xuICAgICAgICAgYXJlYS5zZXRCb29rbWFya2VkKGZhbHNlKTtcbiAgICAgICAgIHRoaXMuYm9va21hcmtlZC5yZW1vdmUoYXJlYSk7XG4gICAgICB9XG4gICB9XG4gICB0b2dnbGVCb29rbWFyayhhcmVhKXtcbiAgICAgIGlmKGFyZWEuYm9va21hcmtlZCl7XG4gICAgICAgICB0aGlzLnJlbW92ZUJvb2ttYXJrKGFyZWEpO1xuICAgICAgICAgTWF0ZXJpYWxpemUudG9hc3QoJ0Jvb2ttYXJrIHJlbW92ZWQhJywgMTAwMCk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAgdGhpcy5hZGRCb29rbWFyayhhcmVhKTtcbiAgICAgICAgIE1hdGVyaWFsaXplLnRvYXN0KCdCb29rbWFyayBhZGRlZCEnLCAxMDAwKTtcbiAgICAgIH1cbiAgIH1cbiAgIGFkZFRvUm91dGUoYXJlYSl7XG4gICAgICBpZighYXJlYS5pblJvdXRlKXtcbiAgICAgICAgIGFyZWEuc2V0SW5Sb3V0ZSh0cnVlKTtcbiAgICAgICAgIHN0YXRlLnJvdXRlLmFkZFJlY0FyZWEoYXJlYSk7XG4gICAgICB9XG4gICAgICAvL2Vsc2UgY291bGQgc2hvdyB0b2FzdCBzYXlpbmcgaXQncyBhbHJlYWR5IGluIHJvdXRlIFxuICAgfVxuICAgcmVtb3ZlRnJvbVJvdXRlKGFyZWEpe1xuICAgICAgaWYoYXJlYS5pblJvdXRlKXtcbiAgICAgICAgIGFyZWEuc2V0SW5Sb3V0ZShmYWxzZSk7XG4gICAgICAgICBzdGF0ZS5yb3V0ZS5yZW1vdmVSZWNBcmVhKGFyZWEpO1xuICAgICAgfVxuICAgfVxuICAgdG9nZ2xlSW5Sb3V0ZShhcmVhKXtcbiAgICAgIGlmKGFyZWEuaW5Sb3V0ZSl7XG4gICAgICAgICB0aGlzLnJlbW92ZUZyb21Sb3V0ZShhcmVhKTtcbiAgICAgICAgIGlmKCFhcmVhLmluUm91dGUpIE1hdGVyaWFsaXplLnRvYXN0KCdSZW1vdmVkIGZyb20gUm91dGUhJywgMTAwMCk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAgdGhpcy5hZGRUb1JvdXRlKGFyZWEpO1xuICAgICAgICAgaWYoYXJlYS5pblJvdXRlKSBNYXRlcmlhbGl6ZS50b2FzdCgnQWRkZWQgdG8gUm91dGUhJywgMTAwMCk7XG4gICAgICB9XG4gICB9XG5cbiAgIC8vc2VuZHMgYXBpIHJlcXVlc3QocykgXG4gICBzZWFyY2goKXtcbiAgICAgIHZhciByZXF1ZXN0Q291bnQgPSAwO1xuICAgICAgaWYodGhpcy5zdGF0dXMuc2hvdWxkUmVzZXRMb2FkZWRBY3Rpdml0aWVzKXtcbiAgICAgICAgIHRoaXMuc3RhdHVzLmxvYWRlZEFjdGl2aXRpZXMgPSB7fTtcbiAgICAgICAgIHRoaXMuc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQWN0aXZpdGllcyA9IGZhbHNlO1xuICAgICAgICAgLy9jbGVhciB0aGlzLmFsbD8/P1xuICAgICAgfVxuICAgICAgaWYodGhpcy5zdGF0dXMuc2hvdWxkUmVzZXRMb2FkZWRDb29yZHMpe1xuICAgICAgICAgdGhpcy5zdGF0dXMuc2hvdWxkUmVzZXRMb2FkZWRDb29yZHMgPSBmYWxzZTtcbiAgICAgICAgIC8vY2xlYXIgdGhpcy5hbGw/Pz9cbiAgICAgIH1cbiAgICAgIHRoaXMuc3RhdHVzLmxvYWRlZFNlYXJjaENvb3JkcyA9IHN0YXRlLm1hcC5kaXJlY3Rpb25zLnNlYXJjaENvb3JkcztcblxuICAgICAgdmFyIGxvYWRlZCA9IHRoaXMuc3RhdHVzLmxvYWRlZEFjdGl2aXRpZXM7XG4gICAgICB2YXIgaW50ZXJlc3RzID0gc3RhdGUuaW50ZXJlc3RzLnNlbGVjdGVkLnJlZHVjZSgoaWRTdHJpbmcsIGludGVyZXN0KSA9PiB7XG4gICAgICAgICAvL2lmIHdlJ3ZlIGFscmVhZHkgbG9hZGVkIHJlY2FyZWFzIHdpdGggdGhpcyBhY3Rpdml0eSwgZG9uJ3QgYWRkIHRvIGFjdGl2aXRpZXNcbiAgICAgICAgIGlmKGxvYWRlZFtpbnRlcmVzdC5pZF0pe1xuICAgICAgICAgICAgcmV0dXJuIGlkU3RyaW5nO1xuICAgICAgICAgfVxuICAgICAgICAgLy9vdGhlcndpc2UsIHdlIHdpbGwgbG9hZCBpdCBhbmQga2VlcCB0cmFja1xuICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGxvYWRlZFtpbnRlcmVzdC5pZF0gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMuZmlsdGVyZWRBY3Rpdml0aWVzW2ludGVyZXN0LmlkXSA9IHRydWU7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGlmKCBpZFN0cmluZy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gaWRTdHJpbmcgKyAnLCcgKyBpbnRlcmVzdC5pZDtcbiAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBpZFN0cmluZyArIGludGVyZXN0LmlkO1xuICAgICAgfSwgJycpO1xuXG5cbiAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgIHRoaXMuYWRkUmVjQXJlYXMocmVzcG9uc2UuUkVDREFUQSk7XG4gICAgICAgICByZXF1ZXN0Q291bnQgLT0gMTtcbiAgICAgICAgIGlmKHJlcXVlc3RDb3VudCA9PT0gMCApe1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMudXBkYXRlKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJBbGwodHJ1ZSk7XG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgIC8vdGVtcG9yYXJ5Li4uIGV2ZW50dWFsbHkgY2hhbmdlIHRvIGFsb25nIHJvdXRlXG4gICAgICBzdGF0ZS5tYXAuZGlyZWN0aW9ucy5zZWFyY2hDb29yZHMuZm9yRWFjaCgobCkgPT4ge1xuICAgICAgICAgcmVxdWVzdENvdW50ICs9IDE7XG4gICAgICAgICB0aGlzLmFwaUNhbGwoXG4gICAgICAgICAgICBsLmxhdCgpLFxuICAgICAgICAgICAgbC5sbmcoKSxcbiAgICAgICAgICAgIDEwMCxcbiAgICAgICAgICAgIGludGVyZXN0cyxcbiAgICAgICAgICAgIGNhbGxiYWNrXG4gICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuc3RhdHVzLnVwZGF0ZSh7c2hvdWxkTG9hZDogZmFsc2UsIGxvYWRpbmc6IHRydWUsIGZpcnN0TG9hZDogZmFsc2V9KTtcbiAgIH1cblxuICAgZmlsdGVyQWxsKGZpdE1hcCl7XG4gICAgICBjb25zdCBtYXBCb3VuZHMgPSBtYXAuZ2V0Qm91bmRzKCk7XG4gICAgICBsZXQgbWFya2VyQm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgICAgbWFya2VyQm91bmRzLmV4dGVuZChtYXBCb3VuZHMuZ2V0Tm9ydGhFYXN0KCkpO1xuICAgICAgbWFya2VyQm91bmRzLmV4dGVuZChtYXBCb3VuZHMuZ2V0U291dGhXZXN0KCkpO1xuICAgICAgdmFyIGRhdGE7XG4gICAgICBpZighc3RhdGUuaW50ZXJlc3RzLnNlbGVjdGVkLmxlbmd0aCl7XG4gICAgICAgICBkYXRhID0gW107XG4gICAgICB9XG4gICAgICBlbHNlIGlmKCFzdGF0ZS5yb3V0ZS5sb2NhdGlvbkNvdW50KXtcbiAgICAgICAgIGRhdGEgPSBbXTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgICBkYXRhID0gdGhpcy5hbGwuUkVDREFUQTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZpbHRlckNvb3JkcyA9IHN0YXRlLm1hcC5kaXJlY3Rpb25zLmdldENvb3Jkc0J5UmFkaXVzKHRoaXMuc2VhcmNoUmFkaXVzKTtcbiAgICAgIGRhdGEgPSBkYXRhLmZpbHRlcigoYXJlYSkgPT4ge1xuICAgICAgICAgdmFyIGNvb3JkID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyh7XG4gICAgICAgICAgICBsYXQ6IGFyZWEuUmVjQXJlYUxhdGl0dWRlLFxuICAgICAgICAgICAgbG5nOiBhcmVhLlJlY0FyZWFMb25naXR1ZGVcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICAvL2lmIGl0J3Mgbm90IGEgbmV3IGxvYWQsIGZpbHRlciBiYXNlZCBvbiBtYXAgdmlld3BvcnRcbiAgICAgICAgIGlmKCFmaXRNYXAgJiYgIW1hcEJvdW5kcy5jb250YWlucyhjb29yZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgIH1cblxuICAgICAgICAgLy9maWx0ZXIgYmFzZWQgb24gcHJveGltaXR5IHRvIHJvdXRlXG4gICAgICAgICB2YXIgaXNBbG9uZ1JvdXRlID0gZmFsc2U7XG4gICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZmlsdGVyQ29vcmRzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIGxldCBkaXN0YW5jZSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKFxuICAgICAgICAgICAgICAgZmlsdGVyQ29vcmRzW2ldLCBjb29yZCk7XG4gICAgICAgICAgICBpZiggZGlzdGFuY2UgPCB0aGlzLnNlYXJjaFJhZGl1cyl7XG4gICAgICAgICAgICAgICBpc0Fsb25nUm91dGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICAgICBpZighaXNBbG9uZ1JvdXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICB9XG5cblxuICAgICAgICAgLy9maWx0ZXIgYmFzZWQgb24gc2VsZWN0ZWQgYWN0aXZpdGllc1xuICAgICAgICAgdmFyIGhhc0FjdGl2aXR5ID0gZmFsc2U7XG4gICAgICAgICBmb3IoIGxldCBpID0gMDsgaSA8IGFyZWEuYWN0aXZpdGllcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBsZXQgYWN0aXZpdHkgPSBhcmVhLmFjdGl2aXRpZXNbaV07XG4gICAgICAgICAgICBpZihzdGF0ZS5yZWNyZWF0aW9uLnN0YXR1cy5maWx0ZXJlZEFjdGl2aXRpZXNbYWN0aXZpdHldKXtcbiAgICAgICAgICAgICAgIGhhc0FjdGl2aXR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgICAgaWYoIWhhc0FjdGl2aXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICB9XG5cbiAgICAgICAgIG1hcmtlckJvdW5kcy5leHRlbmQoY29vcmQpO1xuICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KVxuXG4gICAgICB0aGlzLmZpbHRlcmVkLnNldERhdGEoZGF0YSk7XG5cbiAgICAgIC8vaWYgdGhlIGZpbHRlciBpcyBkdWUgdG8gbmV3IGxvYWQsIGFuZCB0aGVyZSBhcmUgcG9pbnRzLFxuICAgICAgLy9hbmQgdGhlIGJvdW5kcyB0byBjb250YWluIHRoZXNlIHBvaW50cyBhcmUgbGFyZ2VyIHRoYW4gdGhlIFxuICAgICAgLy9jdXJyZW50IHZpZXdwb3J0LCBjaGFuZ2UgdGhlIG1hcCB2aWV3cG9ydCB0byBzaG93IGV2ZXJ5dGhpbmdcbiAgICAgIGlmKGZpdE1hcCAmJiBkYXRhLmxlbmd0aCl7XG4gICAgICAgICBpZiggbWFya2VyQm91bmRzLmVxdWFscyhtYXBCb3VuZHMpIClcbiAgICAgICAgICAgIG1hcC5maXRCb3VuZHMobWFya2VyQm91bmRzLCAwKTtcbiAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1hcC5maXRCb3VuZHMobWFya2VyQm91bmRzKTtcbiAgICAgIH1cbiAgIH1cblxuICAgdG9TdHJpbmcoKXtcbiAgICAgIHJldHVybiAnc3RhdGUucmVjcmVhdGlvbic7XG4gICB9XG59XG5cbi8qKioqKioqKioqKioqXFwgICAgXG4gT3ZlcmFsbCBTdGF0ZVxuXFwqKioqKioqKioqKioqL1xuY2xhc3MgU3RhdGUgZXh0ZW5kcyBFdmVudE9iamVjdHtcbiAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICBzdXBlcihbJ3JlYWR5J10pO1xuICAgICAgdGhpcy5yZWNyZWF0aW9uID0gbmV3IFJlY3JlYXRpb24oKTtcbiAgICAgIHRoaXMucm91dGUgPSBuZXcgUm91dGUoKTtcbiAgICAgIHRoaXMuaW50ZXJlc3RzID0gbmV3IEludGVyZXN0cyhpbnRlcmVzdExpc3QpO1xuICAgICAgdGhpcy5tYXAgPSBuZXcgTWFwKCk7XG4gICB9XG4gICBcbiAgIC8vcmVmYWN0b3IgdGhpcywgdXNlIGV4cG9ydCBhbmQgaW1wb3J0IGZyb20gYSBzZXBhcmF0ZSBmaWxlIChub3QgcmVjcmVhdGlvbi5qcylcbiAgIC8vIHNldEludGVyZXN0cyhsaXN0KXtcbiAgIC8vICAgIHRoaXMuaW50ZXJlc3RzID0gbmV3IEludGVyZXN0cyhsaXN0KTtcbiAgIC8vIH1cbiAgIHRvU3RyaW5nKCl7XG4gICAgICByZXR1cm4gJ3N0YXRlJztcbiAgIH1cbiAgIG1ha2VFdmVudCgpe1xuICAgICAgcmV0dXJuIHt2YWw6IG51bGx9O1xuICAgfVxufVxuXG5jb25zdCBzdGF0ZSA9IG5ldyBTdGF0ZTtcblxuXG5leHBvcnQgZGVmYXVsdCBzdGF0ZTtcblxuXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL3N0YXRlL3N0YXRlLmpzXG4vLyBtb2R1bGUgaWQgPSAwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qXG5cdE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cdEF1dGhvciBUb2JpYXMgS29wcGVycyBAc29rcmFcbiovXG4vLyBjc3MgYmFzZSBjb2RlLCBpbmplY3RlZCBieSB0aGUgY3NzLWxvYWRlclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1c2VTb3VyY2VNYXApIHtcblx0dmFyIGxpc3QgPSBbXTtcblxuXHQvLyByZXR1cm4gdGhlIGxpc3Qgb2YgbW9kdWxlcyBhcyBjc3Mgc3RyaW5nXG5cdGxpc3QudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHRcdHZhciBjb250ZW50ID0gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtLCB1c2VTb3VyY2VNYXApO1xuXHRcdFx0aWYoaXRlbVsyXSkge1xuXHRcdFx0XHRyZXR1cm4gXCJAbWVkaWEgXCIgKyBpdGVtWzJdICsgXCJ7XCIgKyBjb250ZW50ICsgXCJ9XCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY29udGVudDtcblx0XHRcdH1cblx0XHR9KS5qb2luKFwiXCIpO1xuXHR9O1xuXG5cdC8vIGltcG9ydCBhIGxpc3Qgb2YgbW9kdWxlcyBpbnRvIHRoZSBsaXN0XG5cdGxpc3QuaSA9IGZ1bmN0aW9uKG1vZHVsZXMsIG1lZGlhUXVlcnkpIHtcblx0XHRpZih0eXBlb2YgbW9kdWxlcyA9PT0gXCJzdHJpbmdcIilcblx0XHRcdG1vZHVsZXMgPSBbW251bGwsIG1vZHVsZXMsIFwiXCJdXTtcblx0XHR2YXIgYWxyZWFkeUltcG9ydGVkTW9kdWxlcyA9IHt9O1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaWQgPSB0aGlzW2ldWzBdO1xuXHRcdFx0aWYodHlwZW9mIGlkID09PSBcIm51bWJlclwiKVxuXHRcdFx0XHRhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2lkXSA9IHRydWU7XG5cdFx0fVxuXHRcdGZvcihpID0gMDsgaSA8IG1vZHVsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpdGVtID0gbW9kdWxlc1tpXTtcblx0XHRcdC8vIHNraXAgYWxyZWFkeSBpbXBvcnRlZCBtb2R1bGVcblx0XHRcdC8vIHRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IDEwMCUgcGVyZmVjdCBmb3Igd2VpcmQgbWVkaWEgcXVlcnkgY29tYmluYXRpb25zXG5cdFx0XHQvLyAgd2hlbiBhIG1vZHVsZSBpcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIGRpZmZlcmVudCBtZWRpYSBxdWVyaWVzLlxuXHRcdFx0Ly8gIEkgaG9wZSB0aGlzIHdpbGwgbmV2ZXIgb2NjdXIgKEhleSB0aGlzIHdheSB3ZSBoYXZlIHNtYWxsZXIgYnVuZGxlcylcblx0XHRcdGlmKHR5cGVvZiBpdGVtWzBdICE9PSBcIm51bWJlclwiIHx8ICFhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2l0ZW1bMF1dKSB7XG5cdFx0XHRcdGlmKG1lZGlhUXVlcnkgJiYgIWl0ZW1bMl0pIHtcblx0XHRcdFx0XHRpdGVtWzJdID0gbWVkaWFRdWVyeTtcblx0XHRcdFx0fSBlbHNlIGlmKG1lZGlhUXVlcnkpIHtcblx0XHRcdFx0XHRpdGVtWzJdID0gXCIoXCIgKyBpdGVtWzJdICsgXCIpIGFuZCAoXCIgKyBtZWRpYVF1ZXJ5ICsgXCIpXCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0bGlzdC5wdXNoKGl0ZW0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0cmV0dXJuIGxpc3Q7XG59O1xuXG5mdW5jdGlvbiBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0sIHVzZVNvdXJjZU1hcCkge1xuXHR2YXIgY29udGVudCA9IGl0ZW1bMV0gfHwgJyc7XG5cdHZhciBjc3NNYXBwaW5nID0gaXRlbVszXTtcblx0aWYgKCFjc3NNYXBwaW5nKSB7XG5cdFx0cmV0dXJuIGNvbnRlbnQ7XG5cdH1cblxuXHRpZiAodXNlU291cmNlTWFwICYmIHR5cGVvZiBidG9hID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0dmFyIHNvdXJjZU1hcHBpbmcgPSB0b0NvbW1lbnQoY3NzTWFwcGluZyk7XG5cdFx0dmFyIHNvdXJjZVVSTHMgPSBjc3NNYXBwaW5nLnNvdXJjZXMubWFwKGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0XHRcdHJldHVybiAnLyojIHNvdXJjZVVSTD0nICsgY3NzTWFwcGluZy5zb3VyY2VSb290ICsgc291cmNlICsgJyAqLydcblx0XHR9KTtcblxuXHRcdHJldHVybiBbY29udGVudF0uY29uY2F0KHNvdXJjZVVSTHMpLmNvbmNhdChbc291cmNlTWFwcGluZ10pLmpvaW4oJ1xcbicpO1xuXHR9XG5cblx0cmV0dXJuIFtjb250ZW50XS5qb2luKCdcXG4nKTtcbn1cblxuLy8gQWRhcHRlZCBmcm9tIGNvbnZlcnQtc291cmNlLW1hcCAoTUlUKVxuZnVuY3Rpb24gdG9Db21tZW50KHNvdXJjZU1hcCkge1xuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcblx0dmFyIGJhc2U2NCA9IGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCkpKSk7XG5cdHZhciBkYXRhID0gJ3NvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LCcgKyBiYXNlNjQ7XG5cblx0cmV0dXJuICcvKiMgJyArIGRhdGEgKyAnICovJztcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qXG5cdE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cdEF1dGhvciBUb2JpYXMgS29wcGVycyBAc29rcmFcbiovXG5cbnZhciBzdHlsZXNJbkRvbSA9IHt9O1xuXG52YXJcdG1lbW9pemUgPSBmdW5jdGlvbiAoZm4pIHtcblx0dmFyIG1lbW87XG5cblx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodHlwZW9mIG1lbW8gPT09IFwidW5kZWZpbmVkXCIpIG1lbW8gPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdHJldHVybiBtZW1vO1xuXHR9O1xufTtcblxudmFyIGlzT2xkSUUgPSBtZW1vaXplKGZ1bmN0aW9uICgpIHtcblx0Ly8gVGVzdCBmb3IgSUUgPD0gOSBhcyBwcm9wb3NlZCBieSBCcm93c2VyaGFja3Ncblx0Ly8gQHNlZSBodHRwOi8vYnJvd3NlcmhhY2tzLmNvbS8jaGFjay1lNzFkODY5MmY2NTMzNDE3M2ZlZTcxNWMyMjJjYjgwNVxuXHQvLyBUZXN0cyBmb3IgZXhpc3RlbmNlIG9mIHN0YW5kYXJkIGdsb2JhbHMgaXMgdG8gYWxsb3cgc3R5bGUtbG9hZGVyXG5cdC8vIHRvIG9wZXJhdGUgY29ycmVjdGx5IGludG8gbm9uLXN0YW5kYXJkIGVudmlyb25tZW50c1xuXHQvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvc3R5bGUtbG9hZGVyL2lzc3Vlcy8xNzdcblx0cmV0dXJuIHdpbmRvdyAmJiBkb2N1bWVudCAmJiBkb2N1bWVudC5hbGwgJiYgIXdpbmRvdy5hdG9iO1xufSk7XG5cbnZhciBnZXRFbGVtZW50ID0gKGZ1bmN0aW9uIChmbikge1xuXHR2YXIgbWVtbyA9IHt9O1xuXG5cdHJldHVybiBmdW5jdGlvbihzZWxlY3Rvcikge1xuXHRcdGlmICh0eXBlb2YgbWVtb1tzZWxlY3Rvcl0gPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdG1lbW9bc2VsZWN0b3JdID0gZm4uY2FsbCh0aGlzLCBzZWxlY3Rvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lbW9bc2VsZWN0b3JdXG5cdH07XG59KShmdW5jdGlvbiAodGFyZ2V0KSB7XG5cdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldClcbn0pO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcbnZhclx0c2luZ2xldG9uQ291bnRlciA9IDA7XG52YXJcdHN0eWxlc0luc2VydGVkQXRUb3AgPSBbXTtcblxudmFyXHRmaXhVcmxzID0gcmVxdWlyZShcIi4vdXJsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsaXN0LCBvcHRpb25zKSB7XG5cdGlmICh0eXBlb2YgREVCVUcgIT09IFwidW5kZWZpbmVkXCIgJiYgREVCVUcpIHtcblx0XHRpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3R5bGUtbG9hZGVyIGNhbm5vdCBiZSB1c2VkIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRcIik7XG5cdH1cblxuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRvcHRpb25zLmF0dHJzID0gdHlwZW9mIG9wdGlvbnMuYXR0cnMgPT09IFwib2JqZWN0XCIgPyBvcHRpb25zLmF0dHJzIDoge307XG5cblx0Ly8gRm9yY2Ugc2luZ2xlLXRhZyBzb2x1dGlvbiBvbiBJRTYtOSwgd2hpY2ggaGFzIGEgaGFyZCBsaW1pdCBvbiB0aGUgIyBvZiA8c3R5bGU+XG5cdC8vIHRhZ3MgaXQgd2lsbCBhbGxvdyBvbiBhIHBhZ2Vcblx0aWYgKCFvcHRpb25zLnNpbmdsZXRvbikgb3B0aW9ucy5zaW5nbGV0b24gPSBpc09sZElFKCk7XG5cblx0Ly8gQnkgZGVmYXVsdCwgYWRkIDxzdHlsZT4gdGFncyB0byB0aGUgPGhlYWQ+IGVsZW1lbnRcblx0aWYgKCFvcHRpb25zLmluc2VydEludG8pIG9wdGlvbnMuaW5zZXJ0SW50byA9IFwiaGVhZFwiO1xuXG5cdC8vIEJ5IGRlZmF1bHQsIGFkZCA8c3R5bGU+IHRhZ3MgdG8gdGhlIGJvdHRvbSBvZiB0aGUgdGFyZ2V0XG5cdGlmICghb3B0aW9ucy5pbnNlcnRBdCkgb3B0aW9ucy5pbnNlcnRBdCA9IFwiYm90dG9tXCI7XG5cblx0dmFyIHN0eWxlcyA9IGxpc3RUb1N0eWxlcyhsaXN0LCBvcHRpb25zKTtcblxuXHRhZGRTdHlsZXNUb0RvbShzdHlsZXMsIG9wdGlvbnMpO1xuXG5cdHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKG5ld0xpc3QpIHtcblx0XHR2YXIgbWF5UmVtb3ZlID0gW107XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGl0ZW0gPSBzdHlsZXNbaV07XG5cdFx0XHR2YXIgZG9tU3R5bGUgPSBzdHlsZXNJbkRvbVtpdGVtLmlkXTtcblxuXHRcdFx0ZG9tU3R5bGUucmVmcy0tO1xuXHRcdFx0bWF5UmVtb3ZlLnB1c2goZG9tU3R5bGUpO1xuXHRcdH1cblxuXHRcdGlmKG5ld0xpc3QpIHtcblx0XHRcdHZhciBuZXdTdHlsZXMgPSBsaXN0VG9TdHlsZXMobmV3TGlzdCwgb3B0aW9ucyk7XG5cdFx0XHRhZGRTdHlsZXNUb0RvbShuZXdTdHlsZXMsIG9wdGlvbnMpO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbWF5UmVtb3ZlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgZG9tU3R5bGUgPSBtYXlSZW1vdmVbaV07XG5cblx0XHRcdGlmKGRvbVN0eWxlLnJlZnMgPT09IDApIHtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBkb21TdHlsZS5wYXJ0cy5sZW5ndGg7IGorKykgZG9tU3R5bGUucGFydHNbal0oKTtcblxuXHRcdFx0XHRkZWxldGUgc3R5bGVzSW5Eb21bZG9tU3R5bGUuaWRdO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn07XG5cbmZ1bmN0aW9uIGFkZFN0eWxlc1RvRG9tIChzdHlsZXMsIG9wdGlvbnMpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgaXRlbSA9IHN0eWxlc1tpXTtcblx0XHR2YXIgZG9tU3R5bGUgPSBzdHlsZXNJbkRvbVtpdGVtLmlkXTtcblxuXHRcdGlmKGRvbVN0eWxlKSB7XG5cdFx0XHRkb21TdHlsZS5yZWZzKys7XG5cblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBkb21TdHlsZS5wYXJ0cy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb21TdHlsZS5wYXJ0c1tqXShpdGVtLnBhcnRzW2pdKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yKDsgaiA8IGl0ZW0ucGFydHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0ZG9tU3R5bGUucGFydHMucHVzaChhZGRTdHlsZShpdGVtLnBhcnRzW2pdLCBvcHRpb25zKSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBwYXJ0cyA9IFtdO1xuXG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgaXRlbS5wYXJ0cy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRwYXJ0cy5wdXNoKGFkZFN0eWxlKGl0ZW0ucGFydHNbal0sIG9wdGlvbnMpKTtcblx0XHRcdH1cblxuXHRcdFx0c3R5bGVzSW5Eb21baXRlbS5pZF0gPSB7aWQ6IGl0ZW0uaWQsIHJlZnM6IDEsIHBhcnRzOiBwYXJ0c307XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGxpc3RUb1N0eWxlcyAobGlzdCwgb3B0aW9ucykge1xuXHR2YXIgc3R5bGVzID0gW107XG5cdHZhciBuZXdTdHlsZXMgPSB7fTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgaXRlbSA9IGxpc3RbaV07XG5cdFx0dmFyIGlkID0gb3B0aW9ucy5iYXNlID8gaXRlbVswXSArIG9wdGlvbnMuYmFzZSA6IGl0ZW1bMF07XG5cdFx0dmFyIGNzcyA9IGl0ZW1bMV07XG5cdFx0dmFyIG1lZGlhID0gaXRlbVsyXTtcblx0XHR2YXIgc291cmNlTWFwID0gaXRlbVszXTtcblx0XHR2YXIgcGFydCA9IHtjc3M6IGNzcywgbWVkaWE6IG1lZGlhLCBzb3VyY2VNYXA6IHNvdXJjZU1hcH07XG5cblx0XHRpZighbmV3U3R5bGVzW2lkXSkgc3R5bGVzLnB1c2gobmV3U3R5bGVzW2lkXSA9IHtpZDogaWQsIHBhcnRzOiBbcGFydF19KTtcblx0XHRlbHNlIG5ld1N0eWxlc1tpZF0ucGFydHMucHVzaChwYXJ0KTtcblx0fVxuXG5cdHJldHVybiBzdHlsZXM7XG59XG5cbmZ1bmN0aW9uIGluc2VydFN0eWxlRWxlbWVudCAob3B0aW9ucywgc3R5bGUpIHtcblx0dmFyIHRhcmdldCA9IGdldEVsZW1lbnQob3B0aW9ucy5pbnNlcnRJbnRvKVxuXG5cdGlmICghdGFyZ2V0KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiQ291bGRuJ3QgZmluZCBhIHN0eWxlIHRhcmdldC4gVGhpcyBwcm9iYWJseSBtZWFucyB0aGF0IHRoZSB2YWx1ZSBmb3IgdGhlICdpbnNlcnRJbnRvJyBwYXJhbWV0ZXIgaXMgaW52YWxpZC5cIik7XG5cdH1cblxuXHR2YXIgbGFzdFN0eWxlRWxlbWVudEluc2VydGVkQXRUb3AgPSBzdHlsZXNJbnNlcnRlZEF0VG9wW3N0eWxlc0luc2VydGVkQXRUb3AubGVuZ3RoIC0gMV07XG5cblx0aWYgKG9wdGlvbnMuaW5zZXJ0QXQgPT09IFwidG9wXCIpIHtcblx0XHRpZiAoIWxhc3RTdHlsZUVsZW1lbnRJbnNlcnRlZEF0VG9wKSB7XG5cdFx0XHR0YXJnZXQuaW5zZXJ0QmVmb3JlKHN0eWxlLCB0YXJnZXQuZmlyc3RDaGlsZCk7XG5cdFx0fSBlbHNlIGlmIChsYXN0U3R5bGVFbGVtZW50SW5zZXJ0ZWRBdFRvcC5uZXh0U2libGluZykge1xuXHRcdFx0dGFyZ2V0Lmluc2VydEJlZm9yZShzdHlsZSwgbGFzdFN0eWxlRWxlbWVudEluc2VydGVkQXRUb3AubmV4dFNpYmxpbmcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXHRcdH1cblx0XHRzdHlsZXNJbnNlcnRlZEF0VG9wLnB1c2goc3R5bGUpO1xuXHR9IGVsc2UgaWYgKG9wdGlvbnMuaW5zZXJ0QXQgPT09IFwiYm90dG9tXCIpIHtcblx0XHR0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdmFsdWUgZm9yIHBhcmFtZXRlciAnaW5zZXJ0QXQnLiBNdXN0IGJlICd0b3AnIG9yICdib3R0b20nLlwiKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZW1vdmVTdHlsZUVsZW1lbnQgKHN0eWxlKSB7XG5cdGlmIChzdHlsZS5wYXJlbnROb2RlID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cdHN0eWxlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGUpO1xuXG5cdHZhciBpZHggPSBzdHlsZXNJbnNlcnRlZEF0VG9wLmluZGV4T2Yoc3R5bGUpO1xuXHRpZihpZHggPj0gMCkge1xuXHRcdHN0eWxlc0luc2VydGVkQXRUb3Auc3BsaWNlKGlkeCwgMSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3R5bGVFbGVtZW50IChvcHRpb25zKSB7XG5cdHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcblxuXHRvcHRpb25zLmF0dHJzLnR5cGUgPSBcInRleHQvY3NzXCI7XG5cblx0YWRkQXR0cnMoc3R5bGUsIG9wdGlvbnMuYXR0cnMpO1xuXHRpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucywgc3R5bGUpO1xuXG5cdHJldHVybiBzdHlsZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlua0VsZW1lbnQgKG9wdGlvbnMpIHtcblx0dmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKTtcblxuXHRvcHRpb25zLmF0dHJzLnR5cGUgPSBcInRleHQvY3NzXCI7XG5cdG9wdGlvbnMuYXR0cnMucmVsID0gXCJzdHlsZXNoZWV0XCI7XG5cblx0YWRkQXR0cnMobGluaywgb3B0aW9ucy5hdHRycyk7XG5cdGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zLCBsaW5rKTtcblxuXHRyZXR1cm4gbGluaztcbn1cblxuZnVuY3Rpb24gYWRkQXR0cnMgKGVsLCBhdHRycykge1xuXHRPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0ZWwuc2V0QXR0cmlidXRlKGtleSwgYXR0cnNba2V5XSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhZGRTdHlsZSAob2JqLCBvcHRpb25zKSB7XG5cdHZhciBzdHlsZSwgdXBkYXRlLCByZW1vdmUsIHJlc3VsdDtcblxuXHQvLyBJZiBhIHRyYW5zZm9ybSBmdW5jdGlvbiB3YXMgZGVmaW5lZCwgcnVuIGl0IG9uIHRoZSBjc3Ncblx0aWYgKG9wdGlvbnMudHJhbnNmb3JtICYmIG9iai5jc3MpIHtcblx0ICAgIHJlc3VsdCA9IG9wdGlvbnMudHJhbnNmb3JtKG9iai5jc3MpO1xuXG5cdCAgICBpZiAocmVzdWx0KSB7XG5cdCAgICBcdC8vIElmIHRyYW5zZm9ybSByZXR1cm5zIGEgdmFsdWUsIHVzZSB0aGF0IGluc3RlYWQgb2YgdGhlIG9yaWdpbmFsIGNzcy5cblx0ICAgIFx0Ly8gVGhpcyBhbGxvd3MgcnVubmluZyBydW50aW1lIHRyYW5zZm9ybWF0aW9ucyBvbiB0aGUgY3NzLlxuXHQgICAgXHRvYmouY3NzID0gcmVzdWx0O1xuXHQgICAgfSBlbHNlIHtcblx0ICAgIFx0Ly8gSWYgdGhlIHRyYW5zZm9ybSBmdW5jdGlvbiByZXR1cm5zIGEgZmFsc3kgdmFsdWUsIGRvbid0IGFkZCB0aGlzIGNzcy5cblx0ICAgIFx0Ly8gVGhpcyBhbGxvd3MgY29uZGl0aW9uYWwgbG9hZGluZyBvZiBjc3Ncblx0ICAgIFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgXHRcdC8vIG5vb3Bcblx0ICAgIFx0fTtcblx0ICAgIH1cblx0fVxuXG5cdGlmIChvcHRpb25zLnNpbmdsZXRvbikge1xuXHRcdHZhciBzdHlsZUluZGV4ID0gc2luZ2xldG9uQ291bnRlcisrO1xuXG5cdFx0c3R5bGUgPSBzaW5nbGV0b24gfHwgKHNpbmdsZXRvbiA9IGNyZWF0ZVN0eWxlRWxlbWVudChvcHRpb25zKSk7XG5cblx0XHR1cGRhdGUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIGZhbHNlKTtcblx0XHRyZW1vdmUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIHRydWUpO1xuXG5cdH0gZWxzZSBpZiAoXG5cdFx0b2JqLnNvdXJjZU1hcCAmJlxuXHRcdHR5cGVvZiBVUkwgPT09IFwiZnVuY3Rpb25cIiAmJlxuXHRcdHR5cGVvZiBVUkwuY3JlYXRlT2JqZWN0VVJMID09PSBcImZ1bmN0aW9uXCIgJiZcblx0XHR0eXBlb2YgVVJMLnJldm9rZU9iamVjdFVSTCA9PT0gXCJmdW5jdGlvblwiICYmXG5cdFx0dHlwZW9mIEJsb2IgPT09IFwiZnVuY3Rpb25cIiAmJlxuXHRcdHR5cGVvZiBidG9hID09PSBcImZ1bmN0aW9uXCJcblx0KSB7XG5cdFx0c3R5bGUgPSBjcmVhdGVMaW5rRWxlbWVudChvcHRpb25zKTtcblx0XHR1cGRhdGUgPSB1cGRhdGVMaW5rLmJpbmQobnVsbCwgc3R5bGUsIG9wdGlvbnMpO1xuXHRcdHJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSk7XG5cblx0XHRcdGlmKHN0eWxlLmhyZWYpIFVSTC5yZXZva2VPYmplY3RVUkwoc3R5bGUuaHJlZik7XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRzdHlsZSA9IGNyZWF0ZVN0eWxlRWxlbWVudChvcHRpb25zKTtcblx0XHR1cGRhdGUgPSBhcHBseVRvVGFnLmJpbmQobnVsbCwgc3R5bGUpO1xuXHRcdHJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSk7XG5cdFx0fTtcblx0fVxuXG5cdHVwZGF0ZShvYmopO1xuXG5cdHJldHVybiBmdW5jdGlvbiB1cGRhdGVTdHlsZSAobmV3T2JqKSB7XG5cdFx0aWYgKG5ld09iaikge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHRuZXdPYmouY3NzID09PSBvYmouY3NzICYmXG5cdFx0XHRcdG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmXG5cdFx0XHRcdG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXBcblx0XHRcdCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZShvYmogPSBuZXdPYmopO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZW1vdmUoKTtcblx0XHR9XG5cdH07XG59XG5cbnZhciByZXBsYWNlVGV4dCA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciB0ZXh0U3RvcmUgPSBbXTtcblxuXHRyZXR1cm4gZnVuY3Rpb24gKGluZGV4LCByZXBsYWNlbWVudCkge1xuXHRcdHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudDtcblxuXHRcdHJldHVybiB0ZXh0U3RvcmUuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJ1xcbicpO1xuXHR9O1xufSkoKTtcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyAoc3R5bGUsIGluZGV4LCByZW1vdmUsIG9iaikge1xuXHR2YXIgY3NzID0gcmVtb3ZlID8gXCJcIiA6IG9iai5jc3M7XG5cblx0aWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcblx0XHRzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKTtcblx0fSBlbHNlIHtcblx0XHR2YXIgY3NzTm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcyk7XG5cdFx0dmFyIGNoaWxkTm9kZXMgPSBzdHlsZS5jaGlsZE5vZGVzO1xuXG5cdFx0aWYgKGNoaWxkTm9kZXNbaW5kZXhdKSBzdHlsZS5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSk7XG5cblx0XHRpZiAoY2hpbGROb2Rlcy5sZW5ndGgpIHtcblx0XHRcdHN0eWxlLmluc2VydEJlZm9yZShjc3NOb2RlLCBjaGlsZE5vZGVzW2luZGV4XSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN0eWxlLmFwcGVuZENoaWxkKGNzc05vZGUpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBhcHBseVRvVGFnIChzdHlsZSwgb2JqKSB7XG5cdHZhciBjc3MgPSBvYmouY3NzO1xuXHR2YXIgbWVkaWEgPSBvYmoubWVkaWE7XG5cblx0aWYobWVkaWEpIHtcblx0XHRzdHlsZS5zZXRBdHRyaWJ1dGUoXCJtZWRpYVwiLCBtZWRpYSlcblx0fVxuXG5cdGlmKHN0eWxlLnN0eWxlU2hlZXQpIHtcblx0XHRzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XG5cdH0gZWxzZSB7XG5cdFx0d2hpbGUoc3R5bGUuZmlyc3RDaGlsZCkge1xuXHRcdFx0c3R5bGUucmVtb3ZlQ2hpbGQoc3R5bGUuZmlyc3RDaGlsZCk7XG5cdFx0fVxuXG5cdFx0c3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlTGluayAobGluaywgb3B0aW9ucywgb2JqKSB7XG5cdHZhciBjc3MgPSBvYmouY3NzO1xuXHR2YXIgc291cmNlTWFwID0gb2JqLnNvdXJjZU1hcDtcblxuXHQvKlxuXHRcdElmIGNvbnZlcnRUb0Fic29sdXRlVXJscyBpc24ndCBkZWZpbmVkLCBidXQgc291cmNlbWFwcyBhcmUgZW5hYmxlZFxuXHRcdGFuZCB0aGVyZSBpcyBubyBwdWJsaWNQYXRoIGRlZmluZWQgdGhlbiBsZXRzIHR1cm4gY29udmVydFRvQWJzb2x1dGVVcmxzXG5cdFx0b24gYnkgZGVmYXVsdC4gIE90aGVyd2lzZSBkZWZhdWx0IHRvIHRoZSBjb252ZXJ0VG9BYnNvbHV0ZVVybHMgb3B0aW9uXG5cdFx0ZGlyZWN0bHlcblx0Ki9cblx0dmFyIGF1dG9GaXhVcmxzID0gb3B0aW9ucy5jb252ZXJ0VG9BYnNvbHV0ZVVybHMgPT09IHVuZGVmaW5lZCAmJiBzb3VyY2VNYXA7XG5cblx0aWYgKG9wdGlvbnMuY29udmVydFRvQWJzb2x1dGVVcmxzIHx8IGF1dG9GaXhVcmxzKSB7XG5cdFx0Y3NzID0gZml4VXJscyhjc3MpO1xuXHR9XG5cblx0aWYgKHNvdXJjZU1hcCkge1xuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI2NjAzODc1XG5cdFx0Y3NzICs9IFwiXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxcIiArIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCkpKSkgKyBcIiAqL1wiO1xuXHR9XG5cblx0dmFyIGJsb2IgPSBuZXcgQmxvYihbY3NzXSwgeyB0eXBlOiBcInRleHQvY3NzXCIgfSk7XG5cblx0dmFyIG9sZFNyYyA9IGxpbmsuaHJlZjtcblxuXHRsaW5rLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXG5cdGlmKG9sZFNyYykgVVJMLnJldm9rZU9iamVjdFVSTChvbGRTcmMpO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXMuanNcbi8vIG1vZHVsZSBpZCA9IDJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcmVjcmVhdGlvbi5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIFByZXBhcmUgY3NzVHJhbnNmb3JtYXRpb25cbnZhciB0cmFuc2Zvcm07XG5cbnZhciBvcHRpb25zID0ge31cbm9wdGlvbnMudHJhbnNmb3JtID0gdHJhbnNmb3JtXG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXMuanNcIikoY29udGVudCwgb3B0aW9ucyk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcmVjcmVhdGlvbi5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcmVjcmVhdGlvbi5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9yZWNyZWF0aW9uLmNzc1xuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIvKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYSByZWNyZWF0aW9uIGFyZWEgXG4qICBEaXNwbGF5IHRoZSBkYXRhIHRvIGEgbW9kYWwgb24gdGhlIHdlYiBwYWdlICovXG5cbmltcG9ydCAnLi9yZWNyZWF0aW9uLmNzcyc7XG5pbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuXG52YXIgYm9va01hcmtJdGVtO1xudmFyIHVuc2V0Qm9va01hcms7XG52YXIgYWRkUmVjVG9Sb3V0ZTtcblxuLy8gZGlzcGxheSB0aGUgZGF0YSBpbiBhIG1vZGFsIGJveFxuZXhwb3J0IGZ1bmN0aW9uIHJldHJpZXZlU2luZ2xlUmVjQXJlYShyZWNhcmVhKSB7XG4gICAgJCgnI21vZGFsMS1jb250ZW50JykuZW1wdHkoKTtcbiAgICAvLyByZXRyaWV2ZSB0aGUgZGF0YSB1c2luZyByZWNBcmVhSWRcblxuICAgIC8vIFRoZSByZWNyZWF0aW9uIEFyZWEgVGl0bGVcbiAgICB2YXIgcmVjTmFtZVRleHQgPSAkKFwiPGRpdiBpZD0ncmVjTmFtZU1vZGFsJz5cIikudGV4dChyZWNhcmVhLlJlY0FyZWFOYW1lKTtcblxuICAgIC8vVGhlIHB1Ymxpc2hlZCBwaG9uZSBudW1iZXIgb2YgdGhlIGFyZWFcbiAgICB2YXIgcmVjUGhvbmVUZXh0ID0gJChcIjxkaXYgaWQ9J3JlY1Bob25lTW9kYWwnPlwiKS50ZXh0KHJlY2FyZWEuUmVjQXJlYVBob25lKTtcblxuICAgIHZhciByZWNBcmVhRW1haWwgPSAkKFwiPGRpdiBpZD0ncmVjRW1haWxNb2RhbCc+XCIpLnRleHQocmVjYXJlYS5SZWNBcmVhRW1haWwpO1xuXG4gICAgLy8gQ2hlY2sgYW5kIHNlZSBpZiB0aGUgbGluayBhcnJheSBpcyBlbXB0eSBvciBub3QgXG4gICAgaWYgKHJlY2FyZWEuTElOS1swXSAhPSBudWxsKSB7XG4gICAgICAgIHZhciByZWNBcmVhTGlua1RpdGxlID0gcmVjYXJlYS5MSU5LWzBdLlRpdGxlO1xuICAgICAgICB2YXIgcmVjQXJlYVVybCA9IHJlY2FyZWEuTElOS1swXS5VUkw7XG4gICAgICAgIHZhciByZWNBcmVhTGluayA9ICQoXCI8YSAvPlwiLCB7XG4gICAgICAgICAgICBocmVmOiByZWNBcmVhVXJsLFxuICAgICAgICAgICAgdGV4dDogcmVjQXJlYUxpbmtUaXRsZSxcbiAgICAgICAgICAgIHRhcmdldDogXCJfYmxhbmtcIixcbiAgICAgICAgICAgIGlkOiBcInJlY1VybE1vZGFsXCJ9KTtcbiAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRlbGVwaG9uZUNoZWNrKHN0clBob25lKXtcbiAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgdmFsdWUgd2UgZ2V0IGlzIGEgcGhvbmUgbnVtYmVyXG4gICAgICAgICAgICAgICAgdmFyIGlzUGhvbmUgPSBuZXcgUmVnRXhwKC9eXFwrPzE/XFxzKj9cXCg/XFxkezN9fFxcd3szfSg/OlxcKXxbLXxcXHNdKT9cXHMqP1xcZHszfXxcXHd7M31bLXxcXHNdP1xcZHs0fXxcXHd7NH0kLyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzUGhvbmUudGVzdChzdHJQaG9uZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAvLyBBcHBlbmQgdGhlIGRldGFpbHMgb2YgdGhlIHJlY2FyZWEgdG8gdGhlIG1vZGFsXG4gICAgLy8gQ2hlY2tzIHdoZXRoZXIgYSBwaG9uZSBudW1iZXIgbWF0Y2hlcyBhIHBhdHRlcm4gYmVmb3JlIGFwcGVuZGluZyB0byB0aGUgbW9kYWxcbiAgICBpZiAodGVsZXBob25lQ2hlY2socmVjYXJlYS5SZWNBcmVhUGhvbmUpID09IHRydWUpeyAgICBcbiAgICAgICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKHJlY05hbWVUZXh0LHJlY1Bob25lVGV4dCxyZWNBcmVhRW1haWwscmVjQXJlYUxpbmspO1xuICAgIH0gZWxzZVxuICAgICAgICAkKCcjbW9kYWwxLWNvbnRlbnQnKS5hcHBlbmQocmVjTmFtZVRleHQscmVjQXJlYUVtYWlsLHJlY0FyZWFMaW5rKTtcblxuICAgIC8vIFJlY0FyZWFEZXNjcmlwdGlvblxuXG4gICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKGA8c3Ryb25nPjxkaXYgaWQ9J2Rlc2NNb2RhbCc+RGVzY3JpcHRpb246PC9zdHJvbmc+ICR7cmVjYXJlYS5SZWNBcmVhRGVzY3JpcHRpb259YCk7XG5cbiAgICAvLyBBcHBlbmQgdGhlIEFjdGl2aXRpZXMgdG8gdGhlIG1vZGFsXG4gICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKFwiPHN0cm9uZz48ZGl2IGlkPSdhY3Rpdml0eU1vZGFsSGVhZCcgY2xhc3M9J2NvbGxlY3Rpb24taGVhZGVyJz5BY3Rpdml0aWVzPC9kaXY+XCIpO1xuICAgIHJlY2FyZWEuQUNUSVZJVFkuZm9yRWFjaChmdW5jdGlvbihhY3Rpdml0eSl7XG4gICAgICAgICQoJyNtb2RhbDEtY29udGVudCcpLmFwcGVuZChcIjx1bD5cIik7XG4gICAgICAgICQoJyNtb2RhbDEtY29udGVudCcpLmFwcGVuZChcIjxsaSBpZD0nYWN0aXZpdHlUeXBlTW9kYWwnPlwiICsgYWN0aXZpdHkuQWN0aXZpdHlOYW1lKTtcbiAgICB9KVxuXG4gICAgLy8gUkVDQVJFQUFERFJFU1NcbiAgICByZWNhcmVhLlJFQ0FSRUFBRERSRVNTLmZvckVhY2goZnVuY3Rpb24oYWRkcmVzcyl7XG4gICAgICAgICQoJyNtb2RhbDEtY29udGVudCcpLmFwcGVuZChcIjxzdHJvbmc+PGRpdiBpZD0nYWRkcmVzc0hlYWRNb2RhbCc+QWRkcmVzc1wiKTtcbiAgICAgICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKFwiPGRpdiBjbGFzcz0nYWRkcmVzc01vZGFsJz5cIiArIGFkZHJlc3MuUmVjQXJlYVN0cmVldEFkZHJlc3MxKTtcbiAgICAgICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKFwiPGRpdiBjbGFzcz0nYWRkcmVzc01vZGFsJz5cIiArIGFkZHJlc3MuUmVjQXJlYVN0cmVldEFkZHJlc3MyKTtcbiAgICAgICAgJCgnI21vZGFsMS1jb250ZW50JykuYXBwZW5kKGA8ZGl2IGNsYXNzPSdhZGRyZXNzTW9kYWwnPiAke2FkZHJlc3MuQ2l0eX0sICR7YWRkcmVzcy5BZGRyZXNzU3RhdGVDb2RlfSAke2FkZHJlc3MuUG9zdGFsQ29kZX1gKTtcbiAgICB9KVxuXG5cbiAgICAvLyBTZXQvVW5zZXQgdGhlIGJvb2ttYXJrIGl0ZW1cbiAgICBib29rTWFya0l0ZW0gPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiAocmVjYXJlYS5ib29rbWFya2VkID09PSBmYWxzZSkge1xuICAgICAgICAgIHN0YXRlLnJlY3JlYXRpb24uYWRkQm9va21hcmsocmVjYXJlYSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjYm9vay1tYXJrLWJ0bicpLnRleHQoXCJVbmJvb2ttYXJrXCIpOyAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZS5yZWNyZWF0aW9uLnJlbW92ZUJvb2ttYXJrKHJlY2FyZWEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgICAgIGlmIChyZWNhcmVhLmJvb2ttYXJrZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAkKFwiI2Jvb2stbWFyay1idG5cIikudGV4dChcIkJvb2ttYXJrXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2Jvb2stbWFyay1idG4nKS50ZXh0KFwiVW5ib29rbWFya1wiKTsgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAvLyBOZWVkIHRvIGFkZCBhIGJ1dHRvbiB0aGF0IGFkZHMgdGhlIHJlY2FyZWEgdG8gcm91dGVcblxuICAgIGFkZFJlY1RvUm91dGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYocmVjYXJlYS5pblJvdXRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgc3RhdGUucmVjcmVhdGlvbi5hZGRUb1JvdXRlKHJlY2FyZWEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2FkZFRvUm91dGVCdG4nKS50ZXh0KFwiUmVtb3ZlIGZyb20gUm91dGVcIik7XG4gICAgICAgICAgICBzdGF0ZS5yZWNyZWF0aW9uLnJlbW92ZUZyb21Sb3V0ZShyZWNhcmVhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICAgICBpZiAocmVjYXJlYS5pblJvdXRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgJCgnI2FkZFRvUm91dGVCdG4nKS50ZXh0KFwiQWRkIHRvIFJvdXRlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2FkZFRvUm91dGVCdG4nKS50ZXh0KFwiUmVtb3ZlIGZyb20gUm91dGVcIik7XG4gICAgICAgIH1cblxuICAgIC8vIExhc3Qgc3RlcCBpcyB0byBvcGVuIHRoZSBtb2RhbCBhZnRlciBldmVyeXRoaW5nIGlzIGFwcGVuZGVkXG4gICAgICAgICQoJyNtb2RhbDEnKS5tb2RhbCgnb3BlbicpO1xuXG59XG5cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcblxuICAgICQoJyNtb2RhbDEnKS5tb2RhbCgpO1xuXG4gICAgJCgnI2Jvb2stbWFyay1idG4nKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICAgYm9va01hcmtJdGVtKCk7XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYnV0dG9uIHRvIGFkZCBhIHJvdXRlIHRvIHRoZSBtb2RhbCBmb290ZXJcblxuICAgICAgICB2YXIgYWRkVG9Sb3V0ZUJ1dHRvbiA9ICQoXCI8YSAvPlwiLCB7XG4gICAgICAgICAgICBocmVmOiBcIiMhXCIsXG4gICAgICAgICAgICB0ZXh0OiBcIkFkZCB0byBSb3V0ZVwiLFxuICAgICAgICAgICAgY2xhc3M6IFwibW9kYWwtYWN0aW9uIG1vZGFsLWNsb3NlIHdhdmVzLWVmZmVjdCBidG4gYnRuLWZsYXQgcmlnaHRcIixcbiAgICAgICAgICAgIGlkOiBcImFkZFRvUm91dGVCdG5cIn0pO1xuXG4gICAgICAgICQoJyNyZWMtYXJlYS1kZXRhaWwtbW9kYWwtZm9vdGVyJykuYXBwZW5kKGFkZFRvUm91dGVCdXR0b24pO1xuXG4gICAgJCgnI2FkZFRvUm91dGVCdG4nKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICBhZGRSZWNUb1JvdXRlKCk7XG4gICAgfSlcbiBcbiB9KTtcblxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zcmMvY29tcG9uZW50cy9yZWNyZWF0aW9uL3JlY0FyZWFEZXRhaWxzLmpzXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImV4cG9ydCB2YXIgaW50ZXJlc3RMaXN0ID0gW1xuICAgIHtcIkFjdGl2aXR5TmFtZVwiOiBcIkJJS0lOR1wiLFxuICAgICBcIkFjdGl2aXR5SURcIjogNSxcbiAgICAgXCJFbW9qaVwiOiBcIvCfmrRcIlxuICAgIH0sXG4gICAge1wiQWN0aXZpdHlOYW1lXCI6IFwiQ0xJTUJJTkdcIixcbiAgICAgXCJBY3Rpdml0eUlEXCI6IDcsXG4gICAgIFwiRW1vamlcIjogXCJBXCJcbiAgICB9LFxuICAgIHtcIkFjdGl2aXR5TmFtZVwiOiBcIkNBTVBJTkdcIixcbiAgICAgXCJBY3Rpdml0eUlEXCI6IDksXG4gICAgIFwiRW1vamlcIjogXCJBXCJcbiAgICAgfSxcbiAgICAge1wiQWN0aXZpdHlOYW1lXCI6IFwiSElLSU5HXCIsXG4gICAgICBcIkFjdGl2aXR5SURcIjogMTQsXG4gICAgICBcIkVtb2ppXCI6IFwiQVwiXG4gICAgfSxcbiAgICB7XCJBY3Rpdml0eU5hbWVcIjogXCJQSUNOSUNLSU5HXCIsXG4gICAgICBcIkFjdGl2aXR5SURcIjogMjAsXG4gICAgICBcIkVtb2ppXCI6IFwiQVwiXG4gICAgIH0sXG4gICAgIHtcIkFjdGl2aXR5TmFtZVwiOiBcIlJFQ1JFQVRJT05BTCBWRUhJQ0xFU1wiLFxuICAgICAgXCJBY3Rpdml0eUlEXCI6IDIzLFxuICAgICAgXCJFbW9qaVwiOiBcIkFcIlxuICAgICB9LFxuICAgICB7XCJBY3Rpdml0eU5hbWVcIjogXCJWSVNJVE9SIENFTlRFUlwiLFxuICAgICAgXCJBY3Rpdml0eUlEXCI6IDI0LFxuICAgICAgXCJFbW9qaVwiOiBcIkFcIlxuICAgIH0sXG4gICAge1wiQWN0aXZpdHlOYW1lXCI6IFwiV0FURVIgU1BPUlRTXCIsXG4gICAgIFwiQWN0aXZpdHlJRFwiOiAyNSxcbiAgICAgXCJFbW9qaVwiOiBcIkFcIlxuICAgIH0sXG4gICAge1wiQWN0aXZpdHlOYW1lXCI6IFwiV0lMRExJRkUgVklFV0lOR1wiLFxuICAgICBcIkFjdGl2aXR5SURcIjogMjYsXG4gICAgIFwiRW1vamlcIjogXCJBXCJcbiAgICB9LFxuICAgIHtcIkFjdGl2aXR5TmFtZVwiOiBcIkhPUlNFQkFDSyBSSURJTkdcIixcbiAgICAgXCJBY3Rpdml0eUlEXCI6IDE1LFxuICAgICBcIkVtb2ppXCI6IFwiQVwiXG4gICAgfVxuXG5dXG5cbi8vdHlwZSBpcyAncm91dGUnIG9yICdib29rbWFyaydcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJY29ucyh0eXBlLCBpZCwgdmFsdWUpIHtcbiAgICBsZXQgYnRucyA9ICQoYC5yZWMtJHt0eXBlfS1pY29uW2RhdGEtaWQ9XCIke2lkfVwiXWApO1xuICAgIGlmKHR5cGUgPT09ICdyb3V0ZScpe1xuICAgICAgICBpZih2YWx1ZSl7XG4gICAgICAgICAgICBidG5zLmF0dHIoJ3RpdGxlJywgJ3JlbW92ZSBmcm9tIHJvdXRlJyk7XG4gICAgICAgICAgICBidG5zLmNoaWxkcmVuKCkudGV4dCgncmVtb3ZlX2NpcmNsZV9vdXRsaW5lJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGJ0bnMuYXR0cigndGl0bGUnLCAnYWRkIHRvIHJvdXRlJyk7XG4gICAgICAgICAgICBidG5zLmNoaWxkcmVuKCkudGV4dCgnYWRkX2NpcmNsZV9vdXRsaW5lJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiggdHlwZSA9PT0gJ2Jvb2ttYXJrJyl7XG4gICAgICAgIGlmKHZhbHVlKXtcbiAgICAgICAgICAgIGJ0bnMuYXR0cigndGl0bGUnLCAncmVtb3ZlIGJvb2ttYXJrJyk7XG4gICAgICAgICAgICBidG5zLmNoaWxkcmVuKCkudGV4dCgnc3RhcicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICBidG5zLmF0dHIoJ3RpdGxlJywgJ2FkZCBib29rbWFyaycpO1xuICAgICAgICAgICAgYnRucy5jaGlsZHJlbigpLnRleHQoJ3N0YXJfb3V0bGluZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWNBcGlRdWVyeShsYXRpdHVkZVZhbCxsb25naXR1ZGVWYWwscmFkaXVzVmFsLGFjdGl2aXR5VmFsLGNhbGxiYWNrKSB7XG5cbiAgICB2YXIgcmVjUXVlcnlVUkwgPSBcImh0dHBzOi8vcmlkYi5yZWNyZWF0aW9uLmdvdi9hcGkvdjEvcmVjYXJlYXMuanNvbj9hcGlrZXk9MkMxQjJBQzY5RTE5NDVERTgxNUI2OUJCQ0M5QzdCMTkmZnVsbCZsYXRpdHVkZT1cIlxuICAgICsgbGF0aXR1ZGVWYWwgKyBcIiZsb25naXR1ZGU9XCIgKyBsb25naXR1ZGVWYWwgKyBcIiZyYWRpdXM9XCIgKyByYWRpdXNWYWwgKyBcIiZhY3Rpdml0eT1cIiArIGFjdGl2aXR5VmFsO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHJlY1F1ZXJ5VVJMLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0pXG4gICAgICAgIC5kb25lKGNhbGxiYWNrKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlY0FwaUJ5SWQoaWQsIGNhbGxiYWNrKSB7XG5cbiAgICB2YXIgcmVjUXVlcnlVUkwgPSBcImh0dHBzOi8vcmlkYi5yZWNyZWF0aW9uLmdvdi9hcGkvdjEvcmVjYXJlYXMvXCIgKyBpZCArIFwiLmpzb24/YXBpa2V5PTJDMUIyQUM2OUUxOTQ1REU4MTVCNjlCQkNDOUM3QjE5JmZ1bGxcIlxuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHJlY1F1ZXJ5VVJMLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgIH0pXG4gICAgICAgIC5kb25lKGNhbGxiYWNrKTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9jb25zdGFudHMuanNcbi8vIG1vZHVsZSBpZCA9IDVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcbiAgY2VudGVyOiB7bGF0OiAzOS43NjQyNTQ4LCBsbmc6IC0xMDQuOTk1MTkzN30sXG4gIHpvb206IDUsXG4gIGZ1bGxzY3JlZW5Db250cm9sOiBmYWxzZSxcbiAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICBzdHJlZXRWaWV3Q29udHJvbDogZmFsc2UsXG4gIGdlc3R1cmVIYW5kbGluZzogJ2dyZWVkeSdcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBtYXA7XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL21hcC9tYXBjb25zdGFudC5qc1xuLy8gbW9kdWxlIGlkID0gNlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgJy4vY29tcG9uZW50cy9yZWNyZWF0aW9uL3JlY3JlYXRpb24nO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9sb2FkQnV0dG9uJztcbmltcG9ydCAnLi9jb21wb25lbnRzL2ludGVyZXN0cy9pbnRlcmVzdHMnO1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvbGF5b3V0L2xheW91dCc7XG5pbXBvcnQgJy4vY29tcG9uZW50cy9tYXAvbWFwJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3JvdXRlL3JvdXRlJztcbmltcG9ydCAnLi9jb21wb25lbnRzL2xvY2Fsc3RvcmFnZS9sb2NhbHN0b3JhZ2UnO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zcmMvYXBwLmpzXG4vLyBtb2R1bGUgaWQgPSA3XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCAnLi9yZWNyZWF0aW9uLmNzcyc7XG5pbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuaW1wb3J0ICcuL2Rpc3BsYXlSZWNBcmVhU3VnZ2VzdGlvbnMnO1xuaW1wb3J0ICcuL3JlY0FyZWFEZXRhaWxzJztcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAkKCcjbW9iaWxlLWZpbmQtcmVjJykuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJCh0aGlzKS5ibHVyKCk7XG4gICAgICBsZXQgc3RhdHVzID0gc3RhdGUucmVjcmVhdGlvbi5zdGF0dXM7XG4gICAgICBpZihzdGF0dXMuY2FuTG9hZCAmJiBzdGF0dXMuc2hvdWxkTG9hZCl7XG4gICAgICAgICBzdGF0ZS5yZWNyZWF0aW9uLnNlYXJjaCgpO1xuICAgICAgfVxuICAgfSk7XG4gICAkKCcjZmluZC1yZWMnKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgICAgIGxldCBzdGF0dXMgPSBzdGF0ZS5yZWNyZWF0aW9uLnN0YXR1cztcbiAgICAgIGlmKHN0YXR1cy5jYW5Mb2FkICYmIHN0YXR1cy5zaG91bGRMb2FkKXtcbiAgICAgICAgIHN0YXRlLnJlY3JlYXRpb24uc2VhcmNoKCk7XG4gICAgICB9XG4gICB9KTtcbn0pXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL3JlY3JlYXRpb24vcmVjcmVhdGlvbi5qc1xuLy8gbW9kdWxlIGlkID0gOFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHVuZGVmaW5lZCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIjZmlsdGVyZWQtY29udGFpbmVyIC5jb2xsZWN0aW9uLCAjYm9va21hcmtlZC5jb2xsZWN0aW9ue1xcbiAgIGJvcmRlci1yaWdodDogbm9uZTtcXG4gICBib3JkZXItbGVmdDogbm9uZTtcXG59XFxuXFxuLnN1Z2dlc3Rpb24tc3VtbWFyeXtcXG4gICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG5cXG4uc3VnZ2VzdGlvbi1zdW1tYXJ5IC50aXRsZXtcXG4gICBsaW5lLWhlaWdodDogMTtcXG4gICBtYXJnaW4tdG9wOiAwLjVlbTtcXG4gICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XFxuICAgd2lkdGg6IDEwMCU7XFxuICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgIGZvbnQtc2l6ZTogMS4xZW07XFxuICAgY29sb3I6IHJnYmEoMCwwLDAsMC44Nyk7XFxufVxcblxcbi5zdWdnZXN0aW9uLXN1bW1hcnkgLnJlYy1lbW9qaXN7XFxuICAgd2lkdGg6IDEwMCU7XFxuICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbn1cXG5cXG4uc3VnZ2VzdGlvbi1zdW1tYXJ5IC5yZWMtcHJpbWFyeS1jb250ZW50e1xcbiAgIGZsb2F0OiBsZWZ0O1xcbiAgIHdpZHRoOiBjYWxjKDEwMCUgLSA0MHB4KTtcXG59XFxuXFxuLnJlYy1idXR0b25ze1xcbiAgIHdpZHRoOiAyNHB4O1xcbn1cXG4ucmVjLWJ1dHRvbnMgYTpsYXN0LWNoaWxkIGl7XFxuICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcXG59XFxuXFxuLnJlYy1uYXZsb2FkLWRpc2FibGVke1xcbiAgIGN1cnNvcjogZGVmYXVsdDtcXG4gICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG59XCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlciEuL3NyYy9jb21wb25lbnRzL3JlY3JlYXRpb24vcmVjcmVhdGlvbi5jc3Ncbi8vIG1vZHVsZSBpZCA9IDlcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiXG4vKipcbiAqIFdoZW4gc291cmNlIG1hcHMgYXJlIGVuYWJsZWQsIGBzdHlsZS1sb2FkZXJgIHVzZXMgYSBsaW5rIGVsZW1lbnQgd2l0aCBhIGRhdGEtdXJpIHRvXG4gKiBlbWJlZCB0aGUgY3NzIG9uIHRoZSBwYWdlLiBUaGlzIGJyZWFrcyBhbGwgcmVsYXRpdmUgdXJscyBiZWNhdXNlIG5vdyB0aGV5IGFyZSByZWxhdGl2ZSB0byBhXG4gKiBidW5kbGUgaW5zdGVhZCBvZiB0aGUgY3VycmVudCBwYWdlLlxuICpcbiAqIE9uZSBzb2x1dGlvbiBpcyB0byBvbmx5IHVzZSBmdWxsIHVybHMsIGJ1dCB0aGF0IG1heSBiZSBpbXBvc3NpYmxlLlxuICpcbiAqIEluc3RlYWQsIHRoaXMgZnVuY3Rpb24gXCJmaXhlc1wiIHRoZSByZWxhdGl2ZSB1cmxzIHRvIGJlIGFic29sdXRlIGFjY29yZGluZyB0byB0aGUgY3VycmVudCBwYWdlIGxvY2F0aW9uLlxuICpcbiAqIEEgcnVkaW1lbnRhcnkgdGVzdCBzdWl0ZSBpcyBsb2NhdGVkIGF0IGB0ZXN0L2ZpeFVybHMuanNgIGFuZCBjYW4gYmUgcnVuIHZpYSB0aGUgYG5wbSB0ZXN0YCBjb21tYW5kLlxuICpcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MpIHtcbiAgLy8gZ2V0IGN1cnJlbnQgbG9jYXRpb25cbiAgdmFyIGxvY2F0aW9uID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cubG9jYXRpb247XG5cbiAgaWYgKCFsb2NhdGlvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImZpeFVybHMgcmVxdWlyZXMgd2luZG93LmxvY2F0aW9uXCIpO1xuICB9XG5cblx0Ly8gYmxhbmsgb3IgbnVsbD9cblx0aWYgKCFjc3MgfHwgdHlwZW9mIGNzcyAhPT0gXCJzdHJpbmdcIikge1xuXHQgIHJldHVybiBjc3M7XG4gIH1cblxuICB2YXIgYmFzZVVybCA9IGxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgdmFyIGN1cnJlbnREaXIgPSBiYXNlVXJsICsgbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvW15cXC9dKiQvLCBcIi9cIik7XG5cblx0Ly8gY29udmVydCBlYWNoIHVybCguLi4pXG5cdC8qXG5cdFRoaXMgcmVndWxhciBleHByZXNzaW9uIGlzIGp1c3QgYSB3YXkgdG8gcmVjdXJzaXZlbHkgbWF0Y2ggYnJhY2tldHMgd2l0aGluXG5cdGEgc3RyaW5nLlxuXG5cdCAvdXJsXFxzKlxcKCAgPSBNYXRjaCBvbiB0aGUgd29yZCBcInVybFwiIHdpdGggYW55IHdoaXRlc3BhY2UgYWZ0ZXIgaXQgYW5kIHRoZW4gYSBwYXJlbnNcblx0ICAgKCAgPSBTdGFydCBhIGNhcHR1cmluZyBncm91cFxuXHQgICAgICg/OiAgPSBTdGFydCBhIG5vbi1jYXB0dXJpbmcgZ3JvdXBcblx0ICAgICAgICAgW14pKF0gID0gTWF0Y2ggYW55dGhpbmcgdGhhdCBpc24ndCBhIHBhcmVudGhlc2VzXG5cdCAgICAgICAgIHwgID0gT1Jcblx0ICAgICAgICAgXFwoICA9IE1hdGNoIGEgc3RhcnQgcGFyZW50aGVzZXNcblx0ICAgICAgICAgICAgICg/OiAgPSBTdGFydCBhbm90aGVyIG5vbi1jYXB0dXJpbmcgZ3JvdXBzXG5cdCAgICAgICAgICAgICAgICAgW14pKF0rICA9IE1hdGNoIGFueXRoaW5nIHRoYXQgaXNuJ3QgYSBwYXJlbnRoZXNlc1xuXHQgICAgICAgICAgICAgICAgIHwgID0gT1Jcblx0ICAgICAgICAgICAgICAgICBcXCggID0gTWF0Y2ggYSBzdGFydCBwYXJlbnRoZXNlc1xuXHQgICAgICAgICAgICAgICAgICAgICBbXikoXSogID0gTWF0Y2ggYW55dGhpbmcgdGhhdCBpc24ndCBhIHBhcmVudGhlc2VzXG5cdCAgICAgICAgICAgICAgICAgXFwpICA9IE1hdGNoIGEgZW5kIHBhcmVudGhlc2VzXG5cdCAgICAgICAgICAgICApICA9IEVuZCBHcm91cFxuICAgICAgICAgICAgICAqXFwpID0gTWF0Y2ggYW55dGhpbmcgYW5kIHRoZW4gYSBjbG9zZSBwYXJlbnNcbiAgICAgICAgICApICA9IENsb3NlIG5vbi1jYXB0dXJpbmcgZ3JvdXBcbiAgICAgICAgICAqICA9IE1hdGNoIGFueXRoaW5nXG4gICAgICAgKSAgPSBDbG9zZSBjYXB0dXJpbmcgZ3JvdXBcblx0IFxcKSAgPSBNYXRjaCBhIGNsb3NlIHBhcmVuc1xuXG5cdCAvZ2kgID0gR2V0IGFsbCBtYXRjaGVzLCBub3QgdGhlIGZpcnN0LiAgQmUgY2FzZSBpbnNlbnNpdGl2ZS5cblx0ICovXG5cdHZhciBmaXhlZENzcyA9IGNzcy5yZXBsYWNlKC91cmxcXHMqXFwoKCg/OlteKShdfFxcKCg/OlteKShdK3xcXChbXikoXSpcXCkpKlxcKSkqKVxcKS9naSwgZnVuY3Rpb24oZnVsbE1hdGNoLCBvcmlnVXJsKSB7XG5cdFx0Ly8gc3RyaXAgcXVvdGVzIChpZiB0aGV5IGV4aXN0KVxuXHRcdHZhciB1bnF1b3RlZE9yaWdVcmwgPSBvcmlnVXJsXG5cdFx0XHQudHJpbSgpXG5cdFx0XHQucmVwbGFjZSgvXlwiKC4qKVwiJC8sIGZ1bmN0aW9uKG8sICQxKXsgcmV0dXJuICQxOyB9KVxuXHRcdFx0LnJlcGxhY2UoL14nKC4qKSckLywgZnVuY3Rpb24obywgJDEpeyByZXR1cm4gJDE7IH0pO1xuXG5cdFx0Ly8gYWxyZWFkeSBhIGZ1bGwgdXJsPyBubyBjaGFuZ2Vcblx0XHRpZiAoL14oI3xkYXRhOnxodHRwOlxcL1xcL3xodHRwczpcXC9cXC98ZmlsZTpcXC9cXC9cXC8pL2kudGVzdCh1bnF1b3RlZE9yaWdVcmwpKSB7XG5cdFx0ICByZXR1cm4gZnVsbE1hdGNoO1xuXHRcdH1cblxuXHRcdC8vIGNvbnZlcnQgdGhlIHVybCB0byBhIGZ1bGwgdXJsXG5cdFx0dmFyIG5ld1VybDtcblxuXHRcdGlmICh1bnF1b3RlZE9yaWdVcmwuaW5kZXhPZihcIi8vXCIpID09PSAwKSB7XG5cdFx0ICBcdC8vVE9ETzogc2hvdWxkIHdlIGFkZCBwcm90b2NvbD9cblx0XHRcdG5ld1VybCA9IHVucXVvdGVkT3JpZ1VybDtcblx0XHR9IGVsc2UgaWYgKHVucXVvdGVkT3JpZ1VybC5pbmRleE9mKFwiL1wiKSA9PT0gMCkge1xuXHRcdFx0Ly8gcGF0aCBzaG91bGQgYmUgcmVsYXRpdmUgdG8gdGhlIGJhc2UgdXJsXG5cdFx0XHRuZXdVcmwgPSBiYXNlVXJsICsgdW5xdW90ZWRPcmlnVXJsOyAvLyBhbHJlYWR5IHN0YXJ0cyB3aXRoICcvJ1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBwYXRoIHNob3VsZCBiZSByZWxhdGl2ZSB0byBjdXJyZW50IGRpcmVjdG9yeVxuXHRcdFx0bmV3VXJsID0gY3VycmVudERpciArIHVucXVvdGVkT3JpZ1VybC5yZXBsYWNlKC9eXFwuXFwvLywgXCJcIik7IC8vIFN0cmlwIGxlYWRpbmcgJy4vJ1xuXHRcdH1cblxuXHRcdC8vIHNlbmQgYmFjayB0aGUgZml4ZWQgdXJsKC4uLilcblx0XHRyZXR1cm4gXCJ1cmwoXCIgKyBKU09OLnN0cmluZ2lmeShuZXdVcmwpICsgXCIpXCI7XG5cdH0pO1xuXG5cdC8vIHNlbmQgYmFjayB0aGUgZml4ZWQgY3NzXG5cdHJldHVybiBmaXhlZENzcztcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL3VybHMuanNcbi8vIG1vZHVsZSBpZCA9IDEwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsInZhciBzZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLkRpc3RhbmNlTWF0cml4U2VydmljZSgpO1xuZXhwb3J0IGRlZmF1bHQgc2VydmljZTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvbWFwL2Rpc3RhbmNlLmpzXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuXG4gICAgZnVuY3Rpb24gdGVsZXBob25lQ2hlY2soc3RyUGhvbmUpe1xuICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgdmFsdWUgd2UgZ2V0IGlzIGEgcGhvbmUgbnVtYmVyXG4gICAgICB2YXIgaXNQaG9uZSA9IG5ldyBSZWdFeHAoL15cXCs/MT9cXHMqP1xcKD9cXGR7M318XFx3ezN9KD86XFwpfFstfFxcc10pP1xccyo/XFxkezN9fFxcd3szfVstfFxcc10/XFxkezR9fFxcd3s0fSQvKTtcbiAgICAgIHJldHVybiBpc1Bob25lLnRlc3Qoc3RyUGhvbmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VCb29rbWFya0J1dHRvbihyZWNhcmVhKXtcbiAgICAgICAgbGV0IGNhbGxiYWNrID0gc3RhdGUucmVjcmVhdGlvbi50b2dnbGVCb29rbWFyay5iaW5kKHN0YXRlLnJlY3JlYXRpb24sIHJlY2FyZWEpO1xuICAgICAgICBsZXQgdGl0bGU7XG4gICAgICAgIGxldCBpY29uID0gJCgnPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPicpXG4gICAgICAgIGlmKHJlY2FyZWEuYm9va21hcmtlZCl7XG4gICAgICAgICAgICB0aXRsZSA9ICdyZW1vdmUgYm9va21hcmsnO1xuICAgICAgICAgICAgaWNvbi50ZXh0KCdzdGFyJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIHRpdGxlID0gJ2FkZCBib29rbWFyayc7XG4gICAgICAgICAgICBpY29uLnRleHQoJ3N0YXJfb3V0bGluZScpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBib29rbWFya0J0biA9ICQoJzxhIGhyZWY9XCIjIVwiIHRpdGxlPVwiJyArIHRpdGxlICsgJ1wiIGNsYXNzPVwicmVjLWJvb2ttYXJrLWljb25cIj4nKTtcbiAgICAgICAgYm9va21hcmtCdG4uYXR0cignZGF0YS1pZCcsIHJlY2FyZWEuaWQpO1xuICAgICAgICBib29rbWFya0J0bi5hcHBlbmQoaWNvbik7XG4gICAgICAgIGJvb2ttYXJrQnRuLmNsaWNrKChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGJvb2ttYXJrQnRuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VBZGRUb1JvdXRlQnV0dG9uKHJlY2FyZWEpe1xuICAgICAgICBsZXQgY2FsbGJhY2sgPSBzdGF0ZS5yZWNyZWF0aW9uLnRvZ2dsZUluUm91dGUuYmluZChzdGF0ZS5yZWNyZWF0aW9uLCByZWNhcmVhKTtcbiAgICAgICAgbGV0IHRpdGxlO1xuICAgICAgICBsZXQgaWNvbiA9ICQoJzxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj4nKVxuICAgICAgICBpZihyZWNhcmVhLmluUm91dGUpe1xuICAgICAgICAgICAgdGl0bGUgPSAncmVtb3ZlIGZyb20gcm91dGUnO1xuICAgICAgICAgICAgaWNvbi50ZXh0KCdyZW1vdmVfY2lyY2xlX291dGxpbmUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgdGl0bGUgPSAnYWRkIHRvIHJvdXRlJztcbiAgICAgICAgICAgIGljb24udGV4dCgnYWRkX2NpcmNsZV9vdXRsaW5lJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJvdXRlQnRuID0gJCgnPGEgaHJlZj1cIiMhXCIgdGl0bGU9XCInICsgdGl0bGUgKyAnXCIgY2xhc3M9XCJyZWMtcm91dGUtaWNvblwiPicpO1xuICAgICAgICByb3V0ZUJ0bi5hdHRyKCdkYXRhLWlkJywgcmVjYXJlYS5pZCk7XG4gICAgICAgIHJvdXRlQnRuLmFwcGVuZChpY29uKTtcbiAgICAgICAgcm91dGVCdG4uY2xpY2soKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcm91dGVCdG47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZUluZm9CdXR0b24ocmVjYXJlYSl7XG4gICAgICAgIGxldCBjYWxsYmFjayA9IHJlY2FyZWEuc2hvd0RldGFpbHM7XG4gICAgICAgIGxldCB0aXRsZSA9ICd2aWV3IGRldGFpbHMnO1xuICAgICAgICBsZXQgaWNvbiA9ICQoJzxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj4nKS50ZXh0KCdpbmZvX291dGxpbmUnKTtcbiAgICAgICAgbGV0IHJvdXRlQnRuID0gJCgnPGEgaHJlZj1cIiMhXCIgdGl0bGU9XCInICsgdGl0bGUgKyAnXCIgY2xhc3M9XCJyZWMtaW5mby1pY29uXCI+Jyk7XG4gICAgICAgIHJvdXRlQnRuLmF0dHIoJ2RhdGEtaWQnLCByZWNhcmVhLmlkKTtcbiAgICAgICAgcm91dGVCdG4uYXBwZW5kKGljb24pO1xuICAgICAgICByb3V0ZUJ0bi5jbGljayhjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiByb3V0ZUJ0bjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5UmVjQXJlYVN1bW1hcnkocmVjZGF0YSwgZmlsdGVyZWRUeXBlKSB7XG4gICAgICAgICQoZmlsdGVyZWRUeXBlKS5lbXB0eSgpO1xuICAgICAgICByZWNkYXRhLnZhbC5mb3JFYWNoKChyZWNhcmVhKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udGFpbmVyID0gJCgnPGxpIGNsYXNzPVwic3VnZ2VzdGlvbi1zdW1tYXJ5IGNvbGxlY3Rpb24taXRlbVwiPicpO1xuICAgICAgICAgICAgbGV0IGluZm8gPSAkKCc8ZGl2IGNsYXNzPVwicmVjLXByaW1hcnktY29udGVudFwiPicpXG4gICAgICAgICAgICBsZXQgdGl0bGUgPSAkKCc8YSBjbGFzcz1cInRpdGxlXCIgaHJlZj1cIiNcIj4nKS50ZXh0KHJlY2FyZWEuUmVjQXJlYU5hbWUpO1xuICAgICAgICAgICAgdGl0bGUuY2xpY2socmVjYXJlYS5zaG93RGV0YWlscyk7XG4gICAgICAgICAgICB0aXRsZS5hdHRyKCd0aXRsZScsIHJlY2FyZWEuUmVjQXJlYU5hbWUpO1xuICAgICAgICAgICAgaW5mby5hcHBlbmQodGl0bGUpO1xuICAgICAgICAgICAgaW5mby5hcHBlbmQoJCgnPHNtYWxsIGNsYXNzPVwicmVjLW9yZ2FuaXphdGlvblwiPicpLnRleHQocmVjYXJlYS5PUkdBTklaQVRJT05bMF0uT3JnTmFtZSkpO1xuICAgICAgICAgICAgaW5mby5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJyZWMtZW1vamlzXCI+JykudGV4dCgnZW1vamlzIGdvIGhlcmUnKSk7XG4gICAgICAgICAgICBsZXQgYnV0dG9ucyA9ICQoJzxkaXYgY2xhc3M9XCJzZWNvbmRhcnktY29udGVudCByZWMtYnV0dG9uc1wiPicpO1xuICAgICAgICAgICAgYnV0dG9ucy5hcHBlbmQobWFrZUluZm9CdXR0b24ocmVjYXJlYSkpO1xuICAgICAgICAgICAgYnV0dG9ucy5hcHBlbmQobWFrZUJvb2ttYXJrQnV0dG9uKHJlY2FyZWEpKTtcbiAgICAgICAgICAgIGJ1dHRvbnMuYXBwZW5kKG1ha2VBZGRUb1JvdXRlQnV0dG9uKHJlY2FyZWEpKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQoaW5mbywgYnV0dG9ucyk7XG4gICAgICAgICAgICBjb250YWluZXIuaG92ZXIocmVjYXJlYS5oaWdobGlnaHRNYXJrZXIsIHJlY2FyZWEudW5IaWdobGlnaHRNYXJrZXIpO1xuICAgICAgICAgICAgJChmaWx0ZXJlZFR5cGUpLmFwcGVuZChjb250YWluZXIpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgLy8gIGZvciAodmFyIGkgPSAwOyBpIDxyZWNkYXRhLnZhbC5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgLy8gICAgICB2YXIgcmVjVmFsQWxpYXMgPSByZWNkYXRhLnZhbFtpXTtcblxuICAgICAgIC8vICAgICAgdmFyIHN1Z0RpdkNsYXNzID0gJChcIjxsaSBjbGFzcz0nc3VnZ2VzdGlvblN1bW1hcnkgY29sbGVjdGlvbi1pdGVtJyBpZD0nYXJlYUlkLVwiICsgcmVjVmFsQWxpYXMuaWQgKyBcIic+XCIpO1xuXG4gICAgICAgLy8gICAgICB2YXIgcmVjTmFtZVRleHQgPSAkKFwiPHN0cm9uZz48bGkgY2FyZC10aXRsZT5cIikudGV4dChyZWNWYWxBbGlhcy5SZWNBcmVhTmFtZSk7XG5cbiAgICAgICAvLyAgICAgIHZhciByZWNQaG9uZVRleHQgPSAkKFwiPGxpIGNhcmQtY29udGVudD5cIikudGV4dChyZWNWYWxBbGlhcy5SZWNBcmVhUGhvbmUpO1xuXG5cbiAgICAgICAvLyAgICAgIGlmICh0ZWxlcGhvbmVDaGVjayhyZWNWYWxBbGlhcy5SZWNBcmVhUGhvbmUpID09IHRydWUpe1xuICAgICAgIC8vICAgICAgICAgIHN1Z0RpdkNsYXNzLmFwcGVuZChyZWNOYW1lVGV4dCwgcmVjUGhvbmVUZXh0KTtcbiAgICAgICAvLyAgICAgIH0gZWxzZVxuICAgICAgIC8vICAgICAgICAgIHN1Z0RpdkNsYXNzLmFwcGVuZChyZWNOYW1lVGV4dCk7XG5cbiAgICAgICAvLyAgICAgIC8vR2V0IGJvdGggdGhlIFRpdGxlIGFuZCBVUkwgdmFsdWVzIGFuZCBjcmVhdGUgYSBsaW5rIHRhZyBvdXQgb2YgdGhlbVxuICAgICAgIC8vICAgICAgLy8gV2UncmUgb25seSBncmFiYmluZyB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgdGhlIExJTksgYXJyYXlcbiAgICAgICAvLyAgICAgIGlmIChyZWNWYWxBbGlhcy5MSU5LWzBdICE9IG51bGwpIHtcbiAgICAgICAvLyAgICAgICAgICB2YXIgcmVjQXJlYUxpbmtUaXRsZSA9IHJlY1ZhbEFsaWFzLkxJTktbMF0uVGl0bGU7XG4gICAgICAgLy8gICAgICAgICAgdmFyIHJlY0FyZWFVcmwgPSByZWNWYWxBbGlhcy5MSU5LWzBdLlVSTDtcbiAgICAgICAvLyAgICAgICAgICB2YXIgcmVjQXJlYUxpbmsgPSAkKFwiPGEgLz5cIiwge1xuICAgICAgIC8vICAgICAgICAgICAgICBocmVmOiByZWNBcmVhVXJsLFxuICAgICAgIC8vICAgICAgICAgICAgICB0ZXh0OiByZWNBcmVhTGlua1RpdGxlLFxuICAgICAgIC8vICAgICAgICAgICAgICB0YXJnZXQ6IFwiX2JsYW5rXCJ9KTtcblxuICAgICAgIC8vICAgICAgICAgIHZhciByZWNBcmVhTGlua1AgPSAkKFwiPGxpIGNhcmQtY29udGVudD5cIikuYXBwZW5kKHJlY0FyZWFMaW5rKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAvLyAgICAgICAgICBzdWdEaXZDbGFzcy5hcHBlbmQocmVjQXJlYUxpbmtQKTtcbiAgICAgICAvLyAgICAgIH0gZWxzZSBcbiAgICAgICAvLyAgICAgICAgICBzdWdEaXZDbGFzcy5hcHBlbmQoXCI8bGkgY2FyZC1jb250ZW50PlwiKTtcblxuICAgICAgIC8vICAgICAgJChmaWx0ZXJlZFR5cGUpLmFwcGVuZChzdWdEaXZDbGFzcyk7XG5cbiAgICAgICAvLyAgICAgIHN1Z0RpdkNsYXNzLmNsaWNrKHJlY1ZhbEFsaWFzLnNob3dEZXRhaWxzKTtcbiAgICAgICAgICAgIFxuICAgICAgIC8vICAgICAgc3VnRGl2Q2xhc3MuaG92ZXIocmVjVmFsQWxpYXMuaGlnaGxpZ2h0TWFya2VyLCByZWNWYWxBbGlhcy51bkhpZ2hsaWdodE1hcmtlcik7XG5cbiAgICAgICAvLyB9XG5cbiAgICBpZiAocmVjZGF0YS52YWwubGVuZ3RoID09PSAwKXsgICBcbiAgICAgICAgIGlmIChmaWx0ZXJlZFR5cGUgPT09IFwiI2ZpbHRlcmVkXCIpe1xuICAgICAgICAgICAgJChmaWx0ZXJlZFR5cGUpLmFwcGVuZChcIjxsaSBpZD0nbm9uZUZvdW5kJyBjbGFzcz0nY2VudGVyIGNvbGxlY3Rpb24taXRlbSc+Tm8gcmVjcmVhdGlvbiBhcmVhcyBmb3VuZC48L2xpPlwiKTtcbiAgICAgICAgIH0gZWxzZSBpZiAoZmlsdGVyZWRUeXBlID09PSBcIiNib29rbWFya2VkXCIpIHtcbiAgICAgICAgICAgICQoZmlsdGVyZWRUeXBlKS5hcHBlbmQoXCI8bGkgaWQ9J25vLWJvb2ttYXJrJyBjbGFzcz0nY2VudGVyIGNvbGxlY3Rpb24taXRlbSc+Tm90aGluZyBib29rbWFya2VkLjwvbGk+XCIpO1xuICAgICAgICB9XG4gICAgIH1cbiAgICB9XG5cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIiNib29rbWFya2VkXCIpLmFwcGVuZChcIjxsaSBpZD0nbm8tYm9va21hcmsnIGNsYXNzPSdjZW50ZXIgY29sbGVjdGlvbi1pdGVtJz5Ob3RoaW5nIGJvb2ttYXJrZWQuPC9kaXY+XCIpO1xufSk7XG5cbnN0YXRlLnJlY3JlYXRpb24uZmlsdGVyZWQub24oXCJjaGFuZ2VcIiwgIGZ1bmN0aW9uKHJlY2RhdGEpe1xuXG4gICAgICAgIHZhciBmaWx0ZXJlZFR5cGUgPSBcIiNmaWx0ZXJlZFwiO1xuICAgICAgICBkaXNwbGF5UmVjQXJlYVN1bW1hcnkocmVjZGF0YSwgZmlsdGVyZWRUeXBlKTtcblxufSk7XG5zdGF0ZS5yZWNyZWF0aW9uLmJvb2ttYXJrZWQub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24ocmVjZGF0YSl7XG5cbiAgICAgICAgdmFyIGZpbHRlcmVkVHlwZSA9IFwiI2Jvb2ttYXJrZWRcIjtcbiAgICAgICAgZGlzcGxheVJlY0FyZWFTdW1tYXJ5KHJlY2RhdGEsIGZpbHRlcmVkVHlwZSk7XG59KTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9kaXNwbGF5UmVjQXJlYVN1Z2dlc3Rpb25zLmpzXG4vLyBtb2R1bGUgaWQgPSAxMlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuXG5sZXQgY3VycmVudFRpbWVySWQ7XG5cbmZ1bmN0aW9uIHNldEJ1dHRvblN0YXR1cyhjYW5Mb2FkKXtcbiAgIGlmKGNhbkxvYWQpe1xuICAgICAgJCgnI21vYmlsZS1maW5kLXJlYycpLnJlbW92ZUNsYXNzKCdyZWMtbmF2bG9hZC1kaXNhYmxlZCcpO1xuICAgICAgJCgnI21vYmlsZS1maW5kLXJlYyBpJykucmVtb3ZlQ2xhc3MoJ2JsdWUtZ3JleS10ZXh0IHRleHQtZGFya2VuLTInKTtcbiAgICAgICQoJyNtb2JpbGUtZmluZC1yZWMnKS5hdHRyKCd0YWJpbmRleCcsIDApO1xuXG4gICAgICAkKCcjZmluZC1yZWMnKS5hZGRDbGFzcygncHVsc2UnKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICQoJyNmaW5kLXJlYycpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gICAgICBjbGVhclRpbWVvdXQoY3VycmVudFRpbWVySWQpO1xuICAgICAgY3VycmVudFRpbWVySWQgPSBzZXRUaW1lb3V0KCgpID0+IHskKCcjZmluZC1yZWMnKS5yZW1vdmVDbGFzcygncHVsc2UnKX0sIDEwMDAwKTtcbiAgIH1cbiAgIGVsc2V7XG4gICAgICAkKCcjbW9iaWxlLWZpbmQtcmVjJykuYWRkQ2xhc3MoJ3JlYy1uYXZsb2FkLWRpc2FibGVkJyk7XG4gICAgICAkKCcjbW9iaWxlLWZpbmQtcmVjIGknKS5hZGRDbGFzcygnYmx1ZS1ncmV5LXRleHQgdGV4dC1kYXJrZW4tMicpO1xuICAgICAgJCgnI21vYmlsZS1maW5kLXJlYycpLmF0dHIoJ3RhYmluZGV4JywgLTEpO1xuXG4gICAgICAkKCcjZmluZC1yZWMnKS5yZW1vdmVDbGFzcygncHVsc2UnKS5hdHRyKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgJCgnI2ZpbmQtcmVjJykuYXR0cigndGFiaW5kZXgnLCAtMSk7XG4gICAgICBjbGVhclRpbWVvdXQoY3VycmVudFRpbWVySWQpO1xuICAgfVxufVxuXG5mdW5jdGlvbiBzaG93QnV0dG9uKHN0YXR1cykge1xuICAgdmFyIGNvbnRhaW5lciA9ICQoJyNidXR0b24tY29udGFpbmVyJyk7XG4gICB2YXIgdGV4dDtcbiAgIHZhciBidG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwiYnRuIGNlbnRlclwiPicpXG4gICAgICAudGV4dCgnRmluZCBSZWNyZWF0aW9uJylcbiAgICAgIC5jbGljayhzdGF0ZS5yZWNyZWF0aW9uLnNlYXJjaClcbiAgICAgIC5jc3Moe1xuICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgIG1hcmdpbjogJzAgYXV0bydcbiAgICAgIH0pO1xuICAgdmFyIGljb24gPSAkKCc8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zIHBpbmstdGV4dCB0ZXh0LWFjY2VudDNcIj48L2k+JykudGV4dCgnd2FybmluZycpO1xuXG4gICB2YXIgbm9JbnRlcmVzdCA9ICFzdGF0ZS5pbnRlcmVzdHMuc2VsZWN0ZWQubGVuZ3RoO1xuICAgdmFyIG5vTG9jYXRpb24gPSAhc3RhdGUucm91dGUubG9jYXRpb25Db3VudDtcbiAgIGlmKHN0YXR1cy52YWwuZmlyc3RMb2FkICYmIG5vSW50ZXJlc3QgJiYgbm9Mb2NhdGlvbil7XG4gICAgICB0ZXh0ID0gJ1NlbGVjdCBzb21lIGludGVyZXN0cyBhbmQgY2hvb3NlIGF0IGxlYXN0IG9uZSBsb2NhdGlvbiB0byBnZXQgc3RhcnRlZCc7XG4gICAgICBidG4uYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIHNldEJ1dHRvblN0YXR1cyhmYWxzZSk7XG4gICB9XG4gICBlbHNlIGlmKHN0YXR1cy52YWwuZmlyc3RMb2FkICYmIG5vSW50ZXJlc3Qpe1xuICAgICAgdGV4dCA9ICdTZWxlY3QgYXQgbGVhc3Qgb25lIGludGVyZXN0IHRvIGdldCBzdGFydGVkJztcbiAgICAgIGJ0bi5hdHRyKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgc2V0QnV0dG9uU3RhdHVzKGZhbHNlKTtcbiAgIH1cbiAgIGVsc2UgaWYoc3RhdHVzLnZhbC5maXJzdExvYWQgJiYgbm9Mb2NhdGlvbil7XG4gICAgICB0ZXh0ID0gJ1NlbGVjdCBhdCBsZWFzdCBvbmUgbG9jYXRpb24gdG8gZ2V0IHN0YXJ0ZWQnO1xuICAgICAgYnRuLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICBzZXRCdXR0b25TdGF0dXMoZmFsc2UpO1xuICAgfVxuICAgZWxzZSBpZihzdGF0dXMudmFsLmZpcnN0TG9hZCl7XG4gICAgICB0ZXh0ID0gJ0NsaWNrIHRoZSBidXR0b24gdG8gZ2V0IHN0YXJ0ZWQnXG4gICAgICBpY29uID0gbnVsbDtcbiAgICAgIHNldEJ1dHRvblN0YXR1cyh0cnVlKTtcbiAgICAgIGJ0bi5hZGRDbGFzcygncHVsc2UnKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgIGJ0bi5yZW1vdmVDbGFzcygncHVsc2UnKTtcbiAgICAgIH0sIDUwMCk7XG4gICB9XG4gICBlbHNlIGlmKG5vSW50ZXJlc3Qpe1xuICAgICAgdGV4dCA9ICdTZWxlY3QgYXQgbGVhc3Qgb25lIGludGVyZXN0IHRvIHNlYXJjaCBmb3IgcmVjcmVhdGlvbiBhcmVhcyc7XG4gICAgICBidG4uYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIHNldEJ1dHRvblN0YXR1cyhmYWxzZSk7XG4gICB9XG4gICBlbHNlIGlmKG5vTG9jYXRpb24pe1xuICAgICAgdGV4dCA9ICdTZWxlY3QgYXQgbGVhc3Qgb25lIGxvY2F0aW9uIHRvIHNlYXJjaCBmb3IgcmVjcmVhdGlvbiBhcmVhcyc7XG4gICAgICBidG4uYXR0cignZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIHNldEJ1dHRvblN0YXR1cyhmYWxzZSk7XG4gICB9XG4gICBlbHNle1xuICAgICAgdGV4dCA9ICdOZXcgcmVjcmVhdGlvbiBhcmVhcyBtYXkgYmUgYXZhaWxhYmxlLidcbiAgICAgIGljb24gPSBudWxsO1xuICAgICAgc2V0QnV0dG9uU3RhdHVzKHRydWUpO1xuICAgICAgYnRuLmFkZENsYXNzKCdwdWxzZScpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgYnRuLnJlbW92ZUNsYXNzKCdwdWxzZScpO1xuICAgICAgfSwgNTAwKTtcbiAgIH1cblxuICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICBpZiggc3RhdHVzLnZhbC5zaG91bGRMb2FkIHx8IHN0YXR1cy52YWwuZmlyc3RMb2FkIHx8ICFzdGF0dXMudmFsLmNhbkxvYWQpe1xuICAgICAgY29udGFpbmVyLmFwcGVuZCgkKCc8cD4nKS50ZXh0KHRleHQpLnByZXBlbmQoaWNvbiksIGJ0bik7XG4gICAgICAkKCcjbGF5b3V0LWxvYWRpbmctYXJlYXMnKS5oaWRlKCk7XG4gICB9XG4gICBlbHNlIGlmKHN0YXR1cy52YWwubG9hZGluZyl7XG4gICAgICBzZXRCdXR0b25TdGF0dXMoZmFsc2UpO1xuICAgICAgJCgnI2xheW91dC1sb2FkaW5nLWFyZWFzJykuc2hvdygpO1xuICAgICAgdGV4dCA9ICdMb2FkaW5nIHJlY3JlYXRpb24gYXJlYXPigKYnXG4gICAgICBjb250YWluZXIuYXBwZW5kKCQoJzxwPicpLnRleHQodGV4dCksIFxuICAgICAgICAgYDxkaXYgY2xhc3M9XCJwcmVsb2FkZXItd3JhcHBlciBiaWcgYWN0aXZlXCI+XG4gICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNwaW5uZXItbGF5ZXIgc3Bpbm5lci1ibHVlLW9ubHlcIj5cbiAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjaXJjbGUtY2xpcHBlciBsZWZ0XCI+XG4gICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjaXJjbGVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgIDwvZGl2PjxkaXYgY2xhc3M9XCJnYXAtcGF0Y2hcIj5cbiAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNpcmNsZVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgPC9kaXY+PGRpdiBjbGFzcz1cImNpcmNsZS1jbGlwcGVyIHJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjaXJjbGVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICA8L2Rpdj5gKTtcbiAgIH1cbiAgIGVsc2V7XG4gICAgICBzZXRCdXR0b25TdGF0dXMoZmFsc2UpO1xuICAgICAgJCgnI2xheW91dC1sb2FkaW5nLWFyZWFzJykuaGlkZSgpO1xuICAgfVxufVxuXG5zdGF0ZS5pbnRlcmVzdHMub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGUpe1xuICAgdmFyIGxvYWRlZCA9IHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLmxvYWRlZEFjdGl2aXRpZXM7XG4gICB2YXIgZmlsdGVyZWQgPSBzdGF0ZS5yZWNyZWF0aW9uLnN0YXR1cy5maWx0ZXJlZEFjdGl2aXRpZXM7XG4gICB2YXIgc2hvdWxkTG9hZCA9IHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQWN0aXZpdGllcztcbiAgIHZhciBzaG91bGRGaWx0ZXIgPSBmYWxzZTtcbiAgIHZhciByZXNldENvb3JkcyA9IGZhbHNlO1xuICAgZS52YWwuYWxsLmZvckVhY2goKGludGVyZXN0KSA9PiB7XG4gICAgICBpZighbG9hZGVkW2ludGVyZXN0LmlkXSAmJiBpbnRlcmVzdC5zZWxlY3RlZCl7XG4gICAgICAgICBzaG91bGRMb2FkID0gdHJ1ZTtcbiAgICAgICAgIHJlc2V0Q29vcmRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmKGludGVyZXN0LnNlbGVjdGVkICE9PSBmaWx0ZXJlZFtpbnRlcmVzdC5pZF0pe1xuICAgICAgICAgc2hvdWxkRmlsdGVyID0gdHJ1ZTtcbiAgICAgICAgIGZpbHRlcmVkW2ludGVyZXN0LmlkXSA9IGludGVyZXN0LnNlbGVjdGVkO1xuICAgICAgfVxuICAgfSk7XG4gICB2YXIgY2FuTG9hZCA9ICEhZS52YWwuc2VsZWN0ZWQubGVuZ3RoICYmICEhc3RhdGUucm91dGUubG9jYXRpb25Db3VudDtcbiAgIHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQ29vcmRzID0gcmVzZXRDb29yZHM7XG4gICBzdGF0ZS5yZWNyZWF0aW9uLnN0YXR1cy51cGRhdGUoe3Nob3VsZExvYWQ6IHNob3VsZExvYWQsIGNhbkxvYWQ6IGNhbkxvYWR9KTtcbiAgIGlmKCBzaG91bGRGaWx0ZXIpe1xuICAgICAgc3RhdGUucmVjcmVhdGlvbi5maWx0ZXJBbGwoKTtcbiAgIH1cbn0pO1xuXG4vL3JldHVybnMgdHJ1ZSBpZiB0aGUgYXJlYSBvZiBBIGlzIChtb3N0bHkpIGNvbnRhaW5lZCBpbiB0aGUgYXJlYSBvZiBCXG5mdW5jdGlvbiBpc0NvbnRhaW5lZChhcnJBLCByYWRBLCBhcnJCLCByYWRCKXtcbiAgIGxldCBhbGxDb250YWluZWQgPSB0cnVlO1xuICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJBLmxlbmd0aCAmJiBhbGxDb250YWluZWQ7IGkrKyl7XG4gICAgICBsZXQgY3VycmVudENvbnRhaW5lZCA9IGZhbHNlO1xuICAgICAgZm9yKCBsZXQgaiA9IDA7IGogPCBhcnJCLmxlbmd0aCAmJiAhY3VycmVudENvbnRhaW5lZDsgaisrKXtcbiAgICAgICAgIGxldCBkaXN0YW5jZSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKFxuICAgICAgICAgICAgYXJyQVtpXSwgYXJyQltqXSk7XG4gICAgICAgICBpZihkaXN0YW5jZSA8PSByYWRCIC0gcmFkQSl7XG4gICAgICAgICAgICBjdXJyZW50Q29udGFpbmVkID0gdHJ1ZTtcbiAgICAgICAgIH1cbiAgICAgICAgIGlmKCFjdXJyZW50Q29udGFpbmVkICYmIGogPCBhcnJCLmxlbmd0aCAtIDEpe1xuICAgICAgICAgICAgbGV0IGQxID0gZGlzdGFuY2U7XG4gICAgICAgICAgICBsZXQgZDIgPSBnb29nbGUubWFwcy5nZW9tZXRyeS5zcGhlcmljYWwuY29tcHV0ZURpc3RhbmNlQmV0d2VlbihcbiAgICAgICAgICAgIGFyckFbaV0sIGFyckJbaiArIDFdKTtcbiAgICAgICAgICAgIGN1cnJlbnRDb250YWluZWQgPSBkMSA8IHJhZEIgJiYgZDIgPCByYWRCO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgYWxsQ29udGFpbmVkID0gY3VycmVudENvbnRhaW5lZDtcbiAgIH1cbiAgIHJldHVybiBhbGxDb250YWluZWQ7XG59XG5cbnN0YXRlLm1hcC5kaXJlY3Rpb25zLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgIC8vbWFrZSB0aGlzIGNvbnN0YW50IDUwIG1pbGVzIVxuICAgdmFyIHJhZGl1cyA9IHN0YXRlLnJlY3JlYXRpb24uc2VhcmNoUmFkaXVzO1xuICAgdmFyIGxvYWRlZFNlYXJjaENvb3JkcyA9IHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLmxvYWRlZFNlYXJjaENvb3JkcztcbiAgIHZhciBuZXdSb3V0ZUNvb3JkcyA9IGUudmFsLmdldENvb3Jkc0J5UmFkaXVzKHJhZGl1cyk7XG4gICB2YXIgc2hvdWxkTG9hZCA9IHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQ29vcmRzO1xuICAgdmFyIHNob3VsZEZpbHRlciA9IHRydWU7XG4gICB2YXIgcmVzZXRBY3Rpdml0aWVzID0gZmFsc2U7XG5cbiAgIC8vaWYgdGhlcmUgaXMgbm8gbG9jYXRpb24gZ2l2ZW5cbiAgIGlmKG5ld1JvdXRlQ29vcmRzID09IG51bGwpe1xuICAgICAgLy9kbyBub3RoaW5nO1xuICAgfVxuICAgLy9pZiBub3RoaW5nIGhhcyBiZWVuIGxvYWRlZFxuICAgZWxzZSBpZighbG9hZGVkU2VhcmNoQ29vcmRzLmxlbmd0aCl7XG4gICAgICBzaG91bGRMb2FkID0gdHJ1ZTtcbiAgICAgIHJlc2V0QWN0aXZpdGllcyA9IHRydWU7XG4gICB9XG4gICBlbHNle1xuICAgICAgbGV0IG5ld0FyZWEgPSAhaXNDb250YWluZWQobmV3Um91dGVDb29yZHMsIHJhZGl1cywgbG9hZGVkU2VhcmNoQ29vcmRzLCAxNjA5MzQpO1xuICAgICAgc2hvdWxkTG9hZCA9IG5ld0FyZWEgfHwgc2hvdWxkTG9hZDtcbiAgICAgIHJlc2V0QWN0aXZpdGllcyA9IG5ld0FyZWE7XG4gICB9XG5cbiAgIHZhciBjYW5Mb2FkID0gISFzdGF0ZS5yb3V0ZS5sb2NhdGlvbkNvdW50ICYmICEhc3RhdGUuaW50ZXJlc3RzLnNlbGVjdGVkLmxlbmd0aDtcbiAgIHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQWN0aXZpdGllcyA9IHJlc2V0QWN0aXZpdGllcztcblxuICAgc3RhdGUucmVjcmVhdGlvbi5zdGF0dXMudXBkYXRlKHtzaG91bGRMb2FkOiBzaG91bGRMb2FkLCBjYW5Mb2FkOiBjYW5Mb2FkfSk7XG4gICBpZiggc2hvdWxkRmlsdGVyKXtcbiAgICAgIHN0YXRlLnJlY3JlYXRpb24uZmlsdGVyQWxsKCk7XG4gICB9XG59KTtcblxuLy8gLy9taWdodCBoYXZlIHRvIHdhaXQgZm9yIGRpcmVjdGlvbnMgdG8gY29tZSBiYWNrIGFuZCBiZSBwcm9jZXNzZWQuLi5cbi8vIHN0YXRlLnJvdXRlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbi8vICAgIHN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLnNob3VsZFJlc2V0TG9hZGVkQWN0aXZpdGllcyA9IHRydWU7XG4vLyAgICB2YXIgc2hvdWxkTG9hZCA9ICEhZS52YWwubGVuZ3RoO1xuLy8gICAgdmFyIGNhbkxvYWQgPSAhIWUudmFsLmxlbmd0aCAmJiAhIXN0YXRlLmludGVyZXN0cy5zZWxlY3RlZC5sZW5ndGg7XG4vLyAgICBzdGF0ZS5yZWNyZWF0aW9uLnN0YXR1cy51cGRhdGUoe3Nob3VsZExvYWQ6IHNob3VsZExvYWQsIGNhbkxvYWQ6IGNhbkxvYWR9KTtcbi8vIH0pXG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHNob3dCdXR0b24oc3RhdGUucmVjcmVhdGlvbi5zdGF0dXMubWFrZUV2ZW50KCkpKTtcbnN0YXRlLnJlY3JlYXRpb24uc3RhdHVzLm9uKCdjaGFuZ2UnLCBzaG93QnV0dG9uKTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvcmVjcmVhdGlvbi9sb2FkQnV0dG9uLmpzXG4vLyBtb2R1bGUgaWQgPSAxM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgJy4vaW50ZXJlc3RzLmNzcyc7XG5pbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuXG4gICAgXG4gICBcbiBmdW5jdGlvbiBhZGRDaGlwKCkge1xuICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5pbnRlcmVzdHMuYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBcbiAgICAgIGxldCBuZXdDaGlwID0gJCgnPGEgY2xhc3M9XCJjaGlwIGNlbnRlclwiIGhyZWY9XCIjXCI+PC9hPicpO1xuICAgICAgJChcIiN1bnNlbGVjdGVkLWludGVyZXN0c1wiKS5hcHBlbmQobmV3Q2hpcC50ZXh0KHN0YXRlLmludGVyZXN0cy5hbGxbaV0ubmFtZSkpO1xuICAgICAgXG4gICAgICAkKG5ld0NoaXApLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgIHN0YXRlLmludGVyZXN0cy5hbGxbaV0udG9nZ2xlKCk7XG4gICAgICB9KTtcbiAgIHN0YXRlLmludGVyZXN0cy5hbGxbaV0ub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIFxuICAgICAgaWYoZS52YWwpIHtcbiAgICAgICAgIG5ld0NoaXAuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICQoXCIjc2VsZWN0ZWQtaW50ZXJlc3RzXCIpLmFwcGVuZChuZXdDaGlwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBuZXdDaGlwLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xuICAgICAgICAgJChcIiN1bnNlbGVjdGVkLWludGVyZXN0c1wiKS5wcmVwZW5kKG5ld0NoaXApO1xuICAgICAgfVxuXG4gICB9KTtcbiAgIH1cbn1cblxuc3RhdGUuaW50ZXJlc3RzLm9uKCdjaGFuZ2UnLCAoZSkgPT4ge1xuICAgaWYgKCFlLnZhbC5zZWxlY3RlZC5sZW5ndGgpe1xuICAgICAgJCgnI2ludGVyZXN0cy1ub25lLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ2hpZGUnKTtcbiAgIH1cbiAgIGVsc2V7XG4gICAgICAkKCcjaW50ZXJlc3RzLW5vbmUtc2VsZWN0ZWQnKS5hZGRDbGFzcygnaGlkZScpO1xuICAgfVxufSlcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgIGFkZENoaXAoKTtcblxuXG4gICAkKFwiI2NsZWFyLWludGVyZXN0c1wiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICBcbiAgICAgIHN0YXRlLmludGVyZXN0cy5zZWxlY3RlZC5mb3JFYWNoKGZ1bmN0aW9uKGNsZWFyKSB7XG4gICAgICAgICBjbGVhci51cGRhdGUoZmFsc2UsIHRydWUpO1xuICAgICAgfSk7XG4gICAgICBzdGF0ZS5pbnRlcmVzdHMuZW1pdCgnY2hhbmdlJyk7XG4gICB9KTtcbn0pXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL2ludGVyZXN0cy9pbnRlcmVzdHMuanNcbi8vIG1vZHVsZSBpZCA9IDE0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2ludGVyZXN0cy5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIFByZXBhcmUgY3NzVHJhbnNmb3JtYXRpb25cbnZhciB0cmFuc2Zvcm07XG5cbnZhciBvcHRpb25zID0ge31cbm9wdGlvbnMudHJhbnNmb3JtID0gdHJhbnNmb3JtXG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXMuanNcIikoY29udGVudCwgb3B0aW9ucyk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vaW50ZXJlc3RzLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9pbnRlcmVzdHMuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL2ludGVyZXN0cy9pbnRlcmVzdHMuY3NzXG4vLyBtb2R1bGUgaWQgPSAxNVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHVuZGVmaW5lZCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuaW50ZXJlc3RzLWNoaXBzLWNvbnRhaW5lciAuY2hpcHtcXG4gICB3aWR0aDogY2FsYyg1MCUgLSA1cHgpO1xcbiAgIG92ZXJmbG93OiBoaWRkZW47XFxufVxcblxcbiNpbnRlcmVzdHMgaDN7XFxuICAgZm9udC1zaXplOiAxcmVtO1xcbn1cXG5cXG4jaW50ZXJlc3RzIGgzOmZpcnN0LWNoaWxke1xcbiAgIG1hcmdpbi10b3A6IDAuNXJlbTtcXG4gICBtYXJnaW4tYm90dG9tOiAwO1xcbn1cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyIS4vc3JjL2NvbXBvbmVudHMvaW50ZXJlc3RzL2ludGVyZXN0cy5jc3Ncbi8vIG1vZHVsZSBpZCA9IDE2XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCAnLi9sYXlvdXQuY3NzJztcbmltcG9ydCBzdGF0ZSBmcm9tICcuLi9zdGF0ZS9zdGF0ZSc7XG5cbnN0YXRlLnJvdXRlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgIGlmKGUudmFsLmxlbmd0aCA+PSAyKXtcbiAgICAgICQoJyNzaG93LWRpcmVjdGlvbnMnKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICQoJyNzaG93LWRpcmVjdGlvbnMnKS5hdHRyKCd0YWJpbmRleCcsIDApO1xuXG4gICAgICAkKCcjbW9iaWxlLXNob3ctZGlyZWN0aW9ucycpLnJlbW92ZUNsYXNzKCdyZWMtbmF2bG9hZC1kaXNhYmxlZCcpO1xuICAgICAgJCgnI21vYmlsZS1zaG93LWRpcmVjdGlvbnMgaScpLnJlbW92ZUNsYXNzKCdibHVlLWdyZXktdGV4dCB0ZXh0LWRhcmtlbi0yJyk7XG4gICAgICAkKCcjbW9iaWxlLXNob3ctZGlyZWN0aW9ucycpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gICB9XG4gICBlbHNle1xuICAgICAgJCgnI3Nob3ctZGlyZWN0aW9ucycpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAkKCcjc2hvdy1kaXJlY3Rpb25zJykuYXR0cigndGFiaW5kZXgnLCAtMSk7XG5cbiAgICAgICQoJyNtb2JpbGUtc2hvdy1kaXJlY3Rpb25zJykuYWRkQ2xhc3MoJ3JlYy1uYXZsb2FkLWRpc2FibGVkJyk7XG4gICAgICAkKCcjbW9iaWxlLXNob3ctZGlyZWN0aW9ucyBpJykuYWRkQ2xhc3MoJ2JsdWUtZ3JleS10ZXh0IHRleHQtZGFya2VuLTInKTtcbiAgICAgICQoJyNtb2JpbGUtc2hvdy1kaXJlY3Rpb25zJykuYXR0cigndGFiaW5kZXgnLCAtMSk7XG4gICB9XG59KTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnc2VsZWN0JykubWF0ZXJpYWxfc2VsZWN0KCk7XG5cdFxuXHQkKFwiLmRlc3RpbmF0aW9uLWlucHV0XCIpLm9uKCdmb2N1cycsIGZ1bmN0aW9uKCkge1xuIFx0XHRpZiAoJChcIiNpbnRlcmVzdHMtaGVhZGVyXCIpLmhhc0NsYXNzKCdhY3RpdmUnKSkge1xuIFx0XHRcdCQoXCIjaW50ZXJlc3RzLWhlYWRlclwiKS5jbGljaygpO1xuIFx0XHR9XG4gXHR9KTtcblxuXHQkKCcjdHV0b3JpYWwtbW9kYWwnKS5tb2RhbCgpO1xuXG5cbiAgIC8vbW9iaWxlIGJ1dHRvbnM6XG4gICAkKCcjbW9iaWxlLXNob3ctaW50ZXJlc3RzJykuY2xpY2soZnVuY3Rpb24oZSl7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtb2JpbGVTaG93KCcjaW50ZXJlc3RzLWNvbnRhaW5lcicpO1xuICAgICAgJCh0aGlzKS5ibHVyKCk7XG4gICB9KTtcbiAgICQoJyNtb2JpbGUtc2hvdy1yb3V0ZScpLmNsaWNrKGZ1bmN0aW9uKGUpe1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbW9iaWxlU2hvdygnI3JvdXRlLWNvbnRhaW5lcicpO1xuICAgICAgJCh0aGlzKS5ibHVyKCk7XG4gICB9KTtcbiAgICQoJyNtb2JpbGUtc2hvdy1tYXAnKS5jbGljayhmdW5jdGlvbihlKXtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1vYmlsZVNob3coJyNtYXAnKTtcbiAgICAgICQodGhpcykuYmx1cigpO1xuICAgfSk7XG4gICAkKCcjbW9iaWxlLXNob3ctc3VnZ2VzdGlvbnMnKS5jbGljayhmdW5jdGlvbihlKXtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1vYmlsZVNob3coJyNzdWdnZXN0aW9ucy1jb250YWluZXInKTtcbiAgICAgICQodGhpcykuYmx1cigpO1xuICAgfSk7XG5cbiAgIC8vbm9uLW1vYmlsZSBidXR0b25zOlxuICAgJCgnI3Nob3ctaW50ZXJlc3RzJykuY2xpY2soZnVuY3Rpb24oZSl7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtZWRTaG93KCcjaW50ZXJlc3RzLWNvbnRhaW5lcicpO1xuXG4gICAgICBsYXJnZVNob3coJ2xheW91dC1zaG93LWludGVyZXN0cycpO1xuICAgICAgJCh0aGlzKS5ibHVyKCk7XG4gICB9KTtcbiAgICQoJyNjb2xsYXBzZS1pbnRlcmVzdHMnKS5jbGljayhmdW5jdGlvbihlKXtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1lZFNob3coJyNpbnRlcmVzdHMtY29udGFpbmVyJyk7XG5cbiAgICAgIGxhcmdlU2hvdygnbGF5b3V0LXNob3ctaW50ZXJlc3RzJywgdHJ1ZSk7XG4gICB9KTtcbiAgICQoJyNzaG93LXJvdXRlJykuY2xpY2soZnVuY3Rpb24oZSl7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtZWRTaG93KCcjcm91dGUtY29udGFpbmVyJyk7XG5cbiAgICAgIGxhcmdlU2hvdygnbGF5b3V0LXNob3ctcm91dGUnKTtcbiAgICAgICQodGhpcykuYmx1cigpO1xuICAgfSk7XG4gICAkKCcjY29sbGFwc2Utcm91dGUnKS5jbGljayhmdW5jdGlvbihlKXtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1lZFNob3coJyNyb3V0ZS1jb250YWluZXInKTtcblxuICAgICAgbGFyZ2VTaG93KCdsYXlvdXQtc2hvdy1yb3V0ZScsIHRydWUpO1xuICAgfSk7XG4gICAkKCcjc2hvdy1zdWdnZXN0aW9ucycpLmNsaWNrKGZ1bmN0aW9uKGUpe1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbWVkU2hvdygnI3N1Z2dlc3Rpb25zLWNvbnRhaW5lcicpO1xuXG4gICAgICBsYXJnZVNob3coJ2xheW91dC1zaG93LXN1Z2dlc3Rpb25zJyk7XG4gICAgICAkKHRoaXMpLmJsdXIoKTtcbiAgIH0pO1xuICAgJCgnI2NvbGxhcHNlLXN1Z2dlc3Rpb25zJykuY2xpY2soZnVuY3Rpb24oZSl7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtZWRTaG93KCcjc3VnZ2VzdGlvbnMtY29udGFpbmVyJyk7XG5cbiAgICAgIGxhcmdlU2hvdygnbGF5b3V0LXNob3ctc3VnZ2VzdGlvbnMnKTtcbiAgIH0pO1xuXG59KTtcblxuZnVuY3Rpb24gbW9iaWxlU2hvdyhkaXZJZCl7XG4gICAkKCcubGF5b3V0LXNob3duLW1vYmlsZScpLnJlbW92ZUNsYXNzKCdsYXlvdXQtc2hvd24tbW9iaWxlJyk7XG4gICAkKGRpdklkKS5hZGRDbGFzcygnbGF5b3V0LXNob3duLW1vYmlsZScpO1xufVxuXG5jb25zdCB0aW1lcklkcyA9IHtcbn1cbmZ1bmN0aW9uIG1lZFNob3coZGl2SWQpe1xuICAgbGV0IGRpdiA9ICQoZGl2SWQpO1xuICAgaWYoIGRpdi5oYXNDbGFzcygnbGF5b3V0LW1lZC1zaG93bicpKXtcbiAgICAgIGRpdi5yZW1vdmVDbGFzcygnbGF5b3V0LW1lZC1zaG93bicpO1xuICAgICAgdGltZXJJZHNbZGl2SWRdID0gc2V0VGltZW91dCgoKSA9PiB7IFxuICAgICAgICAgZGl2LnJlbW92ZUNsYXNzKCdsYXlvdXQtbWVkLXZpc2libGUnKTtcbiAgICAgIH0sIDUwMCk7XG4gICB9XG4gICBlbHNle1xuICAgICAgbGV0IHNob3duID0gJCgnLmxheW91dC1tZWQtc2hvd24nKTtcbiAgICAgIGlmKHNob3duLmxlbmd0aCl7XG4gICAgICAgICB0aW1lcklkc1sgJyMnICsgc2hvd24uZmlyc3QoKS5hdHRyKCdpZCcpXSA9IHNldFRpbWVvdXQoKCkgPT4geyBcbiAgICAgICAgICAgIHNob3duLnJlbW92ZUNsYXNzKCdsYXlvdXQtbWVkLXZpc2libGUnKTtcbiAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICBzaG93bi5yZW1vdmVDbGFzcygnbGF5b3V0LW1lZC1zaG93bicpO1xuICAgICAgfVxuICAgICAgZGl2LmFkZENsYXNzKCdsYXlvdXQtbWVkLXNob3duIGxheW91dC1tZWQtdmlzaWJsZScpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWRzW2RpdklkXSk7XG4gICB9XG59XG5cbi8vdGhpcyBzaG91bGQgYmUgcmVmYWN0b3JlZCB0byBub3QgYmUgc28gaGlkZW91cyBhbmQgcmVwZXRpdGl2ZVxuZnVuY3Rpb24gbGFyZ2VTaG93KGNsYXNzTmFtZSwgY2xpY2tlZEZyb21Db2xsYXBzZSl7XG4gICBsZXQgYm9keSA9ICQoJ2JvZHknKS5maXJzdCgpO1xuICAgaWYoXG4gICAgICBjbGlja2VkRnJvbUNvbGxhcHNlICYmXG4gICAgICBib2R5Lmhhc0NsYXNzKCdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKSAmJiBcbiAgICAgIGJvZHkuaGFzQ2xhc3MoJ2xheW91dC1zaG93LXJvdXRlJylcbiAgICl7XG4gICAgICBib2R5LnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XG4gICAgICBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1yb3V0ZScpe1xuICAgICAgICAgdGltZXJJZHMucm91dGVWaXNpYmlsaXR5ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBib2R5LnJlbW92ZUNsYXNzKCdsYXlvdXQtcm91dGUtdmlzaWJsZScpO1xuICAgICAgICAgfSwgNTAwKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoY2xhc3NOYW1lID09PSAnbGF5b3V0LXNob3ctaW50ZXJlc3RzJyl7XG4gICAgICAgICB0aW1lcklkcy5pbnRlcmVzdHNWaXNpYmlsaXR5ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBib2R5LnJlbW92ZUNsYXNzKCdsYXlvdXQtaW50ZXJlc3RzLXZpc2libGUnKTtcbiAgICAgICAgIH0sIDUwMCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICB9XG4gICBlbHNlIGlmKGNsaWNrZWRGcm9tQ29sbGFwc2UgJiYgIWJvZHkuaGFzQ2xhc3MoY2xhc3NOYW1lKSl7XG4gICAgICBib2R5LmFkZENsYXNzKGNsYXNzTmFtZSk7XG4gICAgICBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1yb3V0ZScpe1xuICAgICAgICAgYm9keS5hZGRDbGFzcygnbGF5b3V0LXJvdXRlLXZpc2libGUnKTtcbiAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkcy5yb3V0ZVZpc2liaWxpdHkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKXtcbiAgICAgICAgIGJvZHkuYWRkQ2xhc3MoJ2xheW91dC1pbnRlcmVzdHMtdmlzaWJsZScpO1xuICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWRzLmludGVyZXN0c1Zpc2liaWxpdHkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgfVxuXG4gICAvL2lmIHRoaXMgaXMgdG8gc2hvdyBzdWdnZXN0aW9uc1xuICAgaWYoIGNsYXNzTmFtZSA9PT0gJ2xheW91dC1zaG93LXN1Z2dlc3Rpb25zJyl7XG4gICAgICAvL2p1c3QgdG9nZ2xlIHdoZXRoZXIgc3VnZ2VzdGlvbnMgaXMgb3Blbi9jbG9zZWRcbiAgICAgIGlmKGJvZHkuaGFzQ2xhc3MoY2xhc3NOYW1lKSl7XG4gICAgICAgICBib2R5LnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XG4gICAgICAgICB0aW1lcklkc1tjbGFzc05hbWVdID0gc2V0VGltZW91dCgoKSA9PiB7IFxuICAgICAgICAgICAgYm9keS5yZW1vdmVDbGFzcygnbGF5b3V0LXJpZ2h0LXNiLXZpc2libGUnKTtcbiAgICAgICAgIH0sIDUwMCk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWRzW2NsYXNzTmFtZV0pO1xuICAgICAgICAgYm9keS5hZGRDbGFzcygnbGF5b3V0LXJpZ2h0LXNiLXZpc2libGUgJyArIGNsYXNzTmFtZSk7XG4gICAgICB9XG4gICB9XG4gICBlbHNle1xuICAgICAgLy9pZiBpbnRlcmVzdHMgYW5kIHJvdXRlIGFyZSBib3RoIG9wZW5cbiAgICAgIGlmKFxuICAgICAgICAgYm9keS5oYXNDbGFzcygnbGF5b3V0LWxlZnQtc2Itb3BlbicpICYmXG4gICAgICAgICBib2R5Lmhhc0NsYXNzKCdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKSAmJiBcbiAgICAgICAgIGJvZHkuaGFzQ2xhc3MoJ2xheW91dC1zaG93LXJvdXRlJylcbiAgICAgICl7XG4gICAgICAgICAvL2p1c3QgcmVtb3ZlIHRoZSBub3Qgc2VsZWN0ZWQgXG4gICAgICAgICBib2R5LnJlbW92ZUNsYXNzKCdsYXlvdXQtc2hvdy1pbnRlcmVzdHMgbGF5b3V0LXNob3ctcm91dGUnKTtcbiAgICAgICAgIGJvZHkuYWRkQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgIGlmKGNsYXNzTmFtZSA9PT0gJ2xheW91dC1zaG93LXJvdXRlJyl7XG4gICAgICAgICAgICB0aW1lcklkcy5yb3V0ZVZpc2liaWxpdHkgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1yb3V0ZS12aXNpYmxlJyk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuICAgICAgICAgZWxzZSBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKXtcbiAgICAgICAgICAgIHRpbWVySWRzLmludGVyZXN0c1Zpc2liaWxpdHkgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1pbnRlcmVzdHMtdmlzaWJsZScpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vZWxzZSBpZiBuZWl0aGVyIGlzIG9wZW5cbiAgICAgIGVsc2UgaWYoIWJvZHkuaGFzQ2xhc3MoJ2xheW91dC1sZWZ0LXNiLW9wZW4nKSl7XG4gICAgICAgICAvL29wZW4gc2lkZWJhciBhbmQgc2hvdyBzZWxlY3RlZCBcbiAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkcy5sZWZ0U2lkZUJhcik7XG4gICAgICAgICBib2R5LnJlbW92ZUNsYXNzKCdsYXlvdXQtc2hvdy1pbnRlcmVzdHMgbGF5b3V0LXNob3ctcm91dGUnKTtcbiAgICAgICAgIGJvZHkuYWRkQ2xhc3MoJ2xheW91dC1sZWZ0LXNiLXZpc2libGUgbGF5b3V0LWxlZnQtc2Itb3BlbicpO1xuICAgICAgICAgYm9keS5hZGRDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICAgaWYoY2xhc3NOYW1lID09PSAnbGF5b3V0LXNob3ctcm91dGUnKXtcbiAgICAgICAgICAgIGJvZHkuYWRkQ2xhc3MoJ2xheW91dC1yb3V0ZS12aXNpYmxlJyk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXJJZHMucm91dGVWaXNpYmlsaXR5KTtcbiAgICAgICAgIH1cbiAgICAgICAgIGVsc2UgaWYoY2xhc3NOYW1lID09PSAnbGF5b3V0LXNob3ctaW50ZXJlc3RzJyl7XG4gICAgICAgICAgICBib2R5LmFkZENsYXNzKCdsYXlvdXQtaW50ZXJlc3RzLXZpc2libGUnKTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkcy5pbnRlcmVzdHNWaXNpYmlsaXR5KTtcbiAgICAgICAgIH1cbiAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge2JvZHkuYWRkQ2xhc3MoJ2xheW91dC1sZWZ0LWhlaWdodC1zaG91bGQtYW5pbWF0ZScpfSwgMSk7XG4gICAgICB9XG4gICAgICAvL2Vsc2UgaWYgdGhlIHNlbGVjdGVkIGlzIG5vdCBvcGVuXG4gICAgICBlbHNlIGlmICghYm9keS5oYXNDbGFzcyhjbGFzc05hbWUpKXtcbiAgICAgICAgIC8vY2xvc2UgdGhlIHVuc2VsZWN0ZWQgYW5kIG9wZW4gc2VsZWN0ZWRcbiAgICAgICAgIGJvZHkuYWRkQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgIGlmKGNsYXNzTmFtZSA9PT0gJ2xheW91dC1zaG93LXJvdXRlJyl7XG4gICAgICAgICAgICBib2R5LmFkZENsYXNzKCdsYXlvdXQtcm91dGUtdmlzaWJsZScpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWRzLnJvdXRlVmlzaWJpbGl0eSk7XG4gICAgICAgICB9XG4gICAgICAgICBlbHNlIGlmKGNsYXNzTmFtZSA9PT0gJ2xheW91dC1zaG93LWludGVyZXN0cycpe1xuICAgICAgICAgICAgYm9keS5hZGRDbGFzcygnbGF5b3V0LWludGVyZXN0cy12aXNpYmxlJyk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXJJZHMuaW50ZXJlc3RzVmlzaWJpbGl0eSk7XG4gICAgICAgICB9XG4gICAgICAgICBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKXtcbiAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1zaG93LXJvdXRlJyk7XG4gICAgICAgICAgICB0aW1lcklkcy5yb3V0ZVZpc2liaWxpdHkgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1yb3V0ZS12aXNpYmxlJyk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1zaG93LWludGVyZXN0cycpO1xuICAgICAgICAgICAgdGltZXJJZHMuaW50ZXJlc3RzVmlzaWJpbGl0eSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgYm9keS5yZW1vdmVDbGFzcygnbGF5b3V0LWludGVyZXN0cy12aXNpYmxlJyk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9lbHNlIGlmIHRoZSBzZWxlY3RlZCBpcyBvcGVuXG4gICAgICBlbHNle1xuICAgICAgICAgLy9jbG9zZSB0aGUgc2lkZWJhciBhbmQgc2V0IHRpbWVvdXQgdG8gcmVtb3ZlIHRoZSBjbGFzc1xuICAgICAgICAgYm9keS5yZW1vdmVDbGFzcygnbGF5b3V0LWxlZnQtaGVpZ2h0LXNob3VsZC1hbmltYXRlJyk7XG4gICAgICAgICBib2R5LnJlbW92ZUNsYXNzKCdsYXlvdXQtbGVmdC1zYi1vcGVuJyk7XG4gICAgICAgICB0aW1lcklkcy5sZWZ0U2lkZUJhciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgYm9keS5yZW1vdmVDbGFzcygnbGF5b3V0LWxlZnQtc2ItdmlzaWJsZScpO1xuICAgICAgICAgICAgYm9keS5yZW1vdmVDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgIGlmKGNsYXNzTmFtZSA9PT0gJ2xheW91dC1zaG93LXJvdXRlJyl7XG4gICAgICAgICAgICB0aW1lcklkcy5yb3V0ZVZpc2liaWxpdHkgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1yb3V0ZS12aXNpYmxlJyk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgfVxuICAgICAgICAgZWxzZSBpZihjbGFzc05hbWUgPT09ICdsYXlvdXQtc2hvdy1pbnRlcmVzdHMnKXtcbiAgICAgICAgICAgIHRpbWVySWRzLmludGVyZXN0c1Zpc2liaWxpdHkgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2xhc3MoJ2xheW91dC1pbnRlcmVzdHMtdmlzaWJsZScpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cbiAgIC8vTm90ZTogc2lkZSBiYXIgb3BlbiBjbGFzcyBzaG91bGQgYWxsb3cgaGVpZ2h0cyB0byBhbmltYXRlP1xufVxuXG5cblxuXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL2xheW91dC9sYXlvdXQuanNcbi8vIG1vZHVsZSBpZCA9IDE3XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2xheW91dC5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIFByZXBhcmUgY3NzVHJhbnNmb3JtYXRpb25cbnZhciB0cmFuc2Zvcm07XG5cbnZhciBvcHRpb25zID0ge31cbm9wdGlvbnMudHJhbnNmb3JtID0gdHJhbnNmb3JtXG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXMuanNcIikoY29udGVudCwgb3B0aW9ucyk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbGF5b3V0LmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9sYXlvdXQuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL2xheW91dC9sYXlvdXQuY3NzXG4vLyBtb2R1bGUgaWQgPSAxOFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHVuZGVmaW5lZCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIvKmZpeCBmb3Igd2VpcmQgc2FmYXJpIG92ZXJmbG93Ki9cXG4uY2hpcHtcXG4gICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcbiAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xcbn1cXG5cXG4ubGF5b3V0LWhlYWRlci1tZW51IC5idG4tZmxvYXRpbmc6Zm9jdXMsIFxcbi5sYXlvdXQtZm9vdGVyLW1lbnUgLmJ0bi1mbG9hdGluZzpmb2N1cyxcXG4ubGF5b3V0LWhlYWRlci1tZW51IC5idG4tZmxvYXRpbmc6aG92ZXIsIFxcbi5sYXlvdXQtZm9vdGVyLW1lbnUgLmJ0bi1mbG9hdGluZzpob3ZlcntcXG4gICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxufVxcblxcblxcbiNsYXlvdXQtbG9hZGluZy1hcmVhc3tcXG4gICBtYXJnaW46IDA7XFxuICAgei1pbmRleDogMjtcXG59XFxuXFxuLmxheW91dC1zdWctdGFicywgLmxheW91dC1jb250YWluZXItaGVhZGVye1xcbiAgIHotaW5kZXg6IDM7XFxuICAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG5ib2R5e1xcbiAgIG9wYWNpdHk6IDE7XFxuICAgd2lkdGg6IDEwMHZ3O1xcbiAgIGhlaWdodDogMTAwdmg7XFxuICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG59XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogOTkzcHgpe1xcbiAgIC5sYXlvdXQtbG9nb3tcXG4gICAgICBsZWZ0OiAwLjVyZW07XFxuICAgfVxcbn1cXG5cXG4ubGF5b3V0LW1lbnUtb3B0aW9ucy0tZm9vdGVye1xcbiAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG59XFxuXFxuXFxuLmxheW91dC1mb290ZXItbWVudSwgLmxheW91dC1oZWFkZXItbWVudXtcXG4gICB6LWluZGV4OiAxMDtcXG4gICBwb3NpdGlvbjogcmVsYXRpdmU7XFxufVxcblxcbi5sYXlvdXQtZm9vdGVyLW1lbnV7XFxuICAgcG9zaXRpb246IGZpeGVkO1xcbiAgIGJvdHRvbTogMDtcXG59XFxuXFxuI21hcCwgLmxheW91dC1jb250YWluZXJ7XFxuICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgIHRvcDogNTZweDtcXG4gICB3aWR0aDogMTAwJTtcXG4gICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAxMTJweCk7XFxuICAgei1pbmRleDogMDtcXG4gICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcblxcbiAgIHZpc2liaWxpdHk6IGhpZGRlbjtcXG4gICBvcGFjaXR5OiAwO1xcbn1cXG4ubGF5b3V0LWNvbnRhaW5lcntcXG4gICBvdmVyZmxvdy15OiBoaWRkZW47XFxufVxcbi5sYXlvdXQtc2hvd24tbW9iaWxlLCAjbWFwLmxheW91dC1zaG93bi1tb2JpbGV7XFxuICAgei1pbmRleDogMjtcXG4gICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xcbiAgIG9wYWNpdHk6IDE7XFxufVxcblxcbi5sYXlvdXQtY29udGFpbmVyLWhlYWRlcntcXG4gICBkaXNwbGF5OiBmbGV4O1xcbiAgIGxpbmUtaGVpZ2h0OiAxLjU7XFxuICAgcGFkZGluZzogMXJlbTtcXG4gICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkO1xcbiAgIG92ZXJmbG93OiBoaWRkZW47XFxufVxcbi5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBoMntcXG4gICBmb250LXNpemU6IDEuNXJlbTtcXG4gICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICAgbWFyZ2luOiAwO1xcbiAgIHdpZHRoOiAxMDAlO1xcbn1cXG4ubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgaDIgYXtcXG4gICBmbG9hdDogcmlnaHQ7XFxuICAgdmlzaWJpbGl0eTogaGlkZGVuO1xcbn1cXG5cXG4ubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgaXtcXG4gICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xcbn1cXG5cXG4ubGF5b3V0LWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1ib2R5e1xcbiAgIGhlaWdodDogY2FsYygxMDB2aCAtIDE2NXB4KTtcXG4gICBvdmVyZmxvdy15OiBhdXRvO1xcbiAgIG92ZXJmbG93LXg6IGhpZGRlbjtcXG4gICBwYWRkaW5nLWJvdHRvbTogNDBweDtcXG4gICBwYWRkaW5nLXRvcDogMjBweDtcXG59XFxuXFxuLmxheW91dC1zdWdnZXN0aW9uLWxpc3R7XFxuICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjEzcHgpO1xcbiAgIG92ZXJmbG93LXk6IGF1dG87XFxuICAgcGFkZGluZy1ib3R0b206IDQwcHg7XFxuICAgcGFkZGluZy10b3A6IDIwcHg7XFxufVxcblxcbi5sYXlvdXQtc2Nyb2xsLXRvcHtcXG4gICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG4gICB6LWluZGV4OiAyO1xcbiAgIHRvcDogNTNweDtcXG4gICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgd2lkdGg6IGNhbGMoMTAwJSAtIDAuNzVyZW0pO1xcbiAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sIHJnYmEoMjU1LCAyNTUsIDI1NSwgMSkgMCUscmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpIDYwJSxyZ2JhKDI1NSwyNTUsMjU1LDApIDEwMCUpO1xcbiAgIGhlaWdodDogMjBweDtcXG59XFxuLmxheW91dC1zY3JvbGwtYm90dG9te1xcbiAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xcbiAgIHotaW5kZXg6IDI7XFxuICAgYm90dG9tOiAwO1xcbiAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICB3aWR0aDogY2FsYygxMDAlIC0gMC43NXJlbSk7XFxuICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHRvcCwgcmdiYSgyNTUsIDI1NSwgMjU1LCAxKSAwJSxyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSkgNjAlLHJnYmEoMjU1LDI1NSwyNTUsMCkgMTAwJSk7XFxuICAgaGVpZ2h0OiA0MHB4O1xcbn1cXG5cXG4jc3VnZ2VzdGlvbnMtY29udGFpbmVyIC5sYXlvdXQtc2Nyb2xsLXRvcHtcXG4gICB0b3A6IDEwMXB4O1xcbn1cXG5cXG5AbWVkaWEgYWxsIGFuZCAobWluLXdpZHRoOiA2MDFweCl7XFxuICAgLmxheW91dC1zaG93bi1tb2JpbGV7XFxuICAgICAgdmlzaWJpbGl0eTogaGlkZGVuO1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICAgfVxcbiAgICNtYXB7XFxuICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgIH1cXG4gICAjbWFwLCAubGF5b3V0LWNvbnRhaW5lcntcXG4gICAgICBtYXJnaW4tYm90dG9tOiAwO1xcbiAgICAgIHRvcDogNjRweDtcXG4gICAgICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA2NHB4KTtcXG4gICB9XFxuICAgLmxheW91dC1jb250YWluZXJ7XFxuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0zMzBweCk7XFxuICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuNXMgZWFzZTtcXG4gICAgICB3aWR0aDogMzIwcHg7XFxuICAgICAgei1pbmRleDogMzsgICAgXFxuICAgICAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDJweCAycHggMCByZ2JhKDAsMCwwLDAuMTQpLCAwIDFweCA1cHggMCByZ2JhKDAsMCwwLDAuMTIpLCAwIDNweCAxcHggLTJweCByZ2JhKDAsMCwwLDAuMik7XFxuICAgICAgYm94LXNoYWRvdzogMCAycHggMnB4IDAgcmdiYSgwLDAsMCwwLjE0KSwgMCAxcHggNXB4IDAgcmdiYSgwLDAsMCwwLjEyKSwgMCAzcHggMXB4IC0ycHggcmdiYSgwLDAsMCwwLjIpO1xcbiAgIH1cXG4gICAubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgaDIgYXtcXG4gICAgICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xcbiAgIH1cXG4gICAubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgYSBpe1xcbiAgICAgIGRpc3BsYXk6IG5vbmU7XFxuICAgfVxcbiAgIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBhIGk6bnRoLWNoaWxkKDMpe1xcbiAgICAgIGRpc3BsYXk6IGlubGluZTtcXG4gICB9XFxuICAgI3N1Z2dlc3Rpb25zLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgYSBpOm50aC1jaGlsZCgyKXtcXG4gICAgICBkaXNwbGF5OiBpbmxpbmU7XFxuICAgfVxcbiAgIC5sYXlvdXQtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWJvZHl7XFxuICAgICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMTE3cHgpO1xcbiAgIH1cXG5cXG4gICAubGF5b3V0LW1lZC1zaG93bntcXG4gICAgICB0cmFuc2Zvcm06IG5vbmU7XFxuICAgfVxcbiAgIC5sYXlvdXQtbWVkLXZpc2libGV7XFxuICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgIH1cXG5cXG4gICAubGF5b3V0LXN1Z2dlc3Rpb24tbGlzdHtcXG4gICAgICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAxNjVweCk7XFxuICAgfVxcbiAgICNsYXlvdXQtbG9hZGluZy1hcmVhc3tcXG4gICAgICBtYXJnaW46IDA7XFxuICAgICAgei1pbmRleDogNTtcXG4gICB9XFxufVxcblxcbkBtZWRpYSBhbGwgYW5kIChtaW4td2lkdGg6IDk5MnB4KXtcXG4gICAubGF5b3V0LXNjcm9sbC10b3B7XFxuICAgICAgdG9wOiA1NXB4O1xcbiAgIH1cXG4gICAjc3VnZ2VzdGlvbnMtY29udGFpbmVyIC5sYXlvdXQtc2Nyb2xsLXRvcHtcXG4gICAgICB0b3A6IDEwM3B4O1xcbiAgIH1cXG5cXG4gICAubGF5b3V0LWNvbnRhaW5lcntcXG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTMzMHB4KTtcXG4gICAgICB2aXNpYmlsaXR5OiBoaWRkZW47XFxuICAgICAgb3BhY2l0eTogMDtcXG4gICB9XFxuICAgLmxheW91dC1jb250YWluZXItaGVhZGVyIGF7XFxuICAgICAgZGlzcGxheTogbm9uZTtcXG4gICB9XFxuXFxuICAgI3JvdXRlLWNvbnRhaW5lcntcXG4gICAgICBib3R0b206IDA7XFxuICAgICAgdG9wOiBhdXRvOyAgXFxuICAgICAgaGVpZ2h0OiBhdXRvO1xcbiAgIH1cXG4gICAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWJvZHksXFxuICAgI2ludGVyZXN0cy1jb250YWluZXIgLmxheW91dC1jb250YWluZXItYm9keXtcXG4gICAgICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAxNzRweCk7XFxuICAgICAgdmlzaWJpbGl0eTogaGlkZGVuO1xcbiAgIH1cXG4gICAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlcntcXG4gICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI2RkZDtcXG4gICB9XFxuXFxuICAgI2ludGVyZXN0cy1jb250YWluZXJ7XFxuICAgICAgaGVpZ2h0OiBhdXRvO1xcbiAgIH1cXG5cXG4gICAjc3VnZ2VzdGlvbnMtY29udGFpbmVye1xcbiAgICAgIHJpZ2h0OiAwO1xcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgzMzBweCk7XFxuICAgfVxcblxcbiAgIC8qY29sbGFic2FibGUgYXJyb3dzKi9cXG4gICAvKnVzZWQgbnRoLWNoaWxkKG4pIGZvciBzcGVjaWZpY2l0eSovXFxuICAgLmxheW91dC1jb250YWluZXItaGVhZGVyIGEgaTpudGgtY2hpbGQobil7XFxuICAgICAgZGlzcGxheTogbm9uZTtcXG4gICB9XFxuICAgI3N1Z2dlc3Rpb25zLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1oZWFkZXIgYSBpOm50aC1jaGlsZCgyKXtcXG4gICAgICBkaXNwbGF5OiBub25lO1xcbiAgIH1cXG4gICAjc3VnZ2VzdGlvbnMtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBhIGk6bnRoLWNoaWxkKDEpe1xcbiAgICAgIGRpc3BsYXk6IGlubGluZTtcXG4gICB9XFxuICAgLmxheW91dC1zaG93LWludGVyZXN0czpub3QoLmxheW91dC1zaG93LXJvdXRlKSAjaW50ZXJlc3RzLWNvbnRhaW5lciAubGF5b3V0LWhpLWhpZGV7XFxuICAgICAgZGlzcGxheTogaW5saW5lOyBcXG4gICB9XFxuICAgLmxheW91dC1zaG93LWludGVyZXN0czpub3QoLmxheW91dC1zaG93LXJvdXRlKSAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtaGktY29sbGFwc2V7XFxuICAgICAgZGlzcGxheTogaW5saW5lOyBcXG4gICB9XFxuICAgLmxheW91dC1zaG93LXJvdXRlOm5vdCgubGF5b3V0LXNob3ctaW50ZXJlc3RzKSAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtaGktaGlkZXtcXG4gICAgICBkaXNwbGF5OiBpbmxpbmU7IFxcbiAgIH1cXG4gICAubGF5b3V0LXNob3ctcm91dGU6bm90KC5sYXlvdXQtc2hvdy1pbnRlcmVzdHMpICNpbnRlcmVzdHMtY29udGFpbmVyIC5sYXlvdXQtaGktZXhwYW5ke1xcbiAgICAgIGRpc3BsYXk6IGlubGluZTsgXFxuICAgfVxcbiAgIC5sYXlvdXQtc2hvdy1yb3V0ZS5sYXlvdXQtc2hvdy1pbnRlcmVzdHMgI2ludGVyZXN0cy1jb250YWluZXIgLmxheW91dC1oaS1jb2xsYXBzZXtcXG4gICAgICBkaXNwbGF5OiBpbmxpbmU7XFxuICAgfVxcbiAgIC5sYXlvdXQtc2hvdy1yb3V0ZS5sYXlvdXQtc2hvdy1pbnRlcmVzdHMgI3JvdXRlLWNvbnRhaW5lciAubGF5b3V0LWhpLWV4cGFuZHtcXG4gICAgICBkaXNwbGF5OiBpbmxpbmU7XFxuICAgfVxcblxcbiAgIC8qaW50ZXJlc3RzIG9wZW4qL1xcbiAgIC5sYXlvdXQtc2hvdy1pbnRlcmVzdHMgI3JvdXRlLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1ib2R5e1xcbiAgICAgIGhlaWdodDogMDtcXG4gICAgICBwYWRkaW5nLXRvcDogMDtcXG4gICAgICBwYWRkaW5nLWJvdHRvbTogMDtcXG4gICB9XFxuICAgLmxheW91dC1pbnRlcmVzdHMtdmlzaWJsZSAjaW50ZXJlc3RzLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1ib2R5e1xcbiAgICAgIHZpc2liaWxpdHk6IHZpc2libGU7XFxuICAgfVxcblxcbiAgIC8qcm91dGUgb3BlbiovXFxuICAgLmxheW91dC1zaG93LXJvdXRlICNyb3V0ZS1jb250YWluZXIgLmxheW91dC1jb250YWluZXItYm9keXtcXG4gICAgICBwYWRkaW5nLXRvcDogMjBweDtcXG4gICAgICBwYWRkaW5nLWJvdHRvbTogNDBweDtcXG4gICAgICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAxNzRweCk7XFxuICAgfVxcbiAgIC5sYXlvdXQtcm91dGUtdmlzaWJsZSAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWJvZHl7XFxuICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcXG4gICB9XFxuXFxuICAgLypyb3V0ZSBBTkQgaW50ZXJlc3RzIG9wZW4qL1xcbiAgIC5sYXlvdXQtc2hvdy1yb3V0ZS5sYXlvdXQtc2hvdy1pbnRlcmVzdHMgI3JvdXRlLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1ib2R5LFxcbiAgIC5sYXlvdXQtc2hvdy1yb3V0ZS5sYXlvdXQtc2hvdy1pbnRlcmVzdHMgI2ludGVyZXN0cy1jb250YWluZXIgLmxheW91dC1jb250YWluZXItYm9keXtcXG4gICAgICBoZWlnaHQ6IGNhbGMoNTB2aCAtIDg3cHgpO1xcbiAgICAgIHBhZGRpbmctdG9wOiAyMHB4O1xcbiAgICAgIHBhZGRpbmctYm90dG9tOiA0MHB4O1xcbiAgIH1cXG5cXG4gICAvKnJvdXRlIEFORC9PUiBpbnRlcmVzdHMgb3BlbiAqL1xcbiAgIC5sYXlvdXQtbGVmdC1zYi12aXNpYmxlICNyb3V0ZS1jb250YWluZXIsXFxuICAgLmxheW91dC1sZWZ0LXNiLXZpc2libGUgI2ludGVyZXN0cy1jb250YWluZXJ7XFxuICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcXG4gICAgICBvcGFjaXR5OiAxO1xcbiAgIH1cXG4gICAubGF5b3V0LWxlZnQtc2ItdmlzaWJsZSAjcm91dGUtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBhLFxcbiAgIC5sYXlvdXQtbGVmdC1zYi12aXNpYmxlICNpbnRlcmVzdHMtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBhe1xcbiAgICAgIGRpc3BsYXk6IGlubGluZTtcXG4gICB9XFxuICAgLmxheW91dC1sZWZ0LXNiLW9wZW4gI3JvdXRlLWNvbnRhaW5lcixcXG4gICAubGF5b3V0LWxlZnQtc2Itb3BlbiAjaW50ZXJlc3RzLWNvbnRhaW5lcntcXG4gICAgICB0cmFuc2Zvcm06IG5vbmU7XFxuICAgfVxcbiAgIC5sYXlvdXQtbGVmdC1oZWlnaHQtc2hvdWxkLWFuaW1hdGUgI3JvdXRlLWNvbnRhaW5lciAubGF5b3V0LWNvbnRhaW5lci1ib2R5LFxcbiAgIC5sYXlvdXQtbGVmdC1oZWlnaHQtc2hvdWxkLWFuaW1hdGUgI2ludGVyZXN0cy1jb250YWluZXIgLmxheW91dC1jb250YWluZXItYm9keXtcXG4gICAgICB0cmFuc2l0aW9uOiBoZWlnaHQgMC41cyBlYXNlLCBwYWRkaW5nIDAuNXMgZWFzZTtcXG4gICB9XFxuXFxuICAgLypzdWdnZXN0aW9ucyBvcGVuKi9cXG4gICAubGF5b3V0LXJpZ2h0LXNiLXZpc2libGUgI3N1Z2dlc3Rpb25zLWNvbnRhaW5lcntcXG4gICAgICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xcbiAgICAgIG9wYWNpdHk6IDE7XFxuICAgfVxcbiAgIC5sYXlvdXQtcmlnaHQtc2ItdmlzaWJsZSAjc3VnZ2VzdGlvbnMtY29udGFpbmVyIC5sYXlvdXQtY29udGFpbmVyLWhlYWRlciBhe1xcbiAgICAgIGRpc3BsYXk6IGlubGluZTtcXG4gICB9XFxuICAgLmxheW91dC1zaG93LXN1Z2dlc3Rpb25zICNzdWdnZXN0aW9ucy1jb250YWluZXJ7XFxuICAgICAgdHJhbnNmb3JtOiBub25lO1xcbiAgIH1cXG59XFxuXFxuXFxuLypNT0RBTFMqL1xcbi5sYXlvdXQtbW9kYWwtY2xvc2V7XFxuICAgYm9yZGVyOiBub25lO1xcbiAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xcbiAgIGRpc3BsYXk6IGlubGluZTtcXG4gICBwYWRkaW5nOiAwO1xcbiAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICB0b3A6MDtcXG4gICByaWdodDogMDtcXG4gICBtYXJnaW46IDFyZW07XFxuICAgei1pbmRleDogMTtcXG59XFxuLmxheW91dC1tb2RhbC1jbG9zZTpmb2N1c3tcXG4gICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcXG4gICBvdXRsaW5lOiAgIzAzOWJlNSBhdXRvO1xcbn1cXG4ubGF5b3V0LW1vZGFsLWNsb3NlOmZvY3VzOmFjdGl2ZXtcXG4gICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcXG4gICBvdXRsaW5lOiAgbm9uZTtcXG59XFxuLmxheW91dC1tb2RhbC1uby1mb290ZXIubW9kYWwtZml4ZWQtZm9vdGVyIC5tb2RhbC1jb250ZW50e1xcbiAgIGhlaWdodDogYXV0bztcXG59XFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNjAwcHgpe1xcbiAgICNzdG9yYWdlLW1vZGFsIC5idG4tZmxhdCwgI21vZGFsMSAuYnRuLWZsYXR7XFxuICAgICAgd2lkdGg6IDUwJTtcXG4gICAgICBwYWRkaW5nLWxlZnQ6IDAuNXJlbTtcXG4gICAgICBwYWRkaW5nLXJpZ2h0OiAwLjVyZW07XFxuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgIH1cXG4gICAubW9kYWx7XFxuICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgbWF4LWhlaWdodDogODAlO1xcbiAgIH1cXG4gICAubW9kYWwubW9kYWwtZml4ZWQtZm9vdGVye1xcbiAgICAgIGhlaWdodDogODAlO1xcbiAgIH1cXG59XFxuXFxuQG1lZGlhIHByaW50e1xcbiAgIGJvZHl7XFxuICAgICAgaGVpZ2h0OiBhdXRvO1xcbiAgIH1cXG4gICAjZGlyZWN0aW9ucy1tb2RhbHsgXFxuICAgICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDtcXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGUgIWltcG9ydGFudDtcXG4gICAgICB0b3A6IDAgIWltcG9ydGFudDtcXG4gICAgICB3aWR0aDogMTAwJSAhaW1wb3J0YW50O1xcbiAgICAgIG1pbi1oZWlnaHQ6IDEwMHZoICFpbXBvcnRhbnQ7XFxuICAgICAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7XFxuICAgICAgbWF4LWhlaWdodDogbm9uZSAhaW1wb3J0YW50O1xcbiAgICAgIG9wYWNpdHk6IDEgIWltcG9ydGFudDtcXG4gICAgICB0cmFuc2Zvcm06IG5vbmUgIWltcG9ydGFudDtcXG4gICB9XFxuICAgI2RpcmVjdGlvbnMtbW9kYWwgLm1vZGFsLWNvbnRlbnR7XFxuICAgICAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7XFxuICAgICAgbWF4LWhlaWdodDogbm9uZSAhaW1wb3J0YW50O1xcbiAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50O1xcbiAgIH1cXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlciEuL3NyYy9jb21wb25lbnRzL2xheW91dC9sYXlvdXQuY3NzXG4vLyBtb2R1bGUgaWQgPSAxOVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgJy4vbWFwLmNzcyc7XG5pbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuaW1wb3J0IG1hcCBmcm9tICcuL21hcGNvbnN0YW50JztcblxuY29uc3QgZGlyZWN0aW9uc1NlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuRGlyZWN0aW9uc1NlcnZpY2UoKTtcbmNvbnN0IGRpcmVjdGlvbnNEaXNwbGF5ID0gbmV3IGdvb2dsZS5tYXBzLkRpcmVjdGlvbnNSZW5kZXJlcigpO1xuXG5cbmRpcmVjdGlvbnNEaXNwbGF5LnNldE1hcChtYXApO1xuZGlyZWN0aW9uc0Rpc3BsYXkuc2V0UGFuZWwoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpcmVjdGlvbnMtY29udGFpbmVyJykpO1xuXG5sZXQgcm91dGVNYXJrZXJzID0gW107XG5cbnN0YXRlLnJvdXRlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgIC8vcmVtb3ZlIGFsbCBtYXJrZXJzXG4gICByb3V0ZU1hcmtlcnMuZm9yRWFjaCgobSkgPT4ge1xuICAgICAgbS5zZXRNYXAobnVsbCk7XG4gICB9KTtcbiAgIHJvdXRlTWFya2VycyA9IFtdO1xuXG4gICAvLyAvL2FkZCBuZXcgbWFya2Vyc1xuICAgaWYoc3RhdGUucm91dGUubG9jYXRpb25Db3VudCA9PT0gMSl7XG4gICAgICBkaXJlY3Rpb25zRGlzcGxheS5zZXQoJ2RpcmVjdGlvbnMnLCBudWxsKTtcbiAgICAgIGlmKHN0YXRlLnJvdXRlLnBhdGhbMF0uZGF0YS5nZW9tZXRyeSl7XG4gICAgICAgICBpZihzdGF0ZS5yb3V0ZS5zaG91bGRab29tTWFwKXtcbiAgICAgICAgICAgIG1hcC5maXRCb3VuZHMoZS52YWxbMF0uZGF0YS5nZW9tZXRyeS52aWV3cG9ydCk7XG4gICAgICAgICB9XG4gICAgICAgICBhZGRNYXJrZXIoZS52YWxbMF0uZGF0YS5nZW9tZXRyeS5sb2NhdGlvbiwgJ3JvdXRlJyk7XG4gICAgICAgICAvL3VwZGF0ZSByb3V0ZSB3aXRoIG9uZSBsb2NhdGlvblxuICAgICAgICAgc3RhdGUubWFwLmRpcmVjdGlvbnMudXBkYXRlKGUudmFsWzBdLmRhdGEuZ2VvbWV0cnkubG9jYXRpb24pO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihzdGF0ZS5yb3V0ZS5wYXRoWzBdLmRhdGEuUmVjQXJlYU5hbWUpe1xuICAgICAgICAgbGV0IGNvb3JkcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoe1xuICAgICAgICAgICAgbGF0OiBlLnZhbFswXS5kYXRhLlJlY0FyZWFMYXRpdHVkZSxcbiAgICAgICAgICAgIGxuZzogZS52YWxbMF0uZGF0YS5SZWNBcmVhTG9uZ2l0dWRlXG4gICAgICAgICB9KTtcbiAgICAgICAgIHN0YXRlLm1hcC5kaXJlY3Rpb25zLnVwZGF0ZShjb29yZHMpO1xuICAgICAgICAgbWFwLnNldENlbnRlcihjb29yZHMpO1xuICAgICAgICAgaWYoc3RhdGUucm91dGUuc2hvdWxkWm9vbU1hcCl7XG4gICAgICAgICAgICBtYXAuc2V0Wm9vbSg4KTtcbiAgICAgICAgIH1cbiAgICAgICAgIGFkZE1hcmtlcihjb29yZHMsICdyb3V0ZScpO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIGxldCBjb29yZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHtcbiAgICAgICAgICAgIGxhdDogZS52YWxbMF0uZGF0YS5sYXQsXG4gICAgICAgICAgICBsbmc6IGUudmFsWzBdLmRhdGEubG5nXG4gICAgICAgICB9KTtcbiAgICAgICAgIHN0YXRlLm1hcC5kaXJlY3Rpb25zLnVwZGF0ZShjb29yZHMpO1xuICAgICAgICAgbWFwLnNldENlbnRlcihjb29yZHMpO1xuICAgICAgICAgaWYoc3RhdGUucm91dGUuc2hvdWxkWm9vbU1hcCl7XG4gICAgICAgICAgICBtYXAuc2V0Wm9vbSg4KTtcbiAgICAgICAgIH1cbiAgICAgICAgIGFkZE1hcmtlcihjb29yZHMsICdyb3V0ZScpO1xuICAgICAgfVxuICAgfVxuICAgZWxzZSBpZihzdGF0ZS5yb3V0ZS5sb2NhdGlvbkNvdW50KXtcbiAgICAgIGlmKHN0YXRlLnJvdXRlLnNob3VsZFpvb21NYXApe1xuICAgICAgICAgZGlyZWN0aW9uc0Rpc3BsYXkuc2V0KCdwcmVzZXJ2ZVZpZXdwb3J0JywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgIGRpcmVjdGlvbnNEaXNwbGF5LnNldCgncHJlc2VydmVWaWV3cG9ydCcsIHRydWUpO1xuICAgICAgfVxuICAgICAgLy9nZXQgZGlyZWN0aW9uc1xuICAgICAgbGV0IHJlcXVlc3QgPSB7XG4gICAgICAgICBvcmlnaW46IHN0YXRlLnJvdXRlLm9yaWdpbixcbiAgICAgICAgIGRlc3RpbmF0aW9uOiBzdGF0ZS5yb3V0ZS5kZXN0aW5hdGlvbixcbiAgICAgICAgIHRyYXZlbE1vZGU6ICdEUklWSU5HJ1xuICAgICAgfVxuICAgICAgaWYoc3RhdGUucm91dGUud2F5cG9pbnRzKVxuICAgICAgICAgcmVxdWVzdC53YXlwb2ludHMgPSBzdGF0ZS5yb3V0ZS53YXlwb2ludHM7XG4gICAgICBkaXJlY3Rpb25zU2VydmljZS5yb3V0ZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQsIHN0YXR1cykge1xuICAgICAgICAgaWYgKHN0YXR1cyA9PSAnT0snKSB7XG4gICAgICAgICAgICBzdGF0ZS5tYXAuZGlyZWN0aW9ucy51cGRhdGUocmVzdWx0LnJvdXRlc1swXSk7XG4gICAgICAgICAgICBkaXJlY3Rpb25zRGlzcGxheS5zZXREaXJlY3Rpb25zKHJlc3VsdCk7XG4gICAgICAgICB9XG4gICAgICAgICAvL2Vsc2Ugc2hvdyBzb21lIGVycm9yIHRvYXN0P1xuICAgICAgfSk7XG4gICB9XG4gICBlbHNle1xuICAgICAgc3RhdGUubWFwLmRpcmVjdGlvbnMudXBkYXRlKG51bGwpO1xuICAgfVxuICAgc3RhdGUucm91dGUuc2hvdWxkWm9vbU1hcCA9IHRydWU7XG59KVxuXG5sZXQgcmVjQXJlYU1hcmtlcnMgPSBbXTtcblxuc3RhdGUucmVjcmVhdGlvbi5maWx0ZXJlZC5vbignY2hhbmdlJywgZnVuY3Rpb24oZSl7XG4gICBsZXQgbWFya2VyTWFwID0ge307XG4gICBsZXQgbmV3TWFya2VycyA9IFtdO1xuICAgZS52YWwuZm9yRWFjaCgocikgPT4ge1xuICAgICAgaWYoIXIubWFya2VyKXtcbiAgICAgICAgIHIuYWRkTWFya2VyKCk7XG4gICAgICAgICByLm1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoIXIubWFya2VyRGlzcGxheWVkKXtcbiAgICAgICAgIHIubWFya2VyLnNldE1hcChtYXApO1xuICAgICAgfVxuICAgICAgci5tYXJrZXJEaXNwbGF5ZWQgPSB0cnVlO1xuICAgICAgbWFya2VyTWFwW3IuaWRdID0gdHJ1ZTtcbiAgICAgIG5ld01hcmtlcnMucHVzaChyKTtcbiAgIH0pO1xuXG4gICAvL3JlbW92ZSBmaWx0ZXJlZCBvdXQgbWFya2Vyc1xuICAgcmVjQXJlYU1hcmtlcnMuZm9yRWFjaCgocikgPT4ge1xuICAgICAgaWYoIW1hcmtlck1hcFtyLmlkXSl7XG4gICAgICAgICByLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICByLm1hcmtlckRpc3BsYXllZCA9IGZhbHNlO1xuICAgICAgfVxuICAgfSk7XG4gICByZWNBcmVhTWFya2VycyA9IG5ld01hcmtlcnM7XG59KTtcblxuXG5cbmZ1bmN0aW9uIGFkZE1hcmtlcihsb2NhdGlvbiwgdHlwZSwgYXJlYSkge1xuICAgbGV0IGt3YXJncyA9IHtcbiAgICAgIHBvc2l0aW9uOiBsb2NhdGlvbixcbiAgICAgIG1hcDogbWFwXG4gICB9XG4gICBpZih0eXBlID09PSAncm91dGUnKXtcbiAgICAgIGt3YXJncy5sYWJlbCA9ICdBJztcbiAgIH1cbiAgIGxldCBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKGt3YXJncyk7XG4gICBpZihhcmVhKXtcbiAgICAgIGxldCBpbmZvID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe2NvbnRlbnQ6IG1ha2VQcmV2aWV3KGFyZWEpfSk7XG4gICAgICBtYXJrZXIuYWRkTGlzdGVuZXIoJ21vdXNlb3ZlcicsIChlKSA9PiB7XG4gICAgICAgICBpbmZvLm9wZW4obWFwLCBtYXJrZXIpO1xuICAgICAgfSk7XG4gICAgICBtYXJrZXIuYWRkTGlzdGVuZXIoJ21vdXNlb3V0JywgKGUpID0+IHtcbiAgICAgICAgIGluZm8uY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgICAgbWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGFyZWEuc2hvd0RldGFpbHMpO1xuICAgfVxuICAgaWYoIHR5cGUgPT09ICdyZWMnKXtcbiAgICAgIHJlY0FyZWFNYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgIH1cbiAgIGVsc2UgaWYodHlwZSA9PT0gJ3JvdXRlJyl7XG4gICAgICByb3V0ZU1hcmtlcnMucHVzaChtYXJrZXIpO1xuICAgfVxuICAgZWxzZXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFya2VyIHR5cGUgbXVzdCBiZSBlaXRoZXIgXCJyZWNcIiBvciBcInJvdXRlXCInKTtcbiAgIH1cbn1cblxubWFwLmFkZExpc3RlbmVyKCdpZGxlJywgZnVuY3Rpb24oKXtcbiAgIHN0YXRlLnJlY3JlYXRpb24uZmlsdGVyQWxsKCk7XG59KVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xuICAgJCgnI2RpcmVjdGlvbnMtbW9kYWwnKS5tb2RhbCgpO1xuICAgLy8gdmFyIGRpcmVjdGlvbnNCdG4gPSAkKCc8YSBocmVmPVwiI1wiPicpXG4gICAvLyAuYXBwZW5kKCQoJzxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj4nKS50ZXh0KCdkaXJlY3Rpb25zJykpXG4gICAvLyAuY3NzKHtcbiAgIC8vICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJyNmZmYnLFxuICAgLy8gICAgY29sb3I6ICcjNzQ3NDc0JyxcbiAgIC8vICAgICdib3JkZXItcmFkaXVzJzogJzJweCcsXG4gICAvLyAgICBtYXJnaW46ICcxMHB4JyxcbiAgIC8vICAgIHBhZGRpbmc6ICcwIDNweCcsXG4gICAvLyAgICBoZWlnaHQ6ICcyNXB4JyxcbiAgIC8vICAgICdsaW5lLWhlaWdodCc6ICcyNXB4JyxcbiAgIC8vICAgICdib3gtc2hhZG93JzogJ3JnYmEoMCwgMCwgMCwgMC4zKSAwcHggMXB4IDRweCAtMXB4J1xuICAgLy8gfSlcbiAgIC8vIC5jbGljayhmdW5jdGlvbigpe1xuICAgLy8gICAgJCgnI2RpcmVjdGlvbnMtbW9kYWwnKS5tb2RhbCgnb3BlbicpO1xuICAgLy8gfSk7XG4gICAvLyBtYXAuY29udHJvbHNbZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLlRPUF9DRU5URVJdLnB1c2goZGlyZWN0aW9uc0J0blswXSk7XG5cbiAgIHZhciBzbGlkZXIgPSAkKCcjcmFkaXVzLXNsaWRlcicpO1xuICAgdmFyIGNpcmNsZXMgPSBbXTtcbiAgIHNsaWRlci5vbignbW91c2Vkb3duIGZvY3VzJywgZnVuY3Rpb24oKXtcbiAgICAgIC8vc2V0IHJhZGl1cyBmcm9tIHNsaWRlciB2YWxcbiAgICAgIHN0YXRlLnJlY3JlYXRpb24uc2VhcmNoUmFkaXVzID0gc2xpZGVyLnZhbCgpICogMTYwOS4zNDtcbiAgICAgIGxldCByYWQgPSBzdGF0ZS5yZWNyZWF0aW9uLnNlYXJjaFJhZGl1cztcbiAgICAgIHZhciBjb29yZHMgPSBzdGF0ZS5tYXAuZGlyZWN0aW9ucy5nZXRDb29yZHNCeVJhZGl1cyhyYWQpO1xuICAgICAgaWYoY29vcmRzKXtcbiAgICAgICAgIGNvb3Jkcy5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgICAgICBsZXQgY2lyY2xlID0gbmV3IGdvb2dsZS5tYXBzLkNpcmNsZSh7XG4gICAgICAgICAgICAgICBjZW50ZXI6IGMsXG4gICAgICAgICAgICAgICByYWRpdXM6IHJhZCxcbiAgICAgICAgICAgICAgIGZpbGxDb2xvcjogJ2JsdWUnLFxuICAgICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuMzMsXG4gICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgbWFwOiBtYXBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2lyY2xlcy5wdXNoKGNpcmNsZSk7XG4gICAgICAgICB9KTtcbiAgICAgIH1cbiAgIH0pO1xuICAgc2xpZGVyLm9uKCdtb3VzZXVwIGZvY3Vzb3V0JywgZnVuY3Rpb24oKXtcbiAgICAgIGNpcmNsZXMuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgYy5zZXRNYXAobnVsbCk7XG4gICAgICB9KVxuICAgICAgY2lyY2xlcyA9IFtdO1xuICAgICAgc3RhdGUucmVjcmVhdGlvbi5maWx0ZXJBbGwoKTtcbiAgIH0pO1xuICAgc2xpZGVyLm9uKCd0b3VjaGVuZCcsIGZ1bmN0aW9uKCl7XG4gICAgICBzbGlkZXIuYmx1cigpO1xuICAgfSlcbiAgIHNsaWRlci5vbignaW5wdXQnLCBmdW5jdGlvbigpe1xuICAgICAgY2lyY2xlcy5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgICBjLnNldE1hcChudWxsKTtcbiAgICAgIH0pXG4gICAgICBjaXJjbGVzID0gW107XG4gICAgICBzdGF0ZS5yZWNyZWF0aW9uLnNlYXJjaFJhZGl1cyA9IHNsaWRlci52YWwoKSAqIDE2MDkuMzQ7XG4gICAgICBsZXQgcmFkID0gc3RhdGUucmVjcmVhdGlvbi5zZWFyY2hSYWRpdXM7XG4gICAgICB2YXIgY29vcmRzID0gc3RhdGUubWFwLmRpcmVjdGlvbnMuZ2V0Q29vcmRzQnlSYWRpdXMocmFkKTtcbiAgICAgIGlmKGNvb3Jkcyl7XG4gICAgICAgICBjb29yZHMuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgICAgICAgbGV0IGNpcmNsZSA9IG5ldyBnb29nbGUubWFwcy5DaXJjbGUoe1xuICAgICAgICAgICAgICAgY2VudGVyOiBjLFxuICAgICAgICAgICAgICAgcmFkaXVzOiByYWQsXG4gICAgICAgICAgICAgICBmaWxsQ29sb3I6ICdibHVlJyxcbiAgICAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjMzLFxuICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZWQnLFxuICAgICAgICAgICAgICAgc3Ryb2tlT3BhY2l0eTogMCxcbiAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNpcmNsZXMucHVzaChjaXJjbGUpO1xuICAgICAgICAgfSk7XG4gICAgICB9XG4gICB9KTtcbn0pXG5cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvbWFwL21hcC5qc1xuLy8gbW9kdWxlIGlkID0gMjBcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbWFwLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gUHJlcGFyZSBjc3NUcmFuc2Zvcm1hdGlvblxudmFyIHRyYW5zZm9ybTtcblxudmFyIG9wdGlvbnMgPSB7fVxub3B0aW9ucy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm1cbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCBvcHRpb25zKTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9tYXAuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL21hcC5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvbWFwL21hcC5jc3Ncbi8vIG1vZHVsZSBpZCA9IDIxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodW5kZWZpbmVkKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIhLi9zcmMvY29tcG9uZW50cy9tYXAvbWFwLmNzc1xuLy8gbW9kdWxlIGlkID0gMjJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0ICcuL3JvdXRlLmNzcyc7XG5pbXBvcnQgc3RhdGUgZnJvbSAnLi4vc3RhdGUvc3RhdGUnO1xuXG52YXIgdG9vbHRpcCA9ICQoXG5cdCc8c3BhbiBjbGFzcz0gXCJyb3V0ZS10b29sdGlwXCIgZGF0YS10b29sdGlwPVwiU2VsZWN0IGZyb20gdGhlIGRyb3AtZG93biBtZW51LlwiIGRhdGEtcG9zaXRpb249XCJyaWdodFwiPidcbik7XG50b29sdGlwLnRvb2x0aXAoe2RlbGF5OiA1MH0pO1xuXG4vLyBGdW5jdGlvbiB0byBtYW5hZ2UgdGhlIHNvcnRpbmcgb2YgR29vZ2xlIFBsYWNlcyBsb2NhdGlvbnMuXG4vLyBVc2luZyBqcXVlcnkudWkgZm9yIHNvcnRpbmcgZnVuY3Rpb24uXG4kKGZ1bmN0aW9uKCkge1xuICAkKCBcIi5zb3J0YWJsZVwiICkuc29ydGFibGUoe1xuICAgIHJldmVydDogdHJ1ZSwgXG4gICAgaGFuZGxlOiAnLnJvdXRlLW1vdmUtaWNvbicsXG4gICAgY29udGFpbm1lbnQ6ICcjcm91dGUtY29udGFpbmVyJyxcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IGlucHV0U2VjdGlvbi5jaGlsZHJlbigpO1xuICAgICAgdmFyIGNoZWNrZXIgPSAwO1xuICAgICAgdmFyIHN0YXRlTG9jYXRpb247XG4gICAgICB2YXIgbGlzdExvY2F0aW9uO1xuICAgICAgLy8gTG9naWMgY3JlYXRlZCB0byBkZXRlcm1pbmUgd2hlcmUgdGhlIG9yaWdpbmFsIGRlc3RpbmF0aW9uIHdhcyBsb2NhdGVkLCB3aGVyZSBpdCB3YXMgbW92ZWQsIGFuZCB0byB1cGRhdGUgdGhlIGxvY2F0aW9uIGluIFN0YXRlLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgXHRsaXN0TG9jYXRpb24gPSBjaGlsZHJlbltpXS5kYXRhc2V0Lm51bWJlcjtcbiAgICAgIFx0aWYgKGxpc3RMb2NhdGlvbiAhPSBjaGVja2VyKXtcblx0ICAgICAgXHRpZiAobGlzdExvY2F0aW9uID4gY2hlY2tlcisxKXtcblx0XHRcdFx0XHRcdHRvb2x0aXAubW91c2VsZWF2ZSgpO1xuXHRcdFx0XHRcdFx0dG9vbHRpcC5kZXRhY2goKTtcblx0XHRcdFx0XHRcdHN0YXRlTG9jYXRpb24gPSBzdGF0ZS5yb3V0ZS5wYXRoW2xpc3RMb2NhdGlvbl0uZGF0YTtcblx0XHRcdFx0XHRcdHN0YXRlLnJvdXRlLnJlbW92ZShsaXN0TG9jYXRpb24sIHRydWUpO1xuXHRcdFx0XHRcdFx0c3RhdGUucm91dGUuaW5zZXJ0KHN0YXRlTG9jYXRpb24sIGkpO1xuXHQgICAgICBcdH0gZWxzZSBpZiAobGlzdExvY2F0aW9uID09IGNoZWNrZXIrMSl7XG5cdCAgICAgIFx0XHRjaGVja2VyKys7XG5cdCAgICAgIFx0fSBlbHNlIGlmIChsaXN0TG9jYXRpb24gPCBjaGVja2VyLTEpe1xuXHRcdFx0XHRcdHRvb2x0aXAubW91c2VsZWF2ZSgpO1xuXHRcdFx0XHRcdHRvb2x0aXAuZGV0YWNoKCk7XG5cdCAgICBcdFx0XHRzdGF0ZUxvY2F0aW9uID0gc3RhdGUucm91dGUucGF0aFtsaXN0TG9jYXRpb25dLmRhdGE7XG5cdCAgICBcdFx0XHRzdGF0ZS5yb3V0ZS5yZW1vdmUobGlzdExvY2F0aW9uLCB0cnVlKTtcblx0XHRcdFx0XHRzdGF0ZS5yb3V0ZS5pbnNlcnQoc3RhdGVMb2NhdGlvbiwgaSk7XG5cdCAgICAgIFx0fVxuXHQgICAgICB9XG4gICAgICBcdGNoZWNrZXIrKztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIE9wdGlvbnMgb2JqZWN0IHRoYXQgd2lsbCBiZSBmZWQgaW50byB0aGUgR29vZ2xlIFBsYWNlcyBBUEkgY2FsbC5cbnZhciBvcHRpb25zID0ge1xuICBjb21wb25lbnRSZXN0cmljdGlvbnM6IHtjb3VudHJ5OiAndXMnfVxufTtcblxuLy8gVmFyaWFibGVzIGZvciB0aGUgbmV3IHNlY3Rpb25zIHdpdGhpbiB0aGUgI2Rlc3RpbmF0aW9ucyBjb250YWluZXIgZm9yIHRoZSBzb3J0aW5nIGFuZCBmb3IgdGhlIGJ1dHRvbi9uZXcgaW5wdXRzLlxudmFyIGlucHV0U2VjdGlvbiA9ICQoXCI8ZGl2PlwiKTtcbnZhciBidXR0b25TZWN0aW9uID0gJCgnPGRpdiBjbGFzcz1cInJvdXRlLWJ0bi1jb250YWluZXJcIj4nKTtcblxuLy8gQXBwbGllcyB0aGUgXCJzb3J0YWJsZVwiIGNsYXNzIHRvIHRoZSBpbnB1dFNlY3Rpb24gYXJlYSBzbyBvbmx5IHRoYXQgc2VjdGlvbiBjYW4gYmUgc29ydGVkLlxuaW5wdXRTZWN0aW9uLmF0dHIoXCJjbGFzc1wiLCBcInNvcnRhYmxlXCIpO1xuXG4vLyBBcHBlbmRpbmcgdGhlIG5ldyBkaXZzIHRvIHRoZSAjZGVzdGluYXRpb24gc2VjdGlvbi5cbiQoXCIjZGVzdGluYXRpb25zXCIpLmFwcGVuZChpbnB1dFNlY3Rpb24pO1xuJChcIiNkZXN0aW5hdGlvbnNcIikuYXBwZW5kKGJ1dHRvblNlY3Rpb24pO1xuXG4vLyBPbiBwYWdlIGxvYWQsIGNhbGxzIHRoZSBuZXdJbnB1dEZpZWxkIGZ1bmN0aW9uIHRvIGxvYWQgYSBcIlN0YXJ0aW5nIExvY2F0aW9uXCIgaW5wdXQgZmllbGQuXG5uZXdJbnB1dEZpZWxkKCk7XG5cbi8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSB0aGUgc3RhdGUgb2JqZWN0IHdoZW4gc29tZXRoaW5nIHdpdGhpbiB0aGUgb2JqZWN0IGlzIGNoYW5nZWQuXG5zdGF0ZS5yb3V0ZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSl7XG5cdHZhciBwYXRoID0gZS52YWw7XG5cdC8vIFJlc2V0cyB0aGUgaW5wdXQgYW5kIGJ1dHRvbiBTZWN0aW9uIGRpdnMgdG8gYXZvaWQgZHVwbGljYXRpb25zLlxuXHRpbnB1dFNlY3Rpb24uZW1wdHkoKTtcblx0YnV0dG9uU2VjdGlvbi5lbXB0eSgpO1xuXHQvLyBJZiBhbGwgZGVzdGluYXRpb25zIGhhdmUgYmVlbiByZW1vdmVkLCBjYWxscyB0aGUgbmV3SW5wdXRGaWVsZCBmdW5jdGlvbiB0byByZS1hZGQgXCJTdGFydGluZyBMb2NhdGlvblwiIGlucHV0IGZpZWxkLlxuXHRpZiAocGF0aC5sZW5ndGggPT0gMCkge1xuXHRcdG5ld0lucHV0RmllbGQoKTtcblx0fSBlbHNlIHtcblx0XHQvLyBQb3B1bGF0ZXMgdGhlIGRlc3RpbmF0aW9ucyBzZWN0aW9uIHdpdGggdGhlIGxvY2F0aW9ucyBzdG9yZWQgaW4gdGhlIHN0YXRlIG9iamVjdC5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGUudmFsLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgbG9jYXRpb24gPSBlLnZhbFtpXTtcblx0XHRcdGxldCBuZXdJbnB1dDtcblx0XHRcdHZhciBpbnB1dENvbnRhaW5lciA9ICQoXCI8ZGl2PlwiKTtcblx0XHRcdC8vIEFkZHMgdWktc3RhdGUtZGVmYXVsdCBjbGFzcyB0byBhbGxvdyBpbnB1dCBib3hlcyB0byBiZSBzb3J0YWJsZSB2aWEganF1ZXJ5LnVpLlxuXHRcdFx0aW5wdXRDb250YWluZXIuYXR0cihcImNsYXNzXCIsIFwicm91dGUtaW5wdXQtY29udGFpbmVyIHVpLXN0YXRlLWRlZmF1bHRcIik7XG5cdFx0XHQvLyBTdG9yZXMgZGF0YSBudW1iZXIgaW4gdGhlIGlucHV0Q29udGFpbmVyIGZvciBtYW5pcHVsYXRpb24gaW4gdGhlIHNvcnRhYmxlIGZ1bmN0aW9uLlxuXHRcdFx0aW5wdXRDb250YWluZXIuYXR0cihcImRhdGEtbnVtYmVyXCIsIGkpO1xuXHRcdFx0Ly8gQ3JlYXRlcyBhIGNsZWFuIHZpZXcgb2YgR29vZ2xlIEFkZHJlc3MgZnJvbSB0aGUgUGxhY2VzIG5hbWUgYW5kIGFkZHJlc3Mgc3RvcmVkIGluIHRoZSBzdGF0ZSBvYmplY3QuXG5cdFx0XHRpZiAobG9jYXRpb24udHlwZSA9PSBcInBsYWNlXCIpIHtcblx0XHRcdFx0bmV3SW5wdXQgPSAkKFwiPGlucHV0PlwiKS52YWwobG9jYXRpb24uZGF0YS5uYW1lICsgJyAoJyArIGxvY2F0aW9uLmRhdGEuZm9ybWF0dGVkX2FkZHJlc3MgKyAnKScpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gQ3JlYXRlcyBhIGNsZWFuIHZpZXcgb2YgdGhlIEdvb2dsZSBBZGRyZXNzIGZyb20gdGhlIHJlY3JlYXRpb24gbGlzdCBpbiBjYXNlIHRoYXQgaXMgdGhlIGZpZWxkIHR5cGUgc3RvcmVkIGluIHRoZSBzdGF0ZSBvYmplY3QuXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bmV3SW5wdXQgPSAkKFwiPGlucHV0PlwiKS52YWwobG9jYXRpb24uZGF0YS5SZWNBcmVhTmFtZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBBZGRzIGFuZCBhcHBlbmRzIGFsbCBjbGFzc2VzLCBidXR0b25zLCBhbmQgZnVuY3Rpb25zIGluc2lkZSB0aGUgaW5wdXRDb250YWluZXIuXG5cdFx0XHRuZXdJbnB1dC5hdHRyKFwiY2xhc3NcIiwgXCJyb3V0ZS1jaG9pY2VcIik7XG5cdFx0XHRsZXQgY2xvc2VJbnB1dCA9ICQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJncmV5LXRleHRcIj4nKS5hcHBlbmQoJChcIjxpIGNsYXNzPSdtYXRlcmlhbC1pY29ucyByb3V0ZS1jbG9zZS1pY29uJz5cIikudGV4dCgnY2xvc2UnKSk7XG5cdFx0XHRsZXQgbW92ZUlucHV0ID0gJCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImdyZXktdGV4dFwiPicpLmFwcGVuZCgkKFwiPGkgY2xhc3M9J21hdGVyaWFsLWljb25zIHJvdXRlLW1vdmUtaWNvbic+XCIpLnRleHQoJ2RyYWdfaGFuZGxlJykpO1xuXHRcdFx0aW5wdXRDb250YWluZXIuYXBwZW5kKG1vdmVJbnB1dCwgbmV3SW5wdXQsIGNsb3NlSW5wdXQpO1x0XHRcdFxuXHRcdFx0bW92ZUlucHV0LmNsaWNrKGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9KTtcblx0XHRcdC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgaW5wdXRDb250YWluZXIgaWYgdGhlIGNsb3NlIChYKSBidXR0b24gaXMgcHJlc3NlZC5cdFx0XHRcblx0XHRcdGNsb3NlSW5wdXQuY2xpY2soZnVuY3Rpb24oZSl7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0aWYgKGxvY2F0aW9uLnR5cGUgPT09IFwicmVjYXJlYVwiKXtcblx0XHRcdCBcdFx0c3RhdGUucm91dGUucGF0aFtpXS5kYXRhLnNldEluUm91dGUoZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRvb2x0aXAubW91c2VsZWF2ZSgpO1xuXHRcdFx0XHR0b29sdGlwLmRldGFjaCgpO1xuXHRcdFx0IFx0c3RhdGUucm91dGUucmVtb3ZlKGkpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBGdW5jdGlvbiB0byByZW1vdmUgdGhlIGlucHV0Q29udGFpbmVyIGlmIHRoZSB1c2VyIGZvY3VzZXMgb3V0IG9mIHRoZSBpbnB1dCB3aGlsZSBpdCBpcyBibGFuay5cdFx0XHRcblx0XHRcdG5ld0lucHV0LmZvY3Vzb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHQgXHRpZiAobmV3SW5wdXQudmFsKCkgPT0gXCJcIil7XG5cdFx0XHQgXHRcdGlmIChsb2NhdGlvbi50eXBlID09PSBcInJlY2FyZWFcIil7XG5cdFx0XHQgXHRcdFx0c3RhdGUucm91dGUucGF0aFtpXS5kYXRhLnNldEluUm91dGUoZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0b29sdGlwLm1vdXNlbGVhdmUoKTtcblx0XHRcdFx0XHR0b29sdGlwLmRldGFjaCgpO1xuXHRcdFx0IFx0XHRzdGF0ZS5yb3V0ZS5yZW1vdmUoaSk7XG5cdFx0XHQgXHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgaW5wdXRDb250YWluZXIgaWYgZW50ZXIgaXMgcHJlc3NlZCB3aGlsZSB0aGUgaW5wdXQgaXMgYmxhbmsuXG5cdFx0XHRuZXdJbnB1dC5rZXlwcmVzcyhmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRpZiAoZS53aGljaCA9PT0gMTMgJiYgbmV3SW5wdXQudmFsKCkgPT0gXCJcIil7XG5cdFx0XHQgXHRcdGlmIChsb2NhdGlvbi50eXBlID09PSBcInJlY2FyZWFcIil7XG5cdFx0XHQgXHRcdFx0c3RhdGUucm91dGUucGF0aFtpXS5kYXRhLnNldEluUm91dGUoZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0b29sdGlwLm1vdXNlbGVhdmUoKTtcblx0XHRcdFx0XHR0b29sdGlwLmRldGFjaCgpO1xuXHRcdFx0XHRcdHN0YXRlLnJvdXRlLnJlbW92ZShpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBBZGRzIHRoZSBjb21wbGV0ZWQgaW5wdXRDb250YWluZXIgdG8gdGhlIGlucHV0U2VjdGlvbi5cblx0XHRcdGlucHV0U2VjdGlvbi5hcHBlbmQoaW5wdXRDb250YWluZXIpO1xuXHRcdFx0Ly8gU2VuZHMgdGhlIG5ld0lucHV0LCBpbnB1dENvbnRhaW5lciwgYnVsaWFuIHZhbHVlLCBhbmQgc3RhdGUgcG9zaXRpb24gdG8gdGhlIGF1dG9maWxsIGZ1bmN0aW9uLlxuXHRcdFx0YXV0b2ZpbGwobmV3SW5wdXRbMF0sIGlucHV0Q29udGFpbmVyLCBmYWxzZSwgaSk7XG5cdFx0fSBcblx0XHQvLyBDcmVhdGVzIGFuZCBhcHBlbmRzIGJ1dHRvbnMgdG8gdGhlIGJ1dHRvblNlY3Rpb24gd2hlbiBhIGNvbXBsZXRlZCBpbnB1dCBpcyBmaWxsZWQgaW4uXG5cdFx0YnV0dG9uU2VjdGlvbi5hcHBlbmQoXCI8ZGl2IGlkPSduZXdidXR0b25zJz5cIik7XG5cdFx0JChcIiNuZXdidXR0b25zXCIpXG5cdFx0LmFwcGVuZChcblx0XHRcdCQoXCI8YSBjbGFzcz0nYnRuIHdhdmVzLWVmZmVjdCB3YXZlcy1saWdodCcgaWQ9J3JvdXRlLWFkZEJ0bicgaHJlZj0nIyc+XCIpXG5cdFx0XHQudGV4dCgnQWRkIExvY2F0aW9uJylcblx0XHRcdC5wcmVwZW5kKCc8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zIGxlZnRcIj5hZGQ8L2k+Jylcblx0XHQpO1xuXHRcdCQoXCIjcm91dGUtYWRkQnRuXCIpLmNsaWNrKG5ld0lucHV0RmllbGQpO1xuXHR9XG59KTtcblxuLy8gQXBwbGllZCBhdXRvZmlsbCBjb2RlIHRvIHRoZSBuZXcgaW5wdXQgZmllbGRzIGFuZCBzZW5kcyBpbnB1dCB0byBzdGF0ZSBvYmplY3QuXG4vLyBUYWtlcyB0aGUgbmV3SW5wdXQsIGlucHV0Q29udGFpbmVyLCBidWxpYW4gdmFsdWUsIGFuZCBzdGF0ZSBwb3N0aW9uIGFzIHZhcmlhYmxlIGluIHRoZSBhdXRvZmlsbCBmdW5jdGlvbi5cbi8vIFRvb2x0aXBzIGluY2x1ZGVkIGZvciB1c2VyIGVycm9yIGhhbmRsaW5nLlxuZnVuY3Rpb24gYXV0b2ZpbGwoaW5wdXQsIGNvbnRhaW5lciwgYWRkLCBpbmRleCl7XG5cdHZhciBhdXRvY29tcGxldGUgPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLkF1dG9jb21wbGV0ZShpbnB1dCwgb3B0aW9ucyk7XG5cdC8vIEdvb2dsZSBQbGFjZXMgZnVuY3Rpb24gLSB1c2VzIFwiYXV0b2NvbXBsZXRlXCIgcGxhY2Vob2xkZXIgZGVmaW5lZCBpbiBsaW5lIGFib3ZlLlxuXHRhdXRvY29tcGxldGUuYWRkTGlzdGVuZXIoJ3BsYWNlX2NoYW5nZWQnLCBmdW5jdGlvbiAoKXtcblx0XHR2YXIgcGxhY2UgPSBhdXRvY29tcGxldGUuZ2V0UGxhY2UoKTtcblx0XHRpZiAocGxhY2UucGxhY2VfaWQpe1xuXHRcdFx0aWYgKGFkZCl7XG5cdFx0XHRcdHRvb2x0aXAubW91c2VsZWF2ZSgpO1xuXHRcdFx0XHR0b29sdGlwLmRldGFjaCgpO1xuXHRcdFx0XHRzdGF0ZS5yb3V0ZS5hZGQocGxhY2UpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHRvb2x0aXAubW91c2VsZWF2ZSgpO1xuXHRcdFx0XHR0b29sdGlwLmRldGFjaCgpO1xuXHRcdCBcdFx0aWYgKHN0YXRlLnJvdXRlLnBhdGhbaW5kZXhdLnR5cGUgPT09IFwicmVjYXJlYVwiKXtcblx0XHQgXHRcdFx0c3RhdGUucm91dGUucGF0aFtpbmRleF0uZGF0YS5zZXRJblJvdXRlKGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzdGF0ZS5yb3V0ZS5yZW1vdmUoaW5kZXgsIHRydWUpO1xuXHRcdFx0XHRzdGF0ZS5yb3V0ZS5pbnNlcnQocGxhY2UsIGluZGV4KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHBsYWNlLm5hbWUgIT0gXCJcIil7XG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmQodG9vbHRpcCk7XG5cdFx0XHRcdHRvb2x0aXAubW91c2VlbnRlcigpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbi8vIEdldCB0aGUgSFRNTCBpbnB1dCBlbGVtZW50IGZvciB0aGUgYXV0b2NvbXBsZXRlIHNlYXJjaCBib3ggYW5kIGNyZWF0ZSB0aGUgYXV0b2NvbXBsZXRlIG9iamVjdC5cbmZ1bmN0aW9uIG5ld0lucHV0RmllbGQoZSkge1xuXHRpZihlKSBlLnByZXZlbnREZWZhdWx0KCk7XG5cdCQoXCIjbmV3YnV0dG9uc1wiKS5yZW1vdmUoKTtcblx0dmFyIGlucHV0ZmllbGQgPSAkKFwiPGlucHV0PlwiKTtcblx0YnV0dG9uU2VjdGlvbi5hcHBlbmQoaW5wdXRmaWVsZCk7XG5cdGlucHV0ZmllbGQuYWRkQ2xhc3MoXCJkZXN0aW5hdGlvbi1pbnB1dFwiKTtcblx0Ly8gQ2hhbmdlcyB0aGUgcGxhY2Vob2xkZXIgdmFsdWUgd2l0aGluIHRoZSBuZXcgaW5wdXQgZmllbGQgYmFzZWQgb24gdGhlIGxlbmd0aCBvZiB0aGUgc3RhdGUgb2JqZWN0LlxuXHRpZiAoc3RhdGUucm91dGUubG9jYXRpb25Db3VudCA9PSAwKSB7XG5cdFx0aW5wdXRmaWVsZC5hdHRyKFwicGxhY2Vob2xkZXJcIiwgXCJTdGFydGluZyBMb2NhdGlvbjogXCIpO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGlucHV0ZmllbGQuYXR0cihcInBsYWNlaG9sZGVyXCIsIFwiTmV4dCBTdG9wOiBcIik7XG5cdFx0aW5wdXRmaWVsZC5mb2N1cygpO1xuXHR9XG5cdGF1dG9maWxsKGlucHV0ZmllbGRbMF0sIGJ1dHRvblNlY3Rpb24sIHRydWUpO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvcm91dGUvcm91dGUuanNcbi8vIG1vZHVsZSBpZCA9IDIzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3JvdXRlLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gUHJlcGFyZSBjc3NUcmFuc2Zvcm1hdGlvblxudmFyIHRyYW5zZm9ybTtcblxudmFyIG9wdGlvbnMgPSB7fVxub3B0aW9ucy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm1cbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCBvcHRpb25zKTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9yb3V0ZS5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcm91dGUuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9jb21wb25lbnRzL3JvdXRlL3JvdXRlLmNzc1xuLy8gbW9kdWxlIGlkID0gMjRcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh1bmRlZmluZWQpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLnJvdXRlLWlucHV0LWNvbnRhaW5lcntcXG4gICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gICBtYXJnaW4tYm90dG9tOiAyMHB4O1xcbn1cXG5cXG4ucm91dGUtaW5wdXQtY29udGFpbmVyIGl7XFxuICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICB3aWR0aDogM3JlbTtcXG4gICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xcbiAgIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gICBoZWlnaHQ6IDIuOHJlbTtcXG4gICBoZWlnaHQ6IGNhbGMoM3JlbSAtIDFweCk7XFxuICAgbGluZS1oZWlnaHQ6IDNyZW07XFxuICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgIHRvcDogMDtcXG59XFxuLnJvdXRlLW1vdmUtaWNvbntcXG4gICBsZWZ0OiAwO1xcbn1cXG4ucm91dGUtY2xvc2UtaWNvbntcXG4gICByaWdodDogMDtcXG59XFxuLnJvdXRlLWlucHV0LWNvbnRhaW5lciBhOmZvY3VzIGl7XFxuICAgb3V0bGluZTogICMwMzliZTUgYXV0bztcXG59XFxuXFxuLnJvdXRlLWlucHV0LWNvbnRhaW5lciBpbnB1dHtcXG4gICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgIHBhZGRpbmctbGVmdDogM3JlbTtcXG4gICBtYXJnaW4tYm90dG9tOiAwO1xcbn1cXG5cXG4ucm91dGUtYnRuLWNvbnRhaW5lcntcXG4gICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIhLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9yb3V0ZS5jc3Ncbi8vIG1vZHVsZSBpZCA9IDI1XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCBzdGF0ZSBmcm9tICcuLi9zdGF0ZS9zdGF0ZSc7XG5pbXBvcnQge3JlY0FwaUJ5SWR9IGZyb20gJy4uL3JlY3JlYXRpb24vY29uc3RhbnRzJztcblxuLy9pbnRlcmVzdHNcbnN0YXRlLmludGVyZXN0cy5vbignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgdmFyIGludGVyZXN0cyA9IHt9O1xuXG4gICBlLnZhbC5zZWxlY3RlZC5mb3JFYWNoKGZ1bmN0aW9uKGludGVyZXN0KSB7XG4gICAgICBpbnRlcmVzdHNbaW50ZXJlc3QuaWRdID0gdHJ1ZTtcbiAgIH0pO1xuICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2ludGVyZXN0cycsIEpTT04uc3RyaW5naWZ5KGludGVyZXN0cykpO1xuICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hhcy1zdG9yZWQnLCAndHJ1ZScpO1xufSk7XG5cbi8vcm91dGVcbnN0YXRlLnJvdXRlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgIHZhciBsb2NhdGlvbnMgPSBlLnZhbC5tYXAoKGwpID0+IHtcbiAgICAgIGlmKGwudHlwZSA9PT0gJ3BsYWNlJyl7XG4gICAgICAgICByZXR1cm57XG4gICAgICAgICAgICB0eXBlOiAncGxhY2UnLFxuICAgICAgICAgICAgcGxhY2VfaWQ6IGwuZGF0YS5wbGFjZV9pZCxcbiAgICAgICAgICAgIG5hbWU6IGwuZGF0YS5uYW1lLFxuICAgICAgICAgICAgZm9ybWF0dGVkX2FkZHJlc3M6bC5kYXRhLmZvcm1hdHRlZF9hZGRyZXNzLFxuICAgICAgICAgICAgbGF0OiBsLmRhdGEubGF0IHx8IGwuZGF0YS5nZW9tZXRyeS5sb2NhdGlvbi5sYXQoKSxcbiAgICAgICAgICAgIGxuZzogbC5kYXRhLmxuZyB8fCBsLmRhdGEuZ2VvbWV0cnkubG9jYXRpb24ubG5nKClcbiAgICAgICAgIH07XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgdHlwZTogJ3JlY2FyZWEnLFxuICAgICAgICAgICAgaWQ6IGwuZGF0YS5pZCxcbiAgICAgICAgICAgIFJlY0FyZWFOYW1lOiBsLmRhdGEuUmVjQXJlYU5hbWUsXG4gICAgICAgICAgICBSZWNBcmVhTGF0aXR1ZGU6IGwuZGF0YS5SZWNBcmVhTGF0aXR1ZGUsXG4gICAgICAgICAgICBSZWNBcmVhTG9uZ2l0dWRlOiBsLmRhdGEuUmVjQXJlYUxvbmdpdHVkZVxuICAgICAgICAgfTtcbiAgICAgIH1cbiAgIH0pO1xuICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3JvdXRlJywgSlNPTi5zdHJpbmdpZnkobG9jYXRpb25zKSk7XG4gICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGFzLXN0b3JlZCcsICd0cnVlJyk7XG59KVxuXG4vL2Jvb2ttYXJrc1xuc3RhdGUucmVjcmVhdGlvbi5ib29rbWFya2VkLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgIHZhciBib29rbWFya2VkID0gZS52YWwubWFwKChyKSA9PiB7XG4gICAgICAgICByZXR1cm4gci5pZDtcbiAgIH0pO1xuICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jvb2ttYXJrZWQnLCBKU09OLnN0cmluZ2lmeShib29rbWFya2VkKSk7XG4gICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGFzLXN0b3JlZCcsICd0cnVlJyk7XG59KVxuXG5mdW5jdGlvbiByZXNldFN0b3JhZ2UoZSl7XG4gICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICBoYXNMb2FkZWQgPSB0cnVlO1xuICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hhcy1zdG9yZWQnLCBudWxsKTtcbiAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdib29rbWFya2VkJywgbnVsbCk7XG4gICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncm91dGUnLCBudWxsKTtcbiAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdpbnRlcmVzdHMnLCBudWxsKTtcbiAgICQoJyNzdG9yYWdlLW1vZGFsJykubW9kYWwoJ2Nsb3NlJyk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTdG9yYWdlKGUpe1xuICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgaWYoaGFzTG9hZGVkKSByZXR1cm47XG4gICB2YXIgaW50ZXJlc3RzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaW50ZXJlc3RzJykpIHx8IHt9O1xuICAgc3RhdGUuaW50ZXJlc3RzLmFsbC5mb3JFYWNoKChhKSA9PiB7XG4gICAgICBpZihpbnRlcmVzdHNbYS5pZF0pe1xuICAgICAgICAgYS51cGRhdGUodHJ1ZSwgdHJ1ZSk7XG4gICAgICB9XG4gICB9KTtcbiAgIHN0YXRlLmludGVyZXN0cy5lbWl0KCdjaGFuZ2UnKTtcblxuICAgdmFyIHJvdXRlID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncm91dGUnKSkgfHwgW107XG4gICB2YXIgcm91dGVBcnIgPSBbXTtcbiAgIGxldCByZXF1ZXN0Q291bnQgPSAwO1xuICAgdmFyIHJvdXRlQ2FsbGJhY2sgPSBmdW5jdGlvbihpbmRleCwgcmVzcG9uc2Upe1xuICAgICAgcmVxdWVzdENvdW50IC09IDE7XG4gICAgICBpZihyZXNwb25zZS5SZWNBcmVhSUQpe1xuICAgICAgICAgc3RhdGUucmVjcmVhdGlvbi5hbGwuYWRkRGF0YShyZXNwb25zZSk7XG4gICAgICAgICBsZXQgYXJlYSA9IHN0YXRlLnJlY3JlYXRpb24uYWxsLlJFQ0RBVEEuZmluZCgocikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHIuaWQgPT0gcmVzcG9uc2UuUmVjQXJlYUlEO1xuICAgICAgICAgfSk7XG4gICAgICAgICBhcmVhLnNldEluUm91dGUodHJ1ZSk7XG4gICAgICAgICByb3V0ZUFycltpbmRleF0gPSBzdGF0ZS5yb3V0ZS5nZXRMb2NhdGlvbk9iamVjdChhcmVhKTtcbiAgICAgIH1cbiAgICAgIGlmKHJlcXVlc3RDb3VudCA9PT0gMCl7XG4gICAgICAgICBzdGF0ZS5yb3V0ZS5zZXREYXRhKHJvdXRlQXJyKTtcbiAgICAgIH1cbiAgIH1cbiAgIHJvdXRlLmZvckVhY2goKGxvY2F0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgaWYobG9jYXRpb24udHlwZSA9PT0gJ3BsYWNlJyl7XG4gICAgICAgICByb3V0ZUFycltpbmRleF0gPSBzdGF0ZS5yb3V0ZS5nZXRMb2NhdGlvbk9iamVjdChsb2NhdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAgcmVxdWVzdENvdW50ICs9IDE7XG4gICAgICAgICByZWNBcGlCeUlkKGxvY2F0aW9uLmlkLCByb3V0ZUNhbGxiYWNrLmJpbmQobnVsbCwgaW5kZXgpKTtcbiAgICAgIH1cbiAgIH0pO1xuICAgaWYocmVxdWVzdENvdW50ID09PSAwKXtcbiAgICAgICAgIHN0YXRlLnJvdXRlLnNldERhdGEocm91dGVBcnIpO1xuICAgfVxufVxuXG5mdW5jdGlvbiBnZXRCb29rbWFya3MoKXtcbiAgIGlmKGhhc0xvYWRlZCkgcmV0dXJuO1xuICAgaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICQoJyNzdG9yYWdlLW1vZGFsJykubW9kYWwoJ2Nsb3NlJyk7XG4gICBsZXQgcmVxdWVzdENvdW50ID0gMDtcbiAgIHZhciBib29rbWFya2VkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYm9va21hcmtlZCcpKSB8fCBbXTtcbiAgIHZhciBib29rbWFya0NhbGxiYWNrID0gZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgcmVxdWVzdENvdW50IC09IDE7XG4gICAgICBpZihyZXNwb25zZS5SZWNBcmVhSUQpe1xuICAgICAgICAgc3RhdGUucmVjcmVhdGlvbi5hbGwuYWRkRGF0YShyZXNwb25zZSk7XG4gICAgICAgICBzdGF0ZS5yZWNyZWF0aW9uLmFkZEJvb2ttYXJrKHN0YXRlLnJlY3JlYXRpb24uYWxsLlJFQ0RBVEEuZmluZCgocikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHIuaWQgPT0gcmVzcG9uc2UuUmVjQXJlYUlEO1xuICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgaWYocmVxdWVzdENvdW50ID09PSAwKXtcbiAgICAgICAgIC8vbmVlZCB0byB3YWl0IGZvciBkaXJlY3Rpb25zIHRvIGxvYWRcbiAgICAgICAgIHN0YXRlLnJlY3JlYXRpb24uZmlsdGVyQWxsKCk7XG4gICAgICB9XG4gICB9XG4gICBib29rbWFya2VkLmZvckVhY2goKGIpID0+IHtcbiAgICAgIHJlcXVlc3RDb3VudCArPSAxO1xuICAgICAgcmVjQXBpQnlJZChiLCBib29rbWFya0NhbGxiYWNrKTtcbiAgIH0pO1xufVxuXG4vL21ha2Ugc3VyZSB0aGlzIGlzIHNldCBmYWxzZSBpZiB0aGV5IGNob29zZSBub3QgdG8gbG9hZCBzdG9yYWdlIVxudmFyIGhhc1N0b3JhZ2UgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGFzLXN0b3JlZCcpID09PSAndHJ1ZSc7XG52YXIgaGFzTG9hZGVkID0gZmFsc2U7XG5pZiggaGFzU3RvcmFnZSl7XG4gICBzdGF0ZS5tYXAuZGlyZWN0aW9ucy5vbignY2hhbmdlJywgZ2V0Qm9va21hcmtzKTtcbn1cblxud2luZG93LmxvYWRTdG9yYWdlID0gbG9hZFN0b3JhZ2U7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAkKCcjc3RvcmFnZS1tb2RhbCcpLm1vZGFsKHtcbiAgICAgIGRpc21pc3NpYmxlOiBmYWxzZVxuICAgfSk7XG4gICBpZihoYXNTdG9yYWdlKXtcbiAgICAgICQoJyNzdG9yYWdlLW1vZGFsJykubW9kYWwoJ29wZW4nKTtcbiAgICAgICQoJyNuZXctc2Vzc2lvbicpLmNsaWNrKHJlc2V0U3RvcmFnZSk7XG4gICAgICAkKCcjY29udGludWUtc2Vzc2lvbicpLmNsaWNrKGxvYWRTdG9yYWdlKTtcbiAgIH1cbn0pO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zcmMvY29tcG9uZW50cy9sb2NhbHN0b3JhZ2UvbG9jYWxzdG9yYWdlLmpzXG4vLyBtb2R1bGUgaWQgPSAyNlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9