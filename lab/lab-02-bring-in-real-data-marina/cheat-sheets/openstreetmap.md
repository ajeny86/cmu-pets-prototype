# OpenStreetMap · maps and places · for Lost & Found Pets

Free maps of the whole world, plus a search for places on them (vets, shelters, parks). No account, no key.

## Two things you can use

- **The map itself**: streets and parks, with pins you can drop. It's shown with a small library called Leaflet. Ask the AI agent to add a map with a pin on the last-seen spot.
- **Places nearby**: find vets near a point with **Photon**, a fast search built on OpenStreetMap. Ask the AI agent to use Photon for this.

**Try it:** vets around Arroios, Lisbon. Ask the AI agent to open it and tell you what it found.

```
https://photon.komoot.io/api/?q=vet&osm_tag=amenity:veterinary&lat=38.7223&lon=-9.1393&bbox=-9.17,38.69,-9.11,38.75&limit=8
```

## What you get, and why an owner might care

| Data | Example | For Lost & Found Pets |
|---|---|---|
| Place name | Hospital Veterinário da Estefânia | Who to call first |
| Street | Rua Almirante Barroso | Where to go |
| Where it is | a point on the map | A pin, and how far away it is |

**Good to know:** keep the "© OpenStreetMap contributors" credit on the map. Not every place has a phone number or opening hours, so design for the gaps. Show areas, never someone's home address.
