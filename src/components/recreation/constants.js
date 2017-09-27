export var interestList = [
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
export function updateIcons(type, id, value) {
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


export function recApiQuery(latitudeVal,longitudeVal,radiusVal,activityVal,callback) {

    var recQueryURL = "https://ridb.recreation.gov/api/v1/recareas.json?apikey=2C1B2AC69E1945DE815B69BBCC9C7B19&full&latitude="
    + latitudeVal + "&longitude=" + longitudeVal + "&radius=" + radiusVal + "&activity=" + activityVal;

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}

export function recApiById(id, callback) {

    var recQueryURL = "https://ridb.recreation.gov/api/v1/recareas/" + id + ".json?apikey=2C1B2AC69E1945DE815B69BBCC9C7B19&full"

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}
