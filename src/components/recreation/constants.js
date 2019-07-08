import awsExports from '../../aws-exports';
const API_URL = awsExports.aws_cloud_logic_custom[0].endpoint;

emojione.emojiSize = 64;

export var interestList = [
    {"ActivityName": "BIKING",
     "ActivityID": 5,
     "Emoji": ':person_mountain_biking:'
    },
    {"ActivityName": "CLIMBING",
     "ActivityID": 7,
     "Emoji": ':man_climbing:'
    },
    {"ActivityName": "CAMPING",
     "ActivityID": 9,
     "Emoji": ':camping:'
     },
     {"ActivityName": "HIKING",
      "ActivityID": 14,
      "Emoji": ':mountain:'
    },
    {"ActivityName": "PICNICKING",
      "ActivityID": 20,
      "Emoji": ':sandwich:'
     },
     {"ActivityName": "RV",
      "ActivityID": 23,
      "Emoji": ':minibus:'
     },
     {"ActivityName": "VISITOR CENTER",
      "ActivityID": 24,
      "Emoji": ':information_source:'
    },
    {"ActivityName": "WATER SPORTS",
     "ActivityID": 25,
     "Emoji": ':person_surfing:'
    },
    {"ActivityName": "WILDLIFE VIEWING",
     "ActivityID": 26,
     "Emoji": ':eagle:'
    },
    {"ActivityName": "HORSEBACK RIDING",
     "ActivityID": 15,
     "Emoji": ':horse_racing:'
    },
    {
        "ActivityName": "SNORKELING",
        "ActivityID": 108,
        "Emoji": ':person_swimming:'
    },
    {
        "ActivityName": "PHOTOGRAPHY",
        "ActivityID": 104,
        "Emoji": ':camera_with_flash:'
    },
    {
        "ActivityName": "WINTER SPORTS",
        "ActivityID": 22,
        "Emoji": ':snowboarder:'
    },
    {
        "ActivityName": "OFF ROADING",
        "ActivityID": 18,
        "Emoji": ':blue_car:'
    },
    {
        "ActivityName": "HUNTING",
        "ActivityID": 16,
        "Emoji": ':deer:'
    },
    {
        "ActivityName": "FISHING",
        "ActivityID": 11,
        "Emoji": ':fishing_pole_and_fish:'
    },
]

export const emojiMap = interestList.reduce((map, interest) => {
    map[interest.ActivityID] = emojione.toImage(interest.Emoji);
    return map;
}, {});

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

    var recQueryURL = API_URL + "/recareas?latitude="
    + latitudeVal + "&longitude=" + longitudeVal + "&radius=" + radiusVal + "&activity=" + activityVal;

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}

export function recApiById(id, callback) {

    var recQueryURL = API_URL + "/recareas/" + id;

        $.ajax({
            url: recQueryURL,
            method: "GET"
        })
        .done(callback);
}

export function makeEmojis(state, recarea){
  var container = $('<span class="rec-emojis">');
  var filtered = state.recreation.status.filteredActivities;
  recarea.ACTIVITY
  .sort((a, b) => {
    if(filtered[a.ActivityID] && !filtered[b.ActivityID]){
      return -1;
    }
    else if(!filtered[a.ActivityID] && filtered[b.ActivityID]){
      return 1;
    }
    else{
      return a.ActivityName > b.ActivityName ? 1 : -1;
    }
  })
  .forEach((activity) => {
    var img = $(emojiMap[activity.ActivityID]);
    img.attr('title', activity.ActivityName)
    container.append(img);
  })
  return container;
}
