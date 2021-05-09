function initMap() {

    navigator.geolocation.getCurrentPosition(curLocation=>{
        var myLatLng = {lat: curLocation.coords.latitude, lng: curLocation.coords.longitude};
        //document.getElementById("#lat").setAttribute('value',myLatLng.lat);
        //document.getElementById('#lng').setAttribute('value',myLatLng.lng);
        
        document.querySelector('#lat').value = myLatLng.lat;
        document.querySelector('#lng').value = myLatLng.lng;
        var map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 13
        });
  
        var marker = new google.maps.Marker({
          position: myLatLng,
          map: map,
          title: 'Hello World!',
          draggable: true
        });
  
        google.maps.event.addListener(marker, 'dragend', function(marker) {
            var latLng = marker.latLng;
            document.querySelector('#lat').value = latLng.lat();
            document.querySelector('#lng').value = latLng.lng();
        });
        
    });
    
}