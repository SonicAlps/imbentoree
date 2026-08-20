export const products = {
  "Pouch": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 750,
  },

  "Small Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1500,
  },

  "Big Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 2000,
  },
} as const;

export type ProductName = keyof typeof products;