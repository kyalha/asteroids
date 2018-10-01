var BOXSHADOW_BY_DEFAULT = "inset 0em 0em 0.5em #fefcc9, 0.15em 0 0.4em #feec85, inset -0.1em -0.25em 0.5em #ffae34, 0.15em -0.1em 0.5em #ec760c, inset -0.1em -0.5em 0.6em #cd4606, 0 0.2em 0.6em #973716, inset 0.2em -1em 3em 0px #451b0e"


$url = $("#url");
$total = $("#total");
$results = $("#results");
$from = $( "#from");
$to = $("#to");
$plan = $("#plan");
$objects = $("#objects");
$container = $("#container");
$information = $("#information");
$more = $("#more");
$loader = $("#loader");
$navbar = $("#navbar");
$popup = $("#popup");
$close = $("#close");

var array_dates = [];
var map_dates = [];
var dateFormat = "mm/dd/yy";

var id_closest, id_furthest, id_fastest, id_slowest, id_biggest, id_smallest= "";
var km_closest, km_furthest, kmPHour_fastest, kmPHour_slowest, m_biggest, m_smallest = 0;
var array_objects = [];
var center_x = $plan[0].offsetWidth/2;
var center_y = $plan[0].offsetHeight/2;

initialise();

jQuery(window).load(function () {
    setTimeout(function () {
        $loader.css('visibility', 'hidden');
        $information.css('visibility', 'visible');
        $plan.css('visibility', 'visible');
        $more.css('visibility', 'visible');
        $popup.css('visibility', 'visible');
    }, 2000);
    setEarth();
});

$close.on( "click", function() {
    $popup.css('visibility', 'hidden');
});

$from.datepicker({
  changeMonth: true,
  numberOfMonths: 1,
})
.on( "change", function() {
    $to.datepicker( "option", "minDate", $from.val() );
    $to.datepicker('option', 'maxDate', getMaxDate($from.val()));
    if($to.val() != ""){
        sendAJAX($from.val(), $to.val());
    }
});

$to.datepicker({
    defaultDate: "+1w",
    changeMonth: true,
    numberOfMonths: 1
})
.on( "change", function() {
    map_dates = [];
    sendAJAX($from.val(), $to.val());
});

function setDate(element) {
  var date;
  try {
    date = $.datepicker.parseDate( dateFormat, element.value );
} catch( error ) {
    date = null;
}

return date;
}

function getMaxDate(date){
    var yyyy, mm, dd = 0;
    if(date.includes("-")){
        var arr = date.split("-");
        var dd = parseInt(arr[1])+7;
        var mm = parseInt(arr[0])-1;
        var yyyy = arr[2];
    }else if(date.includes("/")){
        var arr = date.split("/");
        var dd = parseInt(arr[1])+7;
        var mm = parseInt(arr[0])-1;
        var yyyy = arr[2];
    }
    return new Date(yyyy, mm, dd);
}
function sendAJAX(start, end){
    var url = getUrl(start, end);
    getResults(url);
}
function initialise(){
    var start_date = getCurrentDate();
    var end_date = getNextWeek();
    sendAJAX(start_date, end_date);
    $from.val(start_date);
    $to.val(end_date);
}

function getUrl(start_date, end_date){
    var start = parseDate(start_date);
    var end = parseDate(end_date);
    var url = "https://api.nasa.gov/neo/rest/v1/feed?start_date="+start+"&end_date="+end;
    return url +"&api_key="+ "XXXXXXXXXXXXX"; // use your private key !
}

function parseDate(date){
    if(date.includes("-")){
        var arr = date.split("-");
        return arr[2] + "-"+ arr[0] + "-" + arr[1];
    }else if(date.includes("/")){
        var arr = date.split("/");
        return arr[2] + "-"+ arr[0] + "-" + arr[1];
    }else {
        return null;
    }
}

function getCurrentDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10) {
        dd = '0'+dd
    } 
    if(mm<10) {
        mm = '0'+mm
    } 
    return mm + '-' + dd + "-"+ yyyy;
}
function getNextWeek(){
    var nextWeek = new Date();
    var dd = nextWeek.getDate()+7;
    if(!Date.parse(dd)){
         dd = nextWeek.getDate()+6;
    }
    var mm = nextWeek.getMonth()+1; //January is 0!
    var yyyy = nextWeek.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    } 
    if(mm<10) {
        mm = '0'+mm
    } 

    return mm + '-' + dd + "-"+ yyyy;
}

function getResults(url){
    $.ajax({
      url: url,
      success: function (result){
        $total.text(result.element_count);
        console.log(result);
        var dates = result.near_earth_objects;
        $.each( dates, function( key, value ) {
            map_dates.push({date:key,arr:[value]});
        });
        map_dates.sort(function(a,b){
            var c = new Date(a.date);
            var d = new Date(b.date);
            return c-d;
        });
        printResult(map_dates);
    }
});
}

function printResult(map){
    $objects.empty();
    array_objects = [];
    var html = "";
    var once = true;
    var index = 0;
    for (var i = 0; i < map.length; i++) {
        var arr = map[i].arr;
        html += "<ul>" + map[i].date
        for (var j = 0; j < arr[0].length ; j++) {
            var name = arr[0][j].name;
            var kilometers = arr[0][j].close_approach_data[0].miss_distance.kilometers;
            var velocity = arr[0][j].close_approach_data[0].relative_velocity.kilometers_per_hour;
            var diameter = (arr[0][j].estimated_diameter.meters.estimated_diameter_max +arr[0][j].estimated_diameter.meters.estimated_diameter_min ) / 2;
            var p = "<li>name: "+ name + " ~ diameter: "+ diameter
            + "m ~ distance: "+ kilometers + "km ~ velocity: " + velocity + "km/h </li>";
            html += p;
            array_objects.push({"name":name, "kilometers":parseFloat(kilometers), "velocity":parseFloat(velocity), "diameter":parseFloat(diameter), "id":index});
            drawAsteroids(parseFloat(kilometers), parseFloat(diameter), name, index, parseFloat(velocity));
            index++;
        }
        html += "</ul> ";
    }
    $results.text('');
    $results.append(html);
    setClasses();
}

function setEarth(){
    var div_center = document.createElement("div");
    div_center.className = "center";
    div_center.style.position = "absolute";
    div_center.style.left = center_x+'px';
    div_center.style.top = center_y+'px';
    $plan.append(div_center);
}

function drawAsteroids(distance, size, title, id, velocity){
    var side_long = generateSideLong();
    var side_lat = generateSideLat();
    
    var object = document.createElement("div");
    object.className = "obj";
    object.title = title;
    object.style.width= size/25+'px';
    object.style.height= size/25+'px';
    object.velocity = velocity;
    object.distance = distance;
    var angle = getAngle();
    var distPixels = distance / 200000;
    
    var objectX = 0;
    var objectY = 0;

    if(generateSideLong() === "left"){
        objectX = center_x - distPixels - (parseInt(object.style.width)/2) ;
        objectY = center_y - distPixels - (parseInt(object.style.height)/2);
    }
    else {
        objectX = center_x + distPixels - (parseInt(object.style.width)/2) ;
        objectY = center_y + distPixels - (parseInt(object.style.height)/2);
    }

    object.style.left = objectX + "px";
    object.style.top = objectY + "px";
    var subDiv = document.createElement("div");
    subDiv.id = id;
    subDiv.className = "containObj";
    var speed = (10000 / object.velocity) * 50 + "s";
    subDiv.append(object);
    $objects.append(subDiv);
    $("#"+subDiv.id).css(getAnimation(speed, generateSideLong()));
    
}

function generateSideLong(){
    var random = Math.floor((Math.random() * 10) + 1);
    if(random > 5)
        return "left";
    else
        return "right";
}
function generateSideLat(){
    var random = Math.floor((Math.random() * 10) + 1);
    if(random > 5)
        return "up";
    else
        return "down";
}

