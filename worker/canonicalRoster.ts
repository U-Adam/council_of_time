// Runtime snapshot of the governing permanent membership in Project Sources
// 02 — Council Roster and 04 — Artists and Witnesses.
//
// This file is intentionally separate from source metadata so adding a source record
// cannot silently create a permanent Council seat. Any roster change must update the
// governing Drive source and this snapshot in the same change set.

export const CANONICAL_THINKERS = [
  "Plato",
  "Confucius",
  "Laozi",
  "Nāgārjuna",
  "V. F. Cordova",
  "Vine Deloria Jr.",
  "Kyle Powys Whyte",
  "Mary Graham",
  "Aileen Moreton-Robinson",
  "Tyson Yunkaporta",
  "Thomas Aquinas",
  "Maimonides",
  "Ibn Rushd",
  "Immanuel Kant",
  "Søren Kierkegaard",
  "John Stuart Mill",
  "W.E.B. Du Bois",
  "Hannah Arendt",
  "Simone de Beauvoir",
  "Albert Camus",
  "Viktor E. Frankl",
  "Albert Einstein",
  "Stephen Hawking",
  "Carl Sagan",
  "J. Robert Oppenheimer",
  "Baruch Spinoza",
  "Frantz Fanon",
  "James Baldwin",
  "Audre Lorde",
  "Michel Foucault",
  "Alan Watts",
  "Angela Davis",
  "bell hooks",
  "Judith Butler",
  "Cornel West",
  "Martha Nussbaum",
  "Friedrich Nietzsche",
  "John Rawls",
  "Karl Marx",
  "Adam Smith",
  "Sigmund Freud",
  "Charles Darwin",
  "William James",
  "George Orwell",
  "Toni Morrison",
  "Martin Luther King Jr.",
  "Carl G. Jung",
  "Richard Feynman",
  "Jane Goodall",
] as const;

export const CANONICAL_ARTIST_WITNESSES = [
  "Bob Dylan",
  "David Byrne",
  "Octavia E. Butler",
  "Leonard Cohen",
  "Frida Kahlo",
  "Jean-Michel Basquiat",
  "John Lennon",
  "Yoko Ono",
  "George Carlin",
  "Charles Bukowski",
  "Ursula K. Le Guin",
  "Dolly Parton",
  "Christopher Nolan",
  "Steven Spielberg",
  "Salvador Dalí",
  "Sam Shepard",
  "Toni Morrison",
  "John Steinbeck",
  "David Bowie",
  "Jordan Peele",
  "Mac Miller",
] as const;

export const CANONICAL_MODERATOR = "Anthony Bourdain" as const;

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const THINKERS = new Set(CANONICAL_THINKERS.map(normalize));
const ARTISTS = new Set(CANONICAL_ARTIST_WITNESSES.map(normalize));
const MODERATOR = normalize(CANONICAL_MODERATOR);

export function isCanonicalThinker(name: string) {
  return THINKERS.has(normalize(name));
}

export function isCanonicalArtistWitness(name: string) {
  return ARTISTS.has(normalize(name));
}

export function isCanonicalModerator(name: string) {
  return normalize(name) === MODERATOR;
}

export function isCanonicalPermanentParticipant(name: string) {
  return isCanonicalThinker(name) || isCanonicalArtistWitness(name) || isCanonicalModerator(name);
}
