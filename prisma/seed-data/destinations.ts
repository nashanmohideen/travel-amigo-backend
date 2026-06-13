// Copied from travel-amigo/data/destinations.ts (Phase 0 mock data → DB seed).
import type { Destination } from "./types";

export const destinations: Destination[] = [
  {
    id: "sigiriya",
    name: "Sigiriya",
    region: "cultural",
    description:
      "The iconic Lion Rock fortress rising 200m from the jungle. A UNESCO World Heritage Site and one of Sri Lanka's most photographed landmarks.",
    highlights: [
      "Ancient rock fortress",
      "Frescoes & Mirror Wall",
      "Panoramic views",
      "Archaeological gardens",
    ],
    bestFor: ["history", "photography", "adventure"],
    emoji: "🏰",
  },
  {
    id: "kandy",
    name: "Kandy",
    region: "cultural",
    description:
      "Sri Lanka's cultural capital nestled in the hill country. Home to the sacred Temple of the Tooth Relic and vibrant Kandyan dance.",
    highlights: [
      "Temple of the Tooth",
      "Royal Botanical Gardens",
      "Kandyan dance shows",
      "Kandy Lake",
    ],
    bestFor: ["culture", "religion", "nature"],
    emoji: "🛕",
  },
  {
    id: "ella",
    name: "Ella",
    region: "hill-country",
    description:
      "A misty hill-country village surrounded by tea plantations, waterfalls, and the famous Nine Arch Bridge. Perfect for slow travel.",
    highlights: [
      "Nine Arch Bridge",
      "Little Adam's Peak hike",
      "Ella Rock",
      "Tea factory tours",
    ],
    bestFor: ["hiking", "photography", "relaxation"],
    emoji: "🍵",
  },
  {
    id: "unawatuna",
    name: "Unawatuna",
    region: "coast",
    description:
      "A golden-sand bay on the south coast with calm turquoise waters, beachside restaurants, and laid-back vibes.",
    highlights: [
      "Curved sandy beach",
      "Snorkeling",
      "Japanese Peace Pagoda",
      "Beachside dining",
    ],
    bestFor: ["beach", "swimming", "relaxation"],
    emoji: "🏖️",
  },
  {
    id: "yala",
    name: "Yala National Park",
    region: "wildlife",
    description:
      "Sri Lanka's most visited national park with the highest concentration of leopards in the world, plus elephants, crocodiles, and hundreds of bird species.",
    highlights: [
      "Leopard sightings",
      "Wild elephants",
      "Crocodiles & birds",
      "Sunrise safaris",
    ],
    bestFor: ["wildlife", "photography", "adventure"],
    emoji: "🐆",
  },
  {
    id: "galle",
    name: "Galle Fort",
    region: "coast",
    description:
      "A perfectly preserved 17th-century Dutch colonial fort on the southern tip. Boutique hotels, art galleries, and rampart sunsets.",
    highlights: [
      "Colonial Dutch fort",
      "Rampart walks",
      "Artisan boutiques",
      "Sunset views",
    ],
    bestFor: ["history", "culture", "photography"],
    emoji: "⚓",
  },
  {
    id: "nuwara-eliya",
    name: "Nuwara Eliya",
    region: "hill-country",
    description:
      "Little England at 1,868m altitude — cool climate, colonial bungalows, manicured tea estates, and strawberry farms.",
    highlights: [
      "Tea estate tours",
      "Gregory Lake",
      "Victoria Park",
      "Colonial architecture",
    ],
    bestFor: ["nature", "tea", "relaxation"],
    emoji: "🌿",
  },
  {
    id: "mirissa",
    name: "Mirissa",
    region: "coast",
    description:
      "The whale-watching capital of Sri Lanka with a crescent beach, coconut-tree beach bars, and epic blue whale encounters.",
    highlights: [
      "Blue whale watching",
      "Parrot Rock",
      "Surf lessons",
      "Beach sunsets",
    ],
    bestFor: ["beach", "wildlife", "adventure"],
    emoji: "🐋",
  },
  {
    id: "colombo",
    name: "Colombo",
    region: "coast",
    description:
      "Sri Lanka's vibrant capital blends Dutch colonial heritage with gleaming glass towers, street food markets, and the lively Pettah bazaar.",
    highlights: [
      "Galle Face Green",
      "Gangaramaya Temple",
      "Pettah market",
      "Dutch Hospital District",
    ],
    bestFor: ["food", "culture", "shopping"],
    emoji: "🏙️",
  },
];