function setClasses(){
    var arr = array_objects;
    var firstCondition = false;
    var secondCondition = false;
    km_closest = arr[0].kilometers;
    km_furthest = arr[0].kilometers;
    m_smallest = arr[0].diameter;
    m_biggest = arr[0].diameter;
    kmPHour_slowest = arr[0].velocity;
    kmPHour_fastest = arr[0].velocity;
    id_closest = arr[0].id;
    id_furthest = arr[0].id;
    id_smallest = arr[0].id;
    id_biggest = arr[0].id;
    id_fastest = arr[0].id;
    id_slowest = arr[0].id;
    for (var i = arr.length - 1; i >= 0; i--) {
        if(km_closest > arr[i].kilometers){
            km_closest = arr[i].kilometers;
            id_closest = arr[i].id;
        }
        else if(km_furthest < arr[i].kilometers){
            km_furthest = arr[i].kilometers;                       
            id_furthest = arr[i].id;
        }
        else if(m_smallest > arr[i].diameter){
            m_smallest = arr[i].diameter;                       
            id_smallest = arr[i].id;
        }
        else if(m_biggest < arr[i].diameter){
            m_biggest = arr[i].diameter;                       
            id_biggest = arr[i].id;
        }
        else if(kmPHour_slowest > arr[i].velocity){
            kmPHour_slowest = arr[i].velocity;                       
            id_slowest = arr[i].id;
        }
        else if(kmPHour_fastest < arr[i].velocity){
            kmPHour_fastest = arr[i].velocity;                       
            id_fastest = arr[i].id;
        }
    }
    $("#plan").find($("#"+id_furthest)).addClass("furthest");
    $("#plan").find($("#"+id_closest)).addClass("closest");
    $("#plan").find($("#"+id_smallest)).addClass("smallest");
    $("#plan").find($("#"+id_biggest)).addClass("biggest");
    $("#plan").find($("#"+id_fastest)).addClass("fastest");
    $("#plan").find($("#"+id_slowest)).addClass("slowest");

    $("#furthest").text(precisionRound(km_furthest,2));
    $("#closest").text(precisionRound(km_closest,2));
    $("#smallest").text(precisionRound(m_smallest,2));
    $("#biggest").text(precisionRound(m_biggest,2));
    $("#fastest").text(precisionRound(kmPHour_fastest,2));
    $("#slowest").text(precisionRound(kmPHour_slowest,2));
}
function getAngle(){
    return Math.floor((Math.random() * 180) + 1);
}
function getPixelFromKilometers(kilometers){
    return kilometers / 100000;
}
function getAnimation(speed, side){
   return {
    "-webkit-animation": "spin-" + side +" "+ Math.round(parseFloat(speed)) + "s linear infinite",
    "-moz-animation": "spin-" + side +" "+ Math.round(parseFloat(speed)) + "s linear infinite",
    "-ms-animation": "spin-" + side +" "+ Math.round(parseFloat(speed)) + "s linear infinite",
    "-o-animation": "spin-" + side +" "+ Math.round(parseFloat(speed)) + "s linear infinite",
    "animation": "spin-" + side +" "+ Math.round(parseFloat(speed)) + "s linear infinite",
};
}
function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

$(function() {
    var shadowEffect = '0 0 10px 5px #fff, /* inner white */ 0 0 15px 10px #f0f, /* middle magenta */ 0 0 20px 15px #0ff';
    $( "#more" ).click(function() {
        if($('#results').css( "display" ) === "block"){
           $( "#results" ).css( "display","none" );
       } else {
          $( "#results" ).css( "display","block" );
      }
  });
    $('#biggest').hover(function() {
        $('.biggest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.biggest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
    $('#smallest').hover(function() {
        $('.smallest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.smallest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
    $('#furthest').hover(function() {
        $('.furthest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.furthest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
    $('#closest').hover(function() {
        $('.closest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.closest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
    $('#fastest').hover(function() {
        $('.fastest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.fastest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
    $('#slowest').hover(function() {
        $('.slowest').find("div").css('box-shadow', shadowEffect);
    }, function() {
        $('.slowest').find("div").css('box-shadow', BOXSHADOW_BY_DEFAULT);
    });
});