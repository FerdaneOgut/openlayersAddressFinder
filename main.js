window.onload = init;

// get location using the Geolocation interface
var geoLocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
}
var map;
var markerLayer;
var popup;
function init() {

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoLocationOptions)

}

function geoSuccess(position) {

    let myLat = position.coords.latitude.toFixed(6);
    let myLng = position.coords.longitude.toFixed(6);
    let myAcc = position.coords.accuracy;

    let url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + myLat + "&lon=" + myLng;
    initMap(myLat, myLng, 10);

    getNominatimLatLonResult(myLat, myLng);
}

function geoError(err) {
    initMap(37.41, 8.82);
    console.warn(`ERROR(${err.code}): ${err.message}`)
}

function initMap(lat, lon, zoom) {
    let latitude = 0;
    let longitude = 0;
    if (lat && lon) {
        latitude = lat;
        longitude = lon;

    }
    markerLayer = new ol.layer.Vector({
        source: new ol.source.Vector()
    });
    markerLayer.set('name', 'markerLayer');

    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({ source: new ol.source.OSM() }), markerLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([lon, lat]),
            zoom: zoom ? zoom : 4
        })
    });


    var element = document.getElementById('popup');

    popup = new ol.Overlay({
        element: element,

    });
    map.addOverlay(popup);
    popup.setPosition(undefined)
    // change mouse cursor when over marker
    map.on('pointermove', function (e) {

        var layer = e.map.forEachFeatureAtPixel(e.pixel, function (feat, layer) {
            return layer;
        });
        var hit = false;

        if (layer && layer.get('name') == 'markerLayer') {

            var pixel = e.map.getEventPixel(e.originalEvent);
            hit = map.hasFeatureAtPixel(pixel);
        } else {
            hit = false;
        }

        e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    createMarkerInteraction();

}

function createMarkerInteraction() {

    var style = new ol.style.Style({
        image: new ol.style.Icon({
            src: '/Assets/Local/img/marker.png',
            size: [48, 48],
            offset: [0, 0]
        })
    });
    var selectAdresMarker = new ol.interaction.Select({
        layers: [markerLayer],
        condition: ol.events.condition.singleClick,
        style: style
    });

    selectAdresMarker.on('select', function (evt) {

        var feature = evt.target.getFeatures();
        var selectedFeature = feature.item(0);

        if (selectedFeature) {
            var coordinates = selectedFeature.getGeometry().getCoordinates();
            document.getElementById('popupcontent').innerHTML = selectedFeature.get("content");
            popup.setPosition(coordinates);

        } else {
            popup.setPosition(undefined);
        }
        selectAdresMarker.getFeatures().clear();
    });
    map.addInteraction(selectAdresMarker);
}



function addMarker(lng, lat, display_name) {
    markerLayer.getSource().clear();
    var feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.transform([parseFloat(lng), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857')),
    });
    var style = new ol.style.Style({
        image: new ol.style.Icon({
            src: 'icon.png',
            size: [48, 48],
            offset: [0, 0]
        })
    });
    feature.setStyle(style);
    let content = `<b>Location</b> <br>
        Latitude: ${lat} <br>
            Longtitude: ${lng} <br>
                    <b>Address</b><br>
                        ${display_name}
                 `;

    feature.set("content", content);
    markerLayer.getSource().addFeature(feature);

    map.getView().fit(markerLayer.getSource().getExtent(), map.getSize());
    map.getView().setZoom(16);
}

$('#popupcloser').on("click", function () {

    popup.setPosition(undefined);
});

$('#btnLatLon').on("click", function () {
    debugger;
    var latitude = $("#latitude").val();
    var longitude = $("#longitude").val();

    if (latitude == '' || longitude == '') {
        return false;
    }
    else {

        getNominatimLatLonResult(latitude, longitude);

    }
});


function getNominatimLatLonResult(latitude, longitude) {
    let url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + latitude + "&lon=" + longitude;

    $.ajax({
        beforeSend: function (request) {
            //You can specify the language, if you want results to be in specific language
          //  request.setRequestHeader("Accept-Language", 'tr');
        },
        dataType: "json",
        url: url,
        success: function (data) {
            addMarker(longitude, latitude, data.display_name);
        }
    });
}

$("#address").autocomplete({
    source: function (request, response) {

        $.ajax({
            url: "https://nominatim.openstreetmap.org/search",
            dataType: "json",
            data: {
                q: request.term,
                format: "jsonv2",
                addressdetails: 1,
                //you can specify the country codes if you want to restrict the results
                // countrycodes:'tr'
            },
            success: function (data) {
                console.log(data);
                let mapped = data.map(m => ({ label: m.display_name, lat: m.lat, lon: m.lon }));
                response(mapped);
            }
        });
    },
    minLength: 1,
    select: function (event, ui) {
        addMarker(ui.item.lon, ui.item.lat, ui.item.label);
        console.log(ui.item);
    },
    open: function () {
        $('.ui-autocomplete').css('z-index', 99999999999999);
        $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
    },
    close: function () {
        $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
    }

});