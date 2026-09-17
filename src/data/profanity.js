const BAD_WORDS = [
  "ass", "asses", "asshole", "bastard", "bitch", "bitches", "bollocks",
  "bullshit", "cock", "cocks", "crap", "cum", "cunt", "damn", "dick",
  "dicks", "dildo", "douche", "dumbass", "fag", "fags", "fart", "fuck",
  "fucked", "fucker", "fucking", "fucks", "hell", "homo", "jackass",
  "jerk", "motherfucker", "nigga", "nigger", "piss", "prick", "pussy",
  "retard", "shit", "shits", "slut", "stupid", "twat", "whore",
  "wtf", "sex", "porn", "nude", "naked", "boob", "boobs", "penis",
  "vagina", "rape", "kill", "murder", "drug", "drugs", "weed", "cocaine",
];

export function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = lower.split(/\s+/);
  return words.some((word) => BAD_WORDS.includes(word));
}

export function getProfanityError(text) {
  if (containsProfanity(text)) {
    return "Please use appropriate language. Vulgar or offensive words are not allowed.";
  }
  return null;
}
