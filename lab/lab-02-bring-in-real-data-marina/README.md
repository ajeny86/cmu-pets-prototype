# Lab 02 · Bring in real data

**Author:** Marina · **Project:** Lost & Found Pets

A prototype feels real when it shows real things. This lab turns the *No match yet for Bobby* screen into one that uses free, key-less data: a real map of the last-seen spot in Arroios, Lisbon, and the real vets nearby.

## Open it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173>.

## What's on the page

- **Map of the last-seen spot** (OpenStreetMap + Leaflet), with pins for lost pets, found pets and vets, switches to show or hide each, and a map key.
- **Search lost & found reports**: by animal, status, dates and place. The place search uses Photon to turn a street, neighbourhood or city into a spot. The reports are hand-written **demo data**, always labelled as such.
- **Vets and shelters nearby**: real clinics from OpenStreetMap through Photon, within 2 km, with distance and opening hours in plain words when they're listed.
- **Calm loading and failure states**: if the map or the search is slow or fails, the page says so and offers a retry, so the owner can carry on.

## Data and privacy

| Data | Source | Key needed |
|---|---|---|
| Map pictures | OpenStreetMap tiles | No |
| Vets, place search | Photon (built on OpenStreetMap) | No |
| Lost & found reports | Demo data, written by hand | — |

The "© OpenStreetMap contributors" credit stays on the map. Only areas are shown, never a home address. Demo reports have no photos of real pets.

## Files

- `index.html`, `app.js`, `style.css`: the page.
- `cheat-sheets/openstreetmap.md`: the lab's cheat sheet for OpenStreetMap and Photon.
- `notes.md`: what was tried, as idea → what changed → keep or drop.
