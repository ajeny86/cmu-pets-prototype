/* The lost & found pets database (demo). Made up: no real people, phone numbers, emails or addresses —
   places are public landmarks and neighbourhoods. Dates are stored as "days ago" so the demo never goes stale.
   Read by lib/lost-pets/query.ts → the AI connector (/api/mcp), the REST API (/api/lost-pets) and /lost-found/reports. */

import type { LatLng } from "@/lib/ai/engine"

export type Species = "dog" | "cat" | "bird" | "rabbit" | "other"
export type Size = "small" | "medium" | "large"
/** found: someone has the animal · sighted: seen, not caught · lost: an owner is looking · reunited: case closed */
export type Status = "found" | "sighted" | "lost" | "reunited"

export type PetReport = {
  id: string
  status: Status
  species: Species
  breed: string | null
  /** Only known for lost pets, or from a tag. */
  name: string | null
  /** One base colour for matching: black, white, cream, grey, dark grey, brown, ginger, green… */
  colour: string
  /** How the reporter described it. */
  coat: string
  size: Size
  sex: "male" | "female" | null
  age: string | null
  marks: string | null
  collar: string | null
  /** "Chip read by a vet", "No chip found", or null if not checked. */
  chip: string | null
  area: keyof typeof AREAS
  /** A landmark in the area. */
  place: string
  daysAgo: number
  /** Hour of day it was found / seen / lost (0–23). */
  hour: number
  description: string
  /** Where the animal is now (found reports). */
  now: string | null
  /** A real photo under public/ (e.g. "/assets/reports/F-2101.jpg"); without one the API serves an illustration. */
  photo?: string
}

/** Neighbourhoods the demo knows, with an approximate centre and other spellings (Russian). */
export const AREAS = {
  alfama: { name: "Alfama", city: "Lisbon", ll: [38.7114, -9.1306], aka: "Алфама|Альфама" },
  baixa: { name: "Baixa", city: "Lisbon", ll: [38.7108, -9.1371], aka: "Байша|Байxa" },
  chiado: { name: "Chiado", city: "Lisbon", ll: [38.7107, -9.1424], aka: "Шиаду|Шиадо|Чиадо" },
  "bairro-alto": { name: "Bairro Alto", city: "Lisbon", ll: [38.7128, -9.1457], aka: "Байру-Алту|Байро Альто|Байру Алту" },
  "principe-real": { name: "Príncipe Real", city: "Lisbon", ll: [38.7167, -9.1484], aka: "Принсипи-Реал|Принсипе Реал|Принсипи Реал" },
  estrela: { name: "Estrela", city: "Lisbon", ll: [38.7134, -9.1597], aka: "Эштрела|Эстрела|Эштрэла" },
  "campo-de-ourique": { name: "Campo de Ourique", city: "Lisbon", ll: [38.7178, -9.1668], aka: "Кампу-ди-Орики|Кампо де Орике|Кампу де Орики" },
  alcantara: { name: "Alcântara", city: "Lisbon", ll: [38.7046, -9.1771], aka: "Алкантара" },
  belem: { name: "Belém", city: "Lisbon", ll: [38.6979, -9.2064], aka: "Белен|Белем" },
  graca: { name: "Graça", city: "Lisbon", ll: [38.7169, -9.1307], aka: "Граса|Граса" },
  arroios: { name: "Arroios", city: "Lisbon", ll: [38.7276, -9.1366], aka: "Арройуш|Арройос" },
  "avenidas-novas": { name: "Avenidas Novas", city: "Lisbon", ll: [38.7372, -9.1477], aka: "Авенидаш-Новаш|Авенидас Новас" },
  alvalade: { name: "Alvalade", city: "Lisbon", ll: [38.7517, -9.1408], aka: "Алваладе" },
  benfica: { name: "Benfica", city: "Lisbon", ll: [38.7506, -9.2003], aka: "Бенфика" },
  "parque-das-nacoes": { name: "Parque das Nações", city: "Lisbon", ll: [38.7681, -9.0947], aka: "Парк наций|Парке-даш-Насоеш|Парк Наций" },
  ribeira: { name: "Ribeira", city: "Porto", ll: [41.1406, -8.6131], aka: "Рибейра" },
  boavista: { name: "Boavista", city: "Porto", ll: [41.1579, -8.6291], aka: "Боавишта|Боависта" },
} satisfies Record<string, { name: string; city: string; ll: LatLng; aka: string }>

export type AreaKey = keyof typeof AREAS

