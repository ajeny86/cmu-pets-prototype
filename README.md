# buddy · Lost & Found prototype (CMU Pets)

Clickable website prototype of the **Lost & Found** flow, built from the CMU Pets Figma file and styled with the *buddy* design system.

## Run it

No build step. Serve the folder with any local web server and open it in a browser:

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173>. Use the **≡ Flow** button (bottom right) to jump to any screen, or **↺ Restart prototype** to start over.

## What's inside

- `index.html` — the whole prototype (HTML, CSS, vanilla JS, hash routing).
- `assets/` — icons, the buddy wordmark and the demo member's pet photo.

## Main flows

- **AI Guide on Home** — understands free text in English and Russian (typos and wrong keyboard layout too) and routes to Lost report, Found pet, Services & Care, Adoption or Shop.
- **Lost report card** — fields filled from the message; the AI asks for the photo and the required details, then optional ones. Members sign in and the card fills from their profile.
- **Photo recognition** — MobileNet (TensorFlow.js, in the browser) detects the animal type and guesses a breed.
- **Search results** — match found → reunite, or **No match yet**: email alerts, a printable/shareable lost-pet poster, free-account offer, vets & shelters nearby on a map, tips for the next 24 hours.
- **Found a pet** — photo → AI check → report → share.

## External services (need internet)

- Maps: [Leaflet](https://leafletjs.com) + OpenStreetMap tiles.
- Place names, vets & shelters: OpenStreetMap Nominatim.
- Photo recognition: TensorFlow.js + MobileNet from jsDelivr.

Demo data only — names, phone numbers and found-pet reports are made up.
