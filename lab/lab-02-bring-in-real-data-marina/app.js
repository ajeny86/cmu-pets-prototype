// Lost & Found Pets — the page's behaviour.
// The map pictures come from OpenStreetMap (free, no key).
// The vets come from OpenStreetMap through Photon (free, no key).
// The lost & found reports are DEMO data, written by hand, and always labelled.

// The last-seen spot: Arroios, Lisbon.
const LAST_SEEN = { lat: 38.7223, lon: -9.1393, label: "Arroios, Lisbon" };

// How far around the spot to look for vets, and how many to show.
const SEARCH_RADIUS_M = 2000;
const MAX_VETS = 8;

// How long to wait for the map pictures, the vet search and a place search.
const MAP_WAIT_MS = 8000;
const SEARCH_WAIT_MS = 8000;
const PLACE_WAIT_MS = 8000;

// The three marker colours, used by the pins, the legend and the switches.
const COLOURS = { lost: "#e0533d", found: "#1f9d74", vets: "#6a4cc2" };

// --- Demo reports ---------------------------------------------------------
// There is no free, key-less public feed of lost and found pet reports, so
// these are written by hand to design the screen. They are always labelled
// "Demo data" on the page. Photos are left empty on purpose: we don't use
// pictures of real pets we don't have permission to show.
// "date" is a real calendar date so the date filter can work on it.
const DEMO_REPORTS = [
  {
    kind: "lost", animalType: "dog", animal: "Dog · small, tan", name: "Pip",
    where: "Rua Morais Soares, Arroios", date: "2024-05-20", dateWords: "2 days ago",
    lat: 38.7255, lon: -9.1355, photo: "", link: ""
  },
  {
    kind: "found", animalType: "dog", animal: "Dog · black, medium", name: "No collar",
    where: "Praça do Chile, Arroios", date: "2024-05-22", dateWords: "Today, morning",
    lat: 38.7286, lon: -9.1367, photo: "", link: ""
  },
  {
    kind: "lost", animalType: "cat", animal: "Cat · grey tabby", name: "Migas",
    where: "Rua Pascoal de Melo, Arroios", date: "2024-05-17", dateWords: "5 days ago",
    lat: 38.7268, lon: -9.1400, photo: "", link: ""
  },
  {
    kind: "found", animalType: "cat", animal: "Cat · ginger", name: "No collar",
    where: "Alameda D. Afonso Henriques", date: "2024-05-21", dateWords: "Yesterday",
    lat: 38.7360, lon: -9.1370, photo: "", link: ""
  },
  {
    kind: "found", animalType: "dog", animal: "Dog · black, medium, no collar", name: "No collar",
    where: "Rua Almirante Reis, near Alameda", date: "2024-05-22", dateWords: "Today, 09:00",
    lat: 38.7305, lon: -9.1375, photo: "", link: ""
  }
];

const note = document.getElementById("map-note");
const vetsNote = document.getElementById("vets-note");
const vetsList = document.getElementById("vets-list");
const reportsNote = document.getElementById("reports-note");
const reportsList = document.getElementById("reports-list");
const todoVet = document.getElementById("todo-vet");
const searchCount = document.getElementById("search-count");
const placeNote = document.getElementById("place-note");
const placeInput = document.getElementById("place-input");
const placeGo = document.getElementById("place-go");

let map = null;
let mapTilesArrived = false;

// Everything drawn on the map, grouped so the filters can hide and show it.
const layers = { lost: null, found: null, vets: null };
let vetMarkers = [];

// What the search panel is currently asking for.
const search = {
  animal: "all",   // all | dog | cat | other
  status: "all",   // all | lost | found
  from: "",        // a date, or empty
  to: "",          // a date, or empty
  place: null      // { lat, lon, label } once a place search succeeds
};

// Each demo report's pin and list row, kept together so filters can hide both.
const reportPins = [];

// --- Small helpers for the calm status boxes ------------------------------
function setStatus(box, kind, title, message, retryLabel, retryAction) {
  box.className = "status is-" + kind;
  box.textContent = "";

  const heading = document.createElement("strong");
  heading.textContent = title;
  if (kind === "loading") {
    const dots = document.createElement("span");
    dots.className = "dots";
    heading.appendChild(dots);
  }
  box.appendChild(heading);

  if (message) box.appendChild(document.createTextNode(message));

  if (retryLabel && retryAction) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = retryLabel;
    button.addEventListener("click", retryAction);
    box.appendChild(document.createElement("br"));
    box.appendChild(button);
  }
}

