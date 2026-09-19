export type SourceRole = "thinker" | "artist" | "moderator" | "case";

export type SourceMeta = {
  voice: string;
  family: string;
  role: SourceRole;
};

export const SOURCE_META: Record<string, SourceMeta> = {
  S1: { voice: "Plato", family: "ancient-greek", role: "thinker" },
  S2: { voice: "Plato", family: "ancient-greek", role: "thinker" },
  S3: { voice: "Confucius", family: "classical-chinese", role: "thinker" },
  S4: { voice: "Confucius", family: "classical-chinese", role: "thinker" },
  S5: { voice: "Immanuel Kant", family: "enlightenment-duty", role: "thinker" },
  S6: { voice: "Immanuel Kant", family: "enlightenment-duty", role: "thinker" },
  S7: { voice: "John Stuart Mill", family: "liberal-consequentialist", role: "thinker" },
  S8: { voice: "John Stuart Mill", family: "liberal-consequentialist", role: "thinker" },
  S9: { voice: "Hannah Arendt", family: "political-judgment", role: "thinker" },
  S10: { voice: "Simone de Beauvoir", family: "existential-feminist", role: "thinker" },
  S11: { voice: "Albert Camus", family: "existential", role: "thinker" },
  S12: { voice: "Søren Kierkegaard", family: "existential-religious", role: "thinker" },
  S13: { voice: "bell hooks", family: "feminist-relational", role: "thinker" },
  S14: { voice: "James Baldwin", family: "literary-moral", role: "thinker" },
  S15: { voice: "Michel Foucault", family: "power-genealogy", role: "thinker" },
  S16: { voice: "Frantz Fanon", family: "anticolonial", role: "thinker" },
  S17: { voice: "Martha Nussbaum", family: "capabilities", role: "thinker" },
  S18: { voice: "Nāgārjuna", family: "buddhist", role: "thinker" },
  S19: { voice: "Thomas Aquinas", family: "christian-medieval", role: "thinker" },
  S20: { voice: "Maimonides", family: "jewish-medieval", role: "thinker" },
  S21: { voice: "Ibn Rushd", family: "islamic-medieval", role: "thinker" },
  S22: { voice: "W.E.B. Du Bois", family: "black-political", role: "thinker" },
  S23: { voice: "Audre Lorde", family: "black-feminist", role: "thinker" },
  S24: { voice: "Alan Watts", family: "modern-interpreter", role: "thinker" },
  S25: { voice: "Angela Davis", family: "abolitionist", role: "thinker" },
  S26: { voice: "Judith Butler", family: "critical-feminist", role: "thinker" },
  S27: { voice: "Cornel West", family: "black-prophetic", role: "thinker" },
  S28: { voice: "Anthony Bourdain", family: "moderator", role: "moderator" },
  S29: { voice: "Anthony Bourdain", family: "moderator", role: "moderator" },
  S30: { voice: "Bob Dylan", family: "music-literature", role: "artist" },
  S31: { voice: "David Byrne", family: "music-multimedia", role: "artist" },
  S32: { voice: "Octavia E. Butler", family: "speculative-fiction", role: "artist" },
  S33: { voice: "Leonard Cohen", family: "music-poetry", role: "artist" },
  S34: { voice: "Frida Kahlo", family: "visual-art", role: "artist" },
  S35: { voice: "Jean-Michel Basquiat", family: "visual-art", role: "artist" },
  S36: { voice: "John Lennon", family: "music", role: "artist" },
  S37: { voice: "Yoko Ono", family: "conceptual-performance", role: "artist" },
  S38: { voice: "Winston Churchill", family: "case", role: "case" },
  S39: { voice: "Winston Churchill", family: "case", role: "case" },
  S40: { voice: "Laozi", family: "classical-daoist", role: "thinker" },
  S41: { voice: "V. F. Cordova", family: "indigenous-north-american", role: "thinker" },
  S42: { voice: "Vine Deloria Jr.", family: "indigenous-north-american", role: "thinker" },
  S43: { voice: "Kyle Powys Whyte", family: "indigenous-north-american", role: "thinker" },
  S44: { voice: "Mary Graham", family: "aboriginal-australian", role: "thinker" },
  S45: { voice: "Aileen Moreton-Robinson", family: "aboriginal-australian", role: "thinker" },
  S46: { voice: "Tyson Yunkaporta", family: "aboriginal-australian", role: "thinker" },
  S47: { voice: "Viktor E. Frankl", family: "existential-clinical", role: "thinker" },
  S48: { voice: "Albert Einstein", family: "science-physics", role: "thinker" },
  S49: { voice: "Stephen Hawking", family: "science-physics", role: "thinker" },
  S50: { voice: "Carl Sagan", family: "science-public", role: "thinker" },
  S51: { voice: "J. Robert Oppenheimer", family: "science-responsibility", role: "thinker" },
  S52: { voice: "Baruch Spinoza", family: "early-modern", role: "thinker" },
  S53: { voice: "Friedrich Nietzsche", family: "genealogy", role: "thinker" },
  S54: { voice: "John Rawls", family: "political-liberal", role: "thinker" },
  S55: { voice: "Karl Marx", family: "political-economy", role: "thinker" },
  S56: { voice: "Adam Smith", family: "moral-economy", role: "thinker" },
  S57: { voice: "Sigmund Freud", family: "psychoanalysis", role: "thinker" },
  S58: { voice: "Charles Darwin", family: "science-evolution", role: "thinker" },
  S59: { voice: "William James", family: "pragmatism", role: "thinker" },
  S60: { voice: "George Orwell", family: "literary-political", role: "thinker" },
  S61: { voice: "Toni Morrison", family: "literary-moral", role: "thinker" },
  S62: { voice: "Martin Luther King Jr.", family: "civil-rights", role: "thinker" },
  S63: { voice: "Carl G. Jung", family: "depth-psychology", role: "thinker" },
  S64: { voice: "Richard Feynman", family: "science-physics", role: "thinker" },
  S65: { voice: "Jane Goodall", family: "science-behavior", role: "thinker" },
  S66: { voice: "George Carlin", family: "comedy-performance", role: "artist" },
  S67: { voice: "Charles Bukowski", family: "literature-poetry", role: "artist" },
  S68: { voice: "Ursula K. Le Guin", family: "speculative-fiction", role: "artist" },
  S69: { voice: "Dolly Parton", family: "music-performance", role: "artist" },
  S70: { voice: "Christopher Nolan", family: "film", role: "artist" },
  S71: { voice: "Steven Spielberg", family: "film", role: "artist" },
  S72: { voice: "Salvador Dalí", family: "visual-art", role: "artist" },
  S73: { voice: "Sam Shepard", family: "theater-literature", role: "artist" },
  S74: { voice: "Toni Morrison", family: "literature", role: "artist" },
  S75: { voice: "John Steinbeck", family: "literature", role: "artist" },
  S76: { voice: "David Bowie", family: "music-performance", role: "artist" },
  S77: { voice: "Jordan Peele", family: "film-horror-satire", role: "artist" },
  S78: { voice: "Mac Miller", family: "music-hip-hop", role: "artist" },
  S79: { voice: "Kurt Vonnegut", family: "literature-satire", role: "artist" },
};

export function sourceMeta(id: string): SourceMeta | undefined {
  return SOURCE_META[id];
}

export function voiceForSource(id: string): string | undefined {
  return SOURCE_META[id]?.voice;
}

export function familyForSource(id: string): string | undefined {
  return SOURCE_META[id]?.family;
}
