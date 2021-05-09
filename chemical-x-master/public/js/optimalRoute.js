let directionDisplay = new google.maps.DirectionsRenderer();
let directionsService = new google.maps.DirectionsService();

let map;

let ibe = new google.maps.LatLng(13.352310,77.539140);
let hattisar = new google.maps.LatLng(27.711360,85.318781);
let waypts = [];
waypts.push({
    location:"19.115750,72.854959"
})
let mapOptions = {
    zoom:14,
    center: ibe
}

map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

directionDisplay.setMap(map);

calculateRoute = () =>{
    const request = {
        origin:ibe,
        destination:hattisar,
        travelMode:"DRIVING",
        waypoints: waypts,
        optimizeWaypoints:true
    }

    directionsService.route(request,(result,status)=>{
        if(status=='OK'){
            directionDisplay.setDirections(result);
        }
    })
    
}

$('a[href="#optimalRoute"]').on('shown.bs.tab', function (e) {
    calculateRoute();
})