// --- The map ---------------------------------------------------------------
function startMap() {
  setStatus(note, "loading", "Loading the map", "Last seen: " + LAST_SEEN.label + ". This usually takes a second or two.");

  try {
    map = L.map("map", { scrollWheelZoom: false }).setView([LAST_SEEN.lat, LAST_SEEN.lon], 15);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // The last-seen pin and circle sit in their own group, underneath the
    // pet and vet pins, so they never cover them.
    const homeLayer = L.layerGroup().addTo(map);
    L.marker([LAST_SEEN.lat, LAST_SEEN.lon]).addTo(homeLayer).bindPopup("Bobby was last seen here");
    L.circle([LAST_SEEN.lat, LAST_SEEN.lon], { radius: 400, color: COLOURS.vets, fillOpacity: 0.08 }).addTo(homeLayer);

    // Pet pins first, vet pins last: the last group drawn sits on top.
    layers.lost = L.layerGroup().addTo(map);
    layers.found = L.layerGroup().addTo(map);
    layers.vets = L.layerGroup().addTo(map);

    tiles.once("load", () => {
      mapTilesArrived = true;
      note.className = "muted";
      note.textContent = "Last seen: " + LAST_SEEN.label + " · the circle is roughly a 5-minute walk.";
    });

    setTimeout(() => {
      if (!mapTilesArrived) {
        setStatus(note, "error", "The map pictures are slow to arrive",
          "Your pin is still saved: " + LAST_SEEN.label + ". You can keep reading the lists below, or try the map again.",
          "Try the map again", () => {
            if (map) { map.remove(); map = null; }
            mapTilesArrived = false;
            startMap();
          });
      }
    }, MAP_WAIT_MS);
  } catch (err) {
    map = null;
    setStatus(note, "error", "The map couldn't load right now",
      "Nothing is lost — Bobby's last-seen spot is " + LAST_SEEN.label + ". The lists below still work.",
      "Try the map again", () => { mapTilesArrived = false; startMap(); });
  }

  drawReports();
  drawVetMarkers();
  applyFilters();
}

// --- Distance in plain words ----------------------------------------------
function distanceInMetres(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function metresInWords(m) {
  if (m < 1000) return Math.round(m / 10) * 10 + " m";
  return (m / 1000).toFixed(1) + " km";
}

// --- Opening hours in plain words -----------------------------------------
function hoursInWords(raw) {
  if (!raw) return "";
  const days = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" };
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => days[d]))
    .join(" · ");
}

function safeLink(url) {
  return /^https?:\/\//i.test(url) ? url : "";
}

// --- The demo reports: list + pins ----------------------------------------
function drawReports() {
  reportsList.textContent = "";
  reportPins.length = 0;

  DEMO_REPORTS.forEach((report) => {
    const li = document.createElement("li");

    const photo = safeLink(report.photo);
    if (photo) {
      const img = document.createElement("img");
      img.className = "thumb";
      img.src = photo;
      img.alt = report.animal;
      li.appendChild(img);
    } else {
      const box = document.createElement("div");
      box.className = "thumb placeholder";
      box.textContent = "🐾";
      box.title = "No photo in this demo report";
      li.appendChild(box);
    }

    const body = document.createElement("div");
    body.style.flex = "1";

    const kind = document.createElement("div");
    kind.className = "report-kind " + report.kind;
    kind.textContent = (report.kind === "lost" ? "Lost pet" : "Found pet") + " · demo";

    const title = document.createElement("div");
    title.className = "report-title";
    title.textContent = report.name + " — " + report.animal;

    const meta = document.createElement("div");
    meta.className = "report-meta";
    meta.textContent = report.where + " · " + report.dateWords;

    const linkRow = document.createElement("div");
    linkRow.className = "report-link";
    const link = safeLink(report.link);
    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "See the original report";
      linkRow.appendChild(a);
    } else {
      const none = document.createElement("span");
      none.className = "missing";
      none.textContent = "No original report to link to (demo)";
      linkRow.appendChild(none);
    }

    body.append(kind, title, meta, linkRow);
    li.appendChild(body);
    reportsList.appendChild(li);

    // A pin on the map: red for lost, green for found.
    let marker = null;
    if (map) {
      const isLost = report.kind === "lost";
      marker = L.circleMarker([report.lat, report.lon], {
        radius: 8, color: "#fff", weight: 2,
        fillColor: isLost ? COLOURS.lost : COLOURS.found, fillOpacity: 1
      })
        .addTo(layers[report.kind])
        .bindPopup(
          "<strong>" + (isLost ? "Lost pet" : "Found pet") + " · demo</strong><br>" +
          report.name + " — " + report.animal + "<br>" +
          report.where + "<br>" + report.dateWords + "<br>" +
          (link ? '<a href="' + link + '" target="_blank" rel="noopener">Original report</a>' : "No original report (demo)")
        );

      li.addEventListener("click", () => {
        map.setView([report.lat, report.lon], 16);
        marker.openPopup();
      });
    }

    reportPins.push({ report, li, marker });
  });
}

