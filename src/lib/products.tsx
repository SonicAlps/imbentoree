export const products = {
  "Pouch": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 750,
  },

  "Small Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1499,
  },

  "Big Sling": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green"],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green", "Orange", "Red"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1999,
  },
  
  "Handbag": {
    outerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green", "Grass green", "Light Blue", ],
    innerFabric: ["Black", "Army Green", "Red", "Dark Pink", "Orange", "Neon Green", "Grass green", "Light Blue", ],
    strapSize: ["1 inch", "1.5 inch", "Paracord"],
    strapColor: ["Black","Army Green", "Orange", "Red", "Pink"],
    mountingType: ["Sling Hook", "Buckle"],
    basePrice: 1999,
  },




} as const;

export type ProductName = keyof typeof products;