const r = (x: Omit<PetReport, "breed" | "name" | "sex" | "age" | "marks" | "collar" | "chip" | "now"> & Partial<PetReport>): PetReport => ({
  breed: null,
  name: null,
  sex: null,
  age: null,
  marks: null,
  collar: null,
  chip: null,
  now: null,
  ...x,
})

export const REPORTS: PetReport[] = [
  /* ---------- found dogs ---------- */
  r({ id: "F-2101", status: "found", species: "dog", breed: "Dachshund mix", colour: "brown", coat: "reddish brown, smooth", size: "small", sex: "male", age: "adult", marks: "white patch on the chest", collar: "red collar, no tag", chip: "No chip found", area: "estrela", place: "Jardim da Estrela", daysAgo: 0, hour: 8, description: "Friendly small dog running around the park pond, came when called. Seemed well fed.", now: "With the finder, waiting for the owner" }),
  r({ id: "F-2102", status: "found", species: "dog", breed: "Labrador", colour: "cream", coat: "cream / light yellow", size: "large", sex: "female", age: "about 5 years", collar: "blue harness", chip: "Chip read by a vet", area: "campo-de-ourique", place: "Mercado de Campo de Ourique", daysAgo: 1, hour: 18, description: "Calm large dog waiting outside the market for hours. Vet read a chip but the owner's details are out of date.", now: "At a partner vet (demo)" }),
  r({ id: "F-2103", status: "found", species: "dog", breed: "Mixed breed", colour: "black", coat: "black, short hair", size: "medium", sex: "male", age: "young", marks: "one ear up, one down", area: "arroios", place: "Jardim Constantino", daysAgo: 0, hour: 7, description: "Black medium dog found tied to a bench in the morning, very sweet.", now: "With the finder" }),
  r({ id: "F-2104", status: "found", species: "dog", breed: "Yorkshire Terrier", colour: "brown", coat: "tan and steel grey, long", size: "small", sex: "female", age: "senior", marks: "pink bow in the hair", collar: "pink collar with a bell", chip: "Not checked yet", area: "chiado", place: "Praça Luís de Camões", daysAgo: 2, hour: 21, description: "Tiny dog trembling near the tram stop at night. Groomed, clearly someone's pet.", now: "With the finder" }),
  r({ id: "F-2105", status: "found", species: "dog", breed: "Podengo", colour: "ginger", coat: "ginger, short", size: "medium", sex: "male", age: "adult", marks: "scar on the left back leg", area: "graca", place: "Miradouro da Graça", daysAgo: 4, hour: 10, description: "Lean ginger dog, shy at first, then friendly. Limps a little.", now: "At the city shelter (demo)" }),
  r({ id: "F-2106", status: "found", species: "dog", breed: "French Bulldog", colour: "grey", coat: "blue-grey", size: "small", sex: "male", age: "about 2 years", collar: "black collar, tag worn off", chip: "No chip found", area: "principe-real", place: "Jardim do Príncipe Real", daysAgo: 1, hour: 13, description: "Snorty little bulldog sitting under the big cedar tree.", now: "With the finder" }),
  r({ id: "F-2107", status: "found", species: "dog", breed: "Border Collie", colour: "black", coat: "black and white", size: "medium", sex: "female", age: "adult", marks: "white tip on the tail", area: "belem", place: "Jardim de Belém", daysAgo: 3, hour: 16, description: "Very smart collie herding pigeons. Responds to 'sit' and 'down'.", now: "With the finder" }),
  r({ id: "F-2108", status: "found", species: "dog", breed: "Mixed breed", colour: "brown", coat: "dark brown, curly", size: "small", sex: null, age: "puppy", area: "alvalade", place: "Jardim do Campo Grande", daysAgo: 0, hour: 15, description: "Small curly brown puppy, about 4 months, playful.", now: "With the finder" }),
  r({ id: "F-2109", status: "found", species: "dog", breed: "German Shepherd", colour: "brown", coat: "black and tan", size: "large", sex: "male", age: "adult", collar: "chain collar", chip: "Chip read by a vet", area: "benfica", place: "Parque Silva Porto", daysAgo: 6, hour: 9, description: "Large shepherd, well trained, a little anxious with traffic.", now: "At a partner vet (demo)" }),
  r({ id: "F-2110", status: "found", species: "dog", breed: "Beagle", colour: "brown", coat: "tricolour: brown, black and white", size: "medium", sex: "female", age: "adult", area: "parque-das-nacoes", place: "Jardins Garcia de Orta", daysAgo: 2, hour: 19, description: "Beagle following people around the riverside, nose to the ground.", now: "With the finder" }),
  r({ id: "F-2111", status: "found", species: "dog", breed: "Chihuahua", colour: "cream", coat: "cream / fawn, short", size: "small", sex: "female", age: "adult", collar: "rhinestone collar", area: "avenidas-novas", place: "Jardim Gulbenkian", daysAgo: 12, hour: 11, description: "Tiny fawn dog found near the pond, a bit cold.", now: "At the city shelter (demo)" }),
  r({ id: "F-2112", status: "found", species: "dog", breed: "Mixed breed", colour: "white", coat: "white with a few beige spots", size: "medium", sex: "male", age: "young", area: "alcantara", place: "LX Factory", daysAgo: 1, hour: 22, description: "White dog wandering between the restaurants late at night, very social.", now: "With the finder" }),
  r({ id: "F-2113", status: "found", species: "dog", breed: "Golden Retriever", colour: "ginger", coat: "golden", size: "large", sex: "female", age: "about 7 years", collar: "green collar", chip: "Not checked yet", area: "estrela", place: "Basílica da Estrela", daysAgo: 35, hour: 12, description: "Golden retriever found a month ago, still waiting for the owner.", now: "In a foster home (demo)" }),
  r({ id: "F-2114", status: "found", species: "dog", breed: "Dachshund", colour: "brown", coat: "red, smooth", size: "small", sex: "male", age: "adult", marks: "grey muzzle", area: "ribeira", place: "Cais da Ribeira", daysAgo: 1, hour: 17, description: "Small red dachshund by the river in Porto.", now: "With the finder" }),

  /* ---------- found cats ---------- */
  r({ id: "F-2201", status: "found", species: "cat", breed: null, colour: "ginger", coat: "ginger tabby", size: "small", sex: "male", age: "young", marks: "white socks", area: "arroios", place: "Mercado de Arroios", daysAgo: 0, hour: 9, description: "Ginger cat meowing at the market door, very affectionate.", now: "With the finder" }),
  r({ id: "F-2202", status: "found", species: "cat", breed: "Siamese", colour: "cream", coat: "cream with dark points", size: "small", sex: "female", age: "adult", marks: "blue eyes", collar: "purple collar", area: "principe-real", place: "Rua da Escola Politécnica", daysAgo: 1, hour: 20, description: "Siamese cat on a car roof, scared but not aggressive.", now: "With the finder" }),
  r({ id: "F-2203", status: "found", species: "cat", breed: null, colour: "black", coat: "black, short", size: "medium", sex: null, age: "adult", marks: "small notch in the right ear", area: "alfama", place: "Largo do Chafariz de Dentro", daysAgo: 3, hour: 23, description: "Black cat hiding in a doorway, eats well.", now: "With the finder" }),
  r({ id: "F-2204", status: "found", species: "cat", breed: "British Shorthair", colour: "grey", coat: "blue-grey, dense", size: "medium", sex: "male", age: "adult", chip: "Chip read by a vet", area: "campo-de-ourique", place: "Jardim da Parada", daysAgo: 2, hour: 14, description: "Round grey cat, very calm, clearly an indoor cat.", now: "At a partner vet (demo)" }),
  r({ id: "F-2205", status: "found", species: "cat", breed: null, colour: "white", coat: "white", size: "small", sex: "female", age: "kitten", marks: "odd eyes (one blue, one green)", area: "graca", place: "Largo da Graça", daysAgo: 0, hour: 12, description: "White kitten with odd eyes, about 3 months.", now: "With the finder" }),
  r({ id: "F-2206", status: "found", species: "cat", breed: null, colour: "grey", coat: "grey tabby", size: "small", sex: "female", age: "adult", area: "benfica", place: "Estrada de Benfica (bus stop)", daysAgo: 8, hour: 7, description: "Tabby cat sheltering at a bus stop in the rain.", now: "At the city shelter (demo)" }),
  r({ id: "F-2207", status: "found", species: "cat", breed: "Maine Coon", colour: "brown", coat: "brown tabby, long", size: "large", sex: "male", age: "adult", collar: "tag with a first name only: 'Tobias'", name: "Tobias", area: "boavista", place: "Parque da Cidade (Porto)", daysAgo: 1, hour: 10, description: "Huge fluffy cat, very friendly, tag says Tobias.", now: "With the finder" }),

  /* ---------- found / sighted others ---------- */
  r({ id: "F-2301", status: "found", species: "bird", breed: "Lovebird", colour: "green", coat: "green with a peach face", size: "small", area: "estrela", place: "Jardim da Estrela", daysAgo: 2, hour: 11, description: "Small parrot landed on a café table, tame, steps onto a finger.", now: "With the finder" }),
  r({ id: "F-2302", status: "found", species: "rabbit", breed: "Dwarf lop", colour: "white", coat: "white with grey ears", size: "small", area: "alvalade", place: "Avenida da Igreja", daysAgo: 1, hour: 18, description: "Pet rabbit hopping under parked cars.", now: "With the finder" }),

  /* ---------- sightings (seen, not caught) ---------- */
  r({ id: "S-3101", status: "sighted", species: "dog", breed: "Dachshund", colour: "brown", coat: "reddish brown", size: "small", marks: "red collar", collar: "red collar", area: "campo-de-ourique", place: "Rua Ferreira Borges", daysAgo: 0, hour: 9, description: "Small red-brown dog with a red collar running towards Estrela. Couldn't catch it.", now: "Last seen heading east" }),
  r({ id: "S-3102", status: "sighted", species: "dog", breed: null, colour: "black", coat: "black", size: "large", area: "alcantara", place: "Doca de Santo Amaro", daysAgo: 1, hour: 6, description: "Big black dog without collar near the docks at dawn.", now: null }),
  r({ id: "S-3103", status: "sighted", species: "cat", breed: null, colour: "ginger", coat: "ginger", size: "medium", area: "graca", place: "Rua da Graça", daysAgo: 1, hour: 22, description: "Ginger cat on the rooftops, seen two nights in a row.", now: null }),
  r({ id: "S-3104", status: "sighted", species: "dog", breed: "Jack Russell", colour: "white", coat: "white with brown patches", size: "small", area: "belem", place: "Torre de Belém", daysAgo: 0, hour: 17, description: "Jack Russell running along the river, no owner around.", now: "Running west" }),
  r({ id: "S-3105", status: "sighted", species: "dog", breed: null, colour: "cream", coat: "cream, fluffy", size: "medium", area: "parque-das-nacoes", place: "Oceanário", daysAgo: 3, hour: 8, description: "Fluffy cream dog near the Oceanarium, looked lost.", now: null }),

  /* ---------- other people's lost pets ---------- */
  r({ id: "L-4101", status: "lost", species: "dog", breed: "Pug", name: "Pip", colour: "cream", coat: "fawn with a black mask", size: "small", sex: "male", age: "4 years", collar: "yellow collar", chip: "Chipped", area: "baixa", place: "Praça do Comércio", daysAgo: 2, hour: 19, description: "Pip slipped his leash during the evening walk. Snores, loves people.", now: null }),
  r({ id: "L-4102", status: "lost", species: "cat", breed: null, name: "Migas", colour: "grey", coat: "grey tabby", size: "small", sex: "female", age: "3 years", marks: "white chin", area: "arroios", place: "Rua de Arroios", daysAgo: 5, hour: 23, description: "Indoor cat, escaped through a window. Very shy.", now: null }),
  r({ id: "L-4103", status: "lost", species: "dog", breed: "Husky", name: "Neve", colour: "white", coat: "white and grey", size: "large", sex: "female", age: "2 years", marks: "blue eyes", collar: "orange harness", chip: "Chipped", area: "benfica", place: "Parque Florestal de Monsanto", daysAgo: 1, hour: 16, description: "Ran after a rabbit in Monsanto forest.", now: null }),
  r({ id: "L-4104", status: "lost", species: "bird", breed: "Cockatiel", name: "Kiwi", colour: "grey", coat: "grey with a yellow crest", size: "small", area: "alvalade", place: "Avenida de Roma", daysAgo: 3, hour: 10, description: "Flew out of the balcony, whistles a tune.", now: null }),

  /* ---------- reunited (closed) ---------- */
  r({ id: "R-5101", status: "reunited", species: "dog", breed: "Mixed breed", name: "Bolacha", colour: "brown", coat: "light brown", size: "medium", area: "alfama", place: "Miradouro de Santa Luzia", daysAgo: 9, hour: 15, description: "Found by a neighbour two streets away, back home after one night.", now: "Back home" }),
  r({ id: "R-5102", status: "reunited", species: "cat", breed: null, name: "Fumo", colour: "dark grey", coat: "dark grey", size: "medium", area: "estrela", place: "Rua de São Bento", daysAgo: 14, hour: 21, description: "Was hiding in the building's basement for three days.", now: "Back home" }),
]
