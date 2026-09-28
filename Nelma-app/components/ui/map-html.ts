export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapMessage = MapCoordinate & {
  source: "nelma-map";
};

const nmaist = {
  latitude: -3.3996,
  longitude: 36.7959
};

const arushaBounds = {
  north: -3.28,
  south: -3.48,
  west: 36.56,
  east: 36.9
};

export const toMapCoordinate = (latitude?: number | null, longitude?: number | null): MapCoordinate | null => {
  if (typeof latitude !== "number" || !Number.isFinite(latitude)) {
    return null;
  }
  if (typeof longitude !== "number" || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
};

export const parseMapMessage = (value: unknown): MapMessage | null => {
  const data = typeof value === "string" ? safeJsonParse(value) : value;
  const message = data as Partial<MapMessage> | null;
  if (message?.source !== "nelma-map") {
    return null;
  }
  const coordinate = toMapCoordinate(message.latitude, message.longitude);
  return coordinate ? { source: "nelma-map", ...coordinate } : null;
};

export const buildMapHtml = (latitude?: number | null, longitude?: number | null, pickable = false): string => {
  const coordinate = toMapCoordinate(latitude, longitude);
  const centerLatitude = coordinate?.latitude ?? nmaist.latitude;
  const centerLongitude = coordinate?.longitude ?? nmaist.longitude;
  const zoom = coordinate ? 16 : 13;
  const initialMarker = coordinate ? `setSelectedMarker(${coordinate.latitude}, ${coordinate.longitude});` : "";
  const pickHandler = pickable ? `map.on('click', function (event) {
      var lat = Number(event.latlng.lat.toFixed(6));
      var lng = Number(event.latlng.lng.toFixed(6));
      setSelectedMarker(lat, lng);
      sendCoordinate(lat, lng);
    });` : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; width: 100%; }
    body { background: #E9F7FF; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; overflow: hidden; }
    #map { cursor: ${pickable ? "crosshair" : "grab"}; }
    .leaflet-container { background: #E9F7FF; color: #102033; font-family: inherit; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map" role="application" aria-label="Actual NELMA delivery map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${centerLatitude}, ${centerLongitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var serviceBounds = [[${arushaBounds.south}, ${arushaBounds.west}], [${arushaBounds.north}, ${arushaBounds.east}]];
    L.rectangle(serviceBounds, {
      color: '#009FE3',
      fillColor: '#009FE3',
      fillOpacity: 0.08,
      interactive: false,
      opacity: 0.75,
      weight: 2
    }).addTo(map);

    L.circleMarker([${nmaist.latitude}, ${nmaist.longitude}], {
      color: '#009FE3',
      fillColor: '#009FE3',
      fillOpacity: 0.95,
      interactive: false,
      radius: 8,
      weight: 2
    }).addTo(map);

    var selectedMarker = null;
    function setSelectedMarker(lat, lng) {
      if (selectedMarker) {
        selectedMarker.setLatLng([lat, lng]);
      } else {
        selectedMarker = L.marker([lat, lng], { title: 'Your delivery pin' }).addTo(map);
      }
      selectedMarker.bindPopup('Your delivery pin');
    }

    ${initialMarker}

    function sendCoordinate(lat, lng) {
      var payload = { source: 'nelma-map', latitude: lat, longitude: lng };
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      if (window.parent) {
        window.parent.postMessage(payload, '*');
      }
    }

    ${pickHandler}
  </script>
</body>
</html>`;
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
