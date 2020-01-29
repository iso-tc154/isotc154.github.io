(function () {

  /* Initializes maps based on targets
     represented by DOM elements with data-map-container attribute present.

     Map targets are expected to specify following additional attributes:

     - data-map-id with unique string identifier for the map on current page.

     - data-map-center with JSON in following format {
         lon: <number>
         lat: <number>
         zoom: <number>
       }

     - optional data-map-disable-interactions, if set the map will be static.

     Exposes OL map objects under window.maps[<map ID>], with each value as {
       map: <OL map instance>
     }.

     Adds map markers based on DOM elements with data-map-marker attribute present.

     Marker elements are expected to specify following additional attributes:

     - data-map-id with unique string identifier for the map on current page.

     - data-map-marker-id with unique string identifier for given map marker.

     - data-map-marker-place-details JSON in following format: {
         title: <place name as string>
       }
    
     - data-map-marker-coords, with JSON in following format: {
         lon: <number>
         lat: <number>
       }

     Ties map markers with the elements on the page.

  */

  const PRIMARY_COLOR = '#0061AD';
  // NOTE: Keep up-to-date with the corresponding SCSS variable.

  const BODY_FONT = '16px Helvetica, Arial, sans-serif';
  // NOTE: Keep up-to-date with prevailing page style.

  const SUMMONED_MAP_HTML_CLASS = 'map-focused';

  const SELECTED_MAP_MARKER_REFERENCE_HTML_CLASS = 'map-marker-selected';

  window.maps = {};

  const maps = document.querySelectorAll('[data-map-container][data-map-id][data-map-center]');
  const markers = document.querySelectorAll('[data-map-marker][data-map-id][data-map-marker-id][data-map-marker-coords][data-map-marker-place-details]');

  for (const mapTarget of maps) {
    const mapID = mapTarget.dataset.mapId;
    if (!mapID) {
      throw new Error("Invalid map target: DOM dataset does not specify map ID");
    }
    window.maps[mapID] = initMap(mapID, mapTarget, markers);
  }

  function createMarkerReference(markerEl, markerIndex, onClick) {
    /* Append an element to place mention in body text,
       tying it to corresponding map marker. */

    const markerNumber = document.createElement('span');
    markerNumber.textContent = `${markerIndex}`;
    markerNumber.classList.add('map-marker-reference');
    markerNumber.addEventListener('click', onClick);

    markerEl.appendChild(markerNumber);
  }

  function initMap(mapID, target, allMarkers) {
    /* mapID: unique map ID as a string.
       target: DOM element to contain the map.
       allMarkers: DOM elements representing map markers. */


    // Prepare basic map data

    if (!target) {
      throw new Error("Invalid map target: DOM element is missing");
    }

    const centerDataRaw = target.dataset.mapCenter;

    if (!centerDataRaw) {
      throw new Error("Invalid map target: DOM dataset is missing map center");
    }

    let centerData;
    try {
      centerData = JSON.parse(centerDataRaw);
    } catch (e) {
      console.error("Failed to parse map center data");
      throw e;
    }

    const disableInteractions =
      target.dataset.mapDisableInteractions !== undefined;


    // Read and initialize markers

    var markers = {};

    for (const [_idx, markerEl] of allMarkers.entries()) {
      if (markerEl.dataset.mapId !== mapID) {
        // Skip this marker if it belongs to another map.
        continue;
      }

      const markerID = markerEl.dataset.mapMarkerId;
      const idx = _idx + 1;

      // Parse coordinates and place details from marker DOM dataset
      let coords, details;
      try {
        coords = JSON.parse(markerEl.dataset.mapMarkerCoords);
        details = JSON.parse(markerEl.dataset.mapMarkerPlaceDetails);
      } catch (e) {
        console.error("Failed to parse map marker coords or details");
        throw e;
      }

      if (!details.title) {
        console.error("Malformed marker place details", markerID, details);
        continue;
      }

      // Convert OpenLayers coordinates
      const olCoords = ol.proj.fromLonLat([coords.lon, coords.lat]);

      createMarkerReference(
        markerEl,
        idx,
        function () { selectMarker(markerID, 'page') });

      // (see below for overlay usage)
      const overlayEl = document.createElement('div');
      overlayEl.dataset.mapMarkerBubble = true;
      overlayEl.dataset.tippyContent = details.title;

      const markerFeature = new ol.Feature({
        markerID: markerID,
        geometry: new ol.geom.Point(olCoords),
      });
      const fill = new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.4)',
      });
      const stroke = new ol.style.Stroke({
        color: PRIMARY_COLOR,
        width: 1.25,
      });
      markerFeature.setStyle([new ol.style.Style({
        image: new ol.style.Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
      }), new ol.style.Style({
        text: new ol.style.Text({
          font: BODY_FONT,
          placement: 'point',
          textAlign: 'left',
          offsetX: 10,
          text: `${idx}`,
          padding: [2, 3, 2, 3],
          backgroundFill: new ol.style.Fill({ color: PRIMARY_COLOR }),
          fill: new ol.style.Fill({
            color: '#fff',
          }),
          stroke: new ol.style.Stroke({
            color: '#000',
            width: 2,
          }),
        }),
      })]);

      markers[markerID] = {
        coords: olCoords,
        el: markerEl,
        idx: idx,

        // Feature is used to visualize place marker
        // on the map as a point.
        feature: markerFeature,

        // Overlay is used as an anchor for tooltip
        // showing extra place information.
        overlay: new ol.Overlay({
          id: `marker-${markerID}`,
          element: overlayEl,
          position: olCoords,
        }),
      };
    }


    // Initialize the map

    const markerFeatures = Object.values(markers).map(function (marker) {
      return marker.feature;
    });

    const map = new ol.Map({
      target: target,
      controls: disableInteractions ? [] : null,
      interactions: disableInteractions ? [] : null,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
        new ol.layer.Vector({
          source: new ol.source.Vector({
            features: markerFeatures,
          }),
        }),
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([centerData.lon, centerData.lat]),
        zoom: centerData.zoom,
      }),
    });


    // Initialize marker highlighting & map (de)focusing

    for (const marker of Object.values(markers)) {
      map.addOverlay(marker.overlay);
    }

    const tippys = tippy('[data-map-marker-bubble]', {
      trigger: 'manual',
      hideOnClick: false,
    });

    function hideAllTippys() {
      tippys.map(function (instance) { instance.hide(); });
    }

    map.on('singleclick', function (event) {
      map.forEachFeatureAtPixel(
        event.pixel,
        function (feature) {
          const markerID = feature.getProperties()['markerID'];
          if (markerID) {
            selectMarker(markerID, 'map');
            return true;
          }
        })
    });

    map.on('movestart', hideAllTippys);

    function deselectMarkers() {
      Object.values(markers).map(function (marker) {
        marker.el.classList.remove(SELECTED_MAP_MARKER_REFERENCE_HTML_CLASS);
      });
    }

    function selectMarker(markerID, eventSource) {
      /* eventSource: How the marker got selected; 'map' or 'page' */

      const marker = markers[markerID];

      if (!marker) {
        throw new Error(`Attempt to select unknown marker ${markerID}`);
      }

      deselectMarkers();

      if (!mapIsSummoned()) {
        summonMap();
      }

      let selectedMarkerTippy;
      try {
        selectedMarkerTippy = marker.overlay.getElement()._tippy;
      } catch (e) {
        throw new Error(`Unable to obtain tippy instance for ${markerID}`);
      }

      map.once('moveend', function () {
        hideAllTippys();
        selectedMarkerTippy.show();
      })

      map.getView().setCenter(marker.coords);

      if (eventSource === 'map') {
        marker.el.scrollIntoView();
      }

      marker.el.classList.add(SELECTED_MAP_MARKER_REFERENCE_HTML_CLASS);
    }

    function summonMap() {
      target.classList.add(SUMMONED_MAP_HTML_CLASS);

      function handlePotentiallyMapDismissingDocumentClick(event) {
        const clickedInsideMapMarkerReference = event.target.closest('[data-map-marker]');
        if (!target.contains(event.target) && !clickedInsideMapMarkerReference && mapIsSummoned()) {
          dismissMap();
          deselectMarkers();
          document.removeEventListener('click', handlePotentiallyMapDismissingDocumentClick);
        }
      }
      document.addEventListener('click', handlePotentiallyMapDismissingDocumentClick);
    }

    function dismissMap() {
      hideAllTippys();
      target.classList.remove(SUMMONED_MAP_HTML_CLASS);
    }

    function mapIsSummoned() {
      return target.classList.contains(SUMMONED_MAP_HTML_CLASS);
    }

    return {
      map: map,
    };
  }

}());