// --- Real vets from OpenStreetMap, via Photon -----------------------------
async function findVets() {
  vetsList.textContent = "";
  vetMarkers = [];
  if (layers.vets) layers.vets.clearLayers();
  setStatus(vetsNote, "loading", "Looking for real vets near the last-seen spot",
    "We only show clinics listed in OpenStreetMap — nothing made up.");

  const url =
    "https://photon.komoot.io/api/?q=vet&osm_tag=amenity:veterinary" +
    "&lat=" + LAST_SEEN.lat + "&lon=" + LAST_SEEN.lon +
    "&limit=30";

  const stopWaiting = new AbortController();
  const timer = setTimeout(() => stopWaiting.abort(), SEARCH_WAIT_MS);

  try {
    const response = await fetch(url, { signal: stopWaiting.signal });
    if (!response.ok) throw new Error("search failed");
    const data = await response.json();
    const places = (data.features || [])
      .map((f) => {
        const p = f.properties || {};
        const coords = f.geometry && f.geometry.coordinates;
        if (!coords) return null;
        const vet = {
          name: p.name || "Vet (name not listed)",
          street: [p.street, p.housenumber].filter(Boolean).join(" "),
          city: p.city || p.district || "",
          phone: p.phone || p["contact:phone"] || "",
          website: p.website || p["contact:website"] || "",
          hours: p.opening_hours || "",
          lat: coords[1],
          lon: coords[0]
        };
        vet.distance = distanceInMetres(LAST_SEEN, vet);
        return vet;
      })
      .filter((v) => v && v.distance <= SEARCH_RADIUS_M)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_VETS);

    showVets(places);
  } catch (err) {
    const timedOut = err && err.name === "AbortError";
    setStatus(vetsNote, "error",
      timedOut ? "The vet list is taking longer than usual" : "We couldn't reach the vet list right now",
      "Nothing is wrong with Bobby's report. You can still call a vet you know, or search “veterinário Arroios” on your phone.",
      "Try the vet list again", findVets);
  } finally {
    clearTimeout(timer);
  }
}

function showVets(vets) {
  if (vets.length === 0) {
    setStatus(vetsNote, "empty", "No vets listed in OpenStreetMap nearby",
      "That just means nobody has added them to the free map yet — it doesn't mean there are none. Ask a neighbour, or search “veterinário Arroios” on your phone.",
      "Search again", findVets);
    return;
  }

  vetsNote.className = "muted";
  vetsNote.textContent =
    vets.length + " real vet" + (vets.length === 1 ? "" : "s") +
    " listed in OpenStreetMap within " + metresInWords(SEARCH_RADIUS_M) +
    " · straight-line distance. Details only where OpenStreetMap has them.";

  vets.forEach((vet, index) => {
    const li = document.createElement("li");
    const where = [vet.street, vet.city].filter(Boolean).join(", ");

    const dist = document.createElement("span");
    dist.className = "dist";
    dist.textContent = metresInWords(vet.distance);
    const name = document.createElement("div");
    name.className = "vet-name";
    name.textContent = vet.name;
    const meta = document.createElement("div");
    meta.className = "vet-meta";
    meta.textContent = where || "Address not listed";

    const contact = document.createElement("div");
    contact.className = "vet-contact";

    if (vet.phone) {
      const tel = document.createElement("a");
      tel.href = "tel:" + vet.phone.replace(/[^\d+]/g, "");
      tel.textContent = "Call " + vet.phone;
      contact.appendChild(tel);
    } else {
      const none = document.createElement("span");
      none.className = "missing";
      none.textContent = "No phone number listed";
      contact.appendChild(none);
    }

    const site = safeLink(vet.website);
    contact.appendChild(document.createTextNode(" · "));
    if (site) {
      const link = document.createElement("a");
      link.href = site;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Website";
      contact.appendChild(link);
    } else {
      const none = document.createElement("span");
      none.className = "missing";
      none.textContent = "no website listed";
      contact.appendChild(none);
    }

    const hours = document.createElement("div");
    hours.className = "vet-hours";
    const hoursText = hoursInWords(vet.hours);
    if (hoursText) {
      hours.textContent = "Open: " + hoursText;
    } else {
      const none = document.createElement("span");
      none.className = "missing";
      none.textContent = "Opening hours not listed — call first";
      hours.appendChild(none);
    }

    li.append(dist, name, meta, contact, hours);
    vetsList.appendChild(li);

    if (map) {
      const marker = L.circleMarker([vet.lat, vet.lon], {
        radius: 9, color: "#fff", weight: 2, fillColor: COLOURS.vets, fillOpacity: 1
      })
        .addTo(layers.vets)
        .bindPopup(
          "<strong>" + (index + 1) + ". " + vet.name + "</strong><br>" +
          (where || "Address not listed") + "<br>" +
          metresInWords(vet.distance) + " away<br>" +
          (vet.phone ? "Phone: " + vet.phone : "No phone number listed") + "<br>" +
          (site ? '<a href="' + site + '" target="_blank" rel="noopener">Website</a>' : "No website listed") + "<br>" +
          (hoursText ? "Open: " + hoursText : "Opening hours not listed")
        );
      vetMarkers.push(marker);

      li.addEventListener("click", () => {
        map.setView([vet.lat, vet.lon], 16);
        marker.openPopup();
      });
    }
  });

  if (map) {
    const points = [[LAST_SEEN.lat, LAST_SEEN.lon]].concat(vets.map((v) => [v.lat, v.lon]));
    map.fitBounds(points, { padding: [24, 24] });
  } else {
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.textContent = "The map isn't showing, but each vet's address is in the list above.";
    vetsList.appendChild(hint);
  }

  const closest = vets[0];
  const closestWhere = [closest.street, closest.city].filter(Boolean).join(", ");
  todoVet.textContent =
    "Call the closest vet first: " + closest.name +
    " (" + metresInWords(closest.distance) + " away" +
    (closestWhere ? ", " + closestWhere : "") + ")" +
    (closest.phone ? " — " + closest.phone + "." : " — no phone number listed, so walk in.");

  applyFilters();
}

// Draw the vet pins again on a fresh map (the vet list itself stays put).
function drawVetMarkers() {
  if (!map) return;
  vetMarkers.forEach((marker) => marker.addTo(layers.vets));
}

// --- The search panel -----------------------------------------------------
// Animal and status chips: one choice each, the chosen one is highlighted.
function setUpChips(containerId, key) {
  const container = document.getElementById(containerId);
  container.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      search[key] = chip.dataset[key];
      container.querySelectorAll(".chip").forEach((other) => {
        other.setAttribute("aria-pressed", other === chip ? "true" : "false");
      });
      applySearch();
    });
  });
}

// Does this report match what the search panel is asking for?
function reportMatches(report) {
  if (search.animal !== "all" && report.animalType !== search.animal) return false;
  if (search.status !== "all" && report.kind !== search.status) return false;
  if (search.from && report.date < search.from) return false;
  if (search.to && report.date > search.to) return false;
  return true;
}

// Show only the matching reports, on the list and on the map together.
function applySearch() {
  let shown = 0;

  reportPins.forEach(({ report, li, marker }) => {
    const matches = reportMatches(report);
    if (matches) shown += 1;
    li.style.display = matches ? "" : "none";
    if (marker) {
      const wanted = matches && document.getElementById("show-" + report.kind).checked;
      if (wanted && !layers[report.kind].hasLayer(marker)) marker.addTo(layers[report.kind]);
      if (!wanted && layers[report.kind].hasLayer(marker)) layers[report.kind].removeLayer(marker);
    }
  });

  searchCount.textContent = shown + " of " + DEMO_REPORTS.length + " demo reports match";

  if (shown === 0) {
    setStatus(reportsNote, "empty", "No demo reports match these filters",
      "Try a wider date range, or choose “All” for animal and status. The reports are examples, so there may simply be none like this.",
      "Clear filters", clearFilters);
  } else {
    reportsNote.className = "muted";
    reportsNote.textContent =
      shown + " demo report" + (shown === 1 ? "" : "s") +
      " shown · example reports only, not real pets. Tap one to see it on the map.";
  }
}

// Clear filters: back to everything, and back to Bobby's spot.
function clearFilters() {
  search.animal = "all";
  search.status = "all";
  search.from = "";
  search.to = "";
  search.place = null;

  document.querySelectorAll("#animal-chips .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", chip.dataset.animal === "all" ? "true" : "false");
  });
  document.querySelectorAll("#status-chips .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", chip.dataset.status === "all" ? "true" : "false");
  });
  document.getElementById("date-from").value = "";
  document.getElementById("date-to").value = "";
  placeInput.value = "";
  placeNote.textContent = "";
  placeNote.className = "place-note";

  if (map) map.setView([LAST_SEEN.lat, LAST_SEEN.lon], 15);
  applySearch();
  applyFilters();
}

// --- Place search: turn a street, neighbourhood or city into a spot -------
// Photon (OpenStreetMap data, no key) finds the place; the map then centres on it.
async function searchPlace() {
  const text = placeInput.value.trim();

  if (!text) {
    placeNote.className = "place-note is-error";
    placeNote.textContent = "Type a street, neighbourhood or city first — for example “Arroios”.";
    return;
  }

  placeNote.className = "place-note is-ok";
  placeNote.textContent = "Looking for “" + text + "”…";
  placeGo.disabled = true;

  const url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(text) + "&limit=1";
  const stopWaiting = new AbortController();
  const timer = setTimeout(() => stopWaiting.abort(), PLACE_WAIT_MS);

  try {
    const response = await fetch(url, { signal: stopWaiting.signal });
    if (!response.ok) throw new Error("search failed");
    const data = await response.json();
    const first = (data.features || [])[0];

    if (!first || !first.geometry) {
      placeNote.className = "place-note is-error";
      placeNote.textContent = "We couldn't find “" + text + "”. Try a shorter name, like “Arroios” or “Lisbon”.";
      return;
    }

    const p = first.properties || {};
    const label = [p.name, p.city || p.district, p.country].filter(Boolean).join(", ") || text;
    const lat = first.geometry.coordinates[1];
    const lon = first.geometry.coordinates[0];

    search.place = { lat, lon, label };
    placeNote.className = "place-note is-ok";
    placeNote.textContent = "Showing the map around " + label + ".";

    if (map) map.setView([lat, lon], 15);
  } catch (err) {
    const timedOut = err && err.name === "AbortError";
    placeNote.className = "place-note is-error";
    placeNote.textContent = timedOut
      ? "The place search is taking longer than usual. Your filters still work — try again in a moment."
      : "We couldn't reach the place search right now. Your filters still work; the map stays where it was.";
  } finally {
    clearTimeout(timer);
    placeGo.disabled = false;
  }
}

// --- Filters: switch lost pets, found pets and vets on and off ------------
function applyFilters() {
  const showLost = document.getElementById("show-lost").checked;
  const showFound = document.getElementById("show-found").checked;
  const showVets = document.getElementById("show-vets").checked;

  if (map) {
    toggleLayer(layers.lost, showLost);
    toggleLayer(layers.found, showFound);
    toggleLayer(layers.vets, showVets);
    // Vet pins go back on top, so they are never hidden behind pet pins.
    if (showVets) layers.vets.eachLayer((marker) => marker.bringToFront());
  }

  // Keep the lists in step with the map, so nothing on screen disagrees.
  reportPins.forEach(({ report, li }) => {
    const kindOn = report.kind === "lost" ? showLost : showFound;
    li.style.display = kindOn && reportMatches(report) ? "" : "none";
  });
  vetsList.querySelectorAll("li").forEach((li) => {
    li.style.display = showVets ? "" : "none";
  });
}

function toggleLayer(layer, visible) {
  if (!layer) return;
  if (visible && !map.hasLayer(layer)) layer.addTo(map);
  if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
}

// --- Wiring up the page ---------------------------------------------------
setUpChips("animal-chips", "animal");
setUpChips("status-chips", "status");

document.getElementById("date-from").addEventListener("change", (e) => {
  search.from = e.target.value;
  applySearch();
});
document.getElementById("date-to").addEventListener("change", (e) => {
  search.to = e.target.value;
  applySearch();
});

placeGo.addEventListener("click", searchPlace);
placeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchPlace();
});

document.getElementById("clear-filters").addEventListener("click", clearFilters);

["show-lost", "show-found", "show-vets"].forEach((id) => {
  document.getElementById(id).addEventListener("change", applyFilters);
});

startMap();
findVets();
