import type { StoreBrand } from "./grocery-stores.ts";

export type StapleProduct = {
  brand: StoreBrand;
  name: string;
  sizeLabel: string;
  priceCad: number;
  grams?: number;
  ml?: number;
  each?: number;
  url?: string;
  imageUrl?: string;
  productId?: string;
  unitHint?: string;
  inStock?: boolean;
};


export type Staple = {
  keys: string[];
  gramsPerCup?: number;
  products: StapleProduct[];
};

function p(brand: StoreBrand, name: string, sizeLabel: string, priceCad: number, amount: Partial<StapleProduct> = {}): StapleProduct {
  return { brand, name, sizeLabel, priceCad, ...amount };
}

/** Ordinary Canadian grocery packs — used to pick the cheapest size that still covers dinner. */
export const STAPLES: Staple[] = [
  {
    keys: ["panko", "panko breadcrumbs", "panko bread crumbs", "panko crumb"],
    gramsPerCup: 50,
    products: [
      p("superstore", "No Name Panko Bread Crumbs", "227 g", 2.79, { grams: 227 }),
      p("superstore", "President's Choice Panko Bread Crumbs", "425 g", 4.49, { grams: 425 }),
      p("superstore", "Kikkoman Panko", "227 g", 5.49, { grams: 227 }),
      p("walmart", "Great Value Panko Bread Crumbs", "227 g", 2.47, { grams: 227 }),
      p("walmart", "Kikkoman Panko", "227 g", 4.97, { grams: 227 }),
      p("sobeys", "Compliments Panko Bread Crumbs", "227 g", 2.99, { grams: 227 }),
      p("sobeys", "Kikkoman Panko", "227 g", 5.29, { grams: 227 }),
      p("independent", "No Name Panko Bread Crumbs", "227 g", 2.79, { grams: 227 }),
    ],
  },
  {
    keys: ["breadcrumbs", "bread crumbs", "dry breadcrumbs"],
    gramsPerCup: 100,
    products: [
      p("superstore", "No Name Plain Bread Crumbs", "425 g", 2.29, { grams: 425 }),
      p("walmart", "Great Value Bread Crumbs", "425 g", 2.17, { grams: 425 }),
      p("sobeys", "Compliments Bread Crumbs", "425 g", 2.49, { grams: 425 }),
    ],
  },
  {
    keys: ["pasta", "spaghetti", "linguine", "penne"],
    gramsPerCup: 90,
    products: [
      p("superstore", "No Name Spaghetti", "900 g", 2.49, { grams: 900 }),
      p("superstore", "No Name Spaghetti", "454 g", 1.67, { grams: 454 }),
      p("walmart", "Great Value Spaghetti", "900 g", 2.27, { grams: 900 }),
      p("walmart", "Great Value Spaghetti", "450 g", 1.47, { grams: 450 }),
      p("sobeys", "Compliments Spaghetti", "900 g", 2.69, { grams: 900 }),
    ],
  },
  {
    keys: ["milk", "2% milk", "whole milk"],
    products: [
      p("superstore", "Beatrice 2% Milk", "2 L", 4.69, { ml: 2000 }),
      p("superstore", "Beatrice 2% Milk", "1 L", 2.89, { ml: 1000 }),
      p("walmart", "Great Value 2% Milk", "2 L", 4.47, { ml: 2000 }),
      p("sobeys", "Farmers 2% Milk", "2 L", 4.79, { ml: 2000 }),
    ],
  },
  {
    keys: ["eggs", "large eggs"],
    products: [
      p("superstore", "No Name Large Eggs", "12 ea", 4.29, { each: 12 }),
      p("superstore", "No Name Large Eggs", "6 ea", 2.79, { each: 6 }),
      p("walmart", "Great Value Large Eggs", "12 ea", 3.97, { each: 12 }),
      p("sobeys", "Compliments Large Eggs", "12 ea", 4.49, { each: 12 }),
    ],
  },
  {
    keys: ["butter"],
    gramsPerCup: 227,
    products: [
      p("superstore", "No Name Salted Butter", "454 g", 5.99, { grams: 454 }),
      p("walmart", "Great Value Salted Butter", "454 g", 5.47, { grams: 454 }),
      p("sobeys", "Compliments Salted Butter", "454 g", 6.29, { grams: 454 }),
    ],
  },
  {
    keys: ["onion", "yellow onion", "onions"],
    gramsPerCup: 160,
    products: [
      p("superstore", "Yellow Onions", "3 lb bag", 3.79, { grams: 1360 }),
      p("superstore", "Yellow Onion", "1 ea", 1.29, { each: 1 }),
      p("walmart", "Yellow Onions", "3 lb bag", 3.47, { grams: 1360 }),
      p("sobeys", "Yellow Onions", "3 lb bag", 3.99, { grams: 1360 }),
    ],
  },
  {
    keys: ["garlic"],
    products: [
      p("superstore", "Garlic", "3 count", 1.99, { each: 3 }),
      p("walmart", "Garlic", "3 count", 1.67, { each: 3 }),
      p("sobeys", "Garlic", "3 count", 2.29, { each: 3 }),
    ],
  },
  {
    keys: ["baby spinach", "spinach"],
    gramsPerCup: 30,
    products: [
      p("superstore", "Baby Spinach", "142 g", 3.49, { grams: 142 }),
      p("superstore", "Baby Spinach", "312 g", 4.99, { grams: 312 }),
      p("walmart", "Baby Spinach", "142 g", 3.27, { grams: 142 }),
      p("sobeys", "Compliments Baby Spinach", "142 g", 3.69, { grams: 142 }),
    ],
  },
  {
    keys: ["tomato sauce", "pasta sauce", "marinara"],
    gramsPerCup: 250,
    products: [
      p("superstore", "No Name Tomato Sauce", "680 ml", 1.79, { ml: 680 }),
      p("superstore", "President's Choice Tomato Basil Sauce", "650 ml", 3.49, { ml: 650 }),
      p("walmart", "Great Value Tomato Sauce", "680 ml", 1.47, { ml: 680 }),
      p("sobeys", "Compliments Tomato Sauce", "680 ml", 1.89, { ml: 680 }),
    ],
  },
  {
    keys: ["canned tomatoes", "diced tomatoes", "crushed tomatoes"],
    gramsPerCup: 240,
    products: [
      p("superstore", "No Name Diced Tomatoes", "796 ml", 1.69, { ml: 796 }),
      p("walmart", "Great Value Diced Tomatoes", "796 ml", 1.47, { ml: 796 }),
      p("sobeys", "Compliments Diced Tomatoes", "796 ml", 1.79, { ml: 796 }),
    ],
  },
  {
    keys: ["chicken broth", "chicken stock", "broth"],
    products: [
      p("superstore", "No Name Chicken Broth", "900 ml", 1.79, { ml: 900 }),
      p("walmart", "Great Value Chicken Broth", "900 ml", 1.47, { ml: 900 }),
      p("sobeys", "Compliments Chicken Broth", "900 ml", 1.99, { ml: 900 }),
    ],
  },
  {
    keys: ["chicken breast", "chicken"],
    gramsPerCup: 140,
    products: [
      p("superstore", "Boneless Skinless Chicken Breast", "per tray ~500 g", 9.5, { grams: 500 }),
      p("walmart", "Boneless Chicken Breast", "per tray ~500 g", 8.97, { grams: 500 }),
      p("sobeys", "Chicken Breast Boneless", "per tray ~500 g", 9.99, { grams: 500 }),
    ],
  },
  {
    keys: ["ground beef", "beef"],
    gramsPerCup: 220,
    products: [
      p("superstore", "Lean Ground Beef", "per tray ~500 g", 7.5, { grams: 500 }),
      p("walmart", "Lean Ground Beef", "per tray ~500 g", 6.97, { grams: 500 }),
      p("sobeys", "Lean Ground Beef", "per tray ~500 g", 7.99, { grams: 500 }),
    ],
  },
  {
    keys: ["bacon"],
    products: [
      p("superstore", "No Name Bacon", "375 g", 6.99, { grams: 375 }),
      p("walmart", "Great Value Bacon", "375 g", 6.47, { grams: 375 }),
      p("sobeys", "Compliments Bacon", "375 g", 7.29, { grams: 375 }),
    ],
  },
  {
    keys: ["shrimp", "raw shrimp"],
    gramsPerCup: 120,
    products: [
      p("superstore", "Raw Shrimp", "340 g", 8.99, { grams: 340 }),
      p("walmart", "Raw Shrimp", "340 g", 7.97, { grams: 340 }),
      p("sobeys", "Raw Shrimp", "340 g", 9.49, { grams: 340 }),
    ],
  },
  {
    keys: ["rice", "white rice"],
    gramsPerCup: 185,
    products: [
      p("superstore", "No Name Long Grain Rice", "2 kg", 4.99, { grams: 2000 }),
      p("walmart", "Great Value Long Grain Rice", "2 kg", 4.47, { grams: 2000 }),
      p("sobeys", "Compliments Long Grain Rice", "2 kg", 5.29, { grams: 2000 }),
    ],
  },
  {
    keys: ["flour", "all purpose flour", "all-purpose flour"],
    gramsPerCup: 125,
    products: [
      p("superstore", "No Name All Purpose Flour", "2.5 kg", 4.99, { grams: 2500 }),
      p("walmart", "Great Value All Purpose Flour", "2.5 kg", 4.47, { grams: 2500 }),
      p("sobeys", "Compliments All Purpose Flour", "2.5 kg", 5.29, { grams: 2500 }),
    ],
  },
  {
    keys: ["sugar", "white sugar"],
    gramsPerCup: 200,
    products: [
      p("superstore", "No Name Granulated Sugar", "2 kg", 3.49, { grams: 2000 }),
      p("walmart", "Great Value Granulated Sugar", "2 kg", 3.17, { grams: 2000 }),
      p("sobeys", "Compliments Granulated Sugar", "2 kg", 3.69, { grams: 2000 }),
    ],
  },
  {
    keys: ["olive oil", "oil"],
    products: [
      p("superstore", "No Name Olive Oil", "500 ml", 6.99, { ml: 500 }),
      p("walmart", "Great Value Olive Oil", "500 ml", 6.47, { ml: 500 }),
      p("sobeys", "Compliments Olive Oil", "500 ml", 7.49, { ml: 500 }),
    ],
  },
  {
    keys: ["cheddar", "cheddar cheese", "cheese"],
    gramsPerCup: 110,
    products: [
      p("superstore", "No Name Cheddar", "400 g", 5.99, { grams: 400 }),
      p("walmart", "Great Value Cheddar", "400 g", 5.47, { grams: 400 }),
      p("sobeys", "Compliments Cheddar", "400 g", 6.29, { grams: 400 }),
    ],
  },
  {
    keys: ["parmesan", "parmesan cheese"],
    gramsPerCup: 90,
    products: [
      p("superstore", "No Name Parmesan", "250 g", 5.49, { grams: 250 }),
      p("walmart", "Great Value Parmesan", "250 g", 4.97, { grams: 250 }),
      p("sobeys", "Compliments Parmesan", "250 g", 5.79, { grams: 250 }),
    ],
  },
  {
    keys: ["yogurt", "greek yogurt"],
    gramsPerCup: 245,
    products: [
      p("superstore", "Iögo Greek Yogurt", "650 g", 5.49, { grams: 650 }),
      p("walmart", "Great Value Greek Yogurt", "650 g", 4.97, { grams: 650 }),
      p("sobeys", "Iögo Greek Yogurt", "650 g", 5.69, { grams: 650 }),
    ],
  },
  {
    keys: ["sour cream"],
    gramsPerCup: 240,
    products: [
      p("superstore", "No Name Sour Cream", "500 ml", 3.29, { ml: 500 }),
      p("walmart", "Great Value Sour Cream", "500 ml", 2.97, { ml: 500 }),
      p("sobeys", "Compliments Sour Cream", "500 ml", 3.49, { ml: 500 }),
    ],
  },
  {
    keys: ["heavy cream", "whipping cream", "cream"],
    products: [
      p("superstore", "Beatrice 35% Whipping Cream", "473 ml", 4.49, { ml: 473 }),
      p("walmart", "Great Value Whipping Cream", "473 ml", 4.17, { ml: 473 }),
      p("sobeys", "Farmers Whipping Cream", "473 ml", 4.69, { ml: 473 }),
    ],
  },
  {
    keys: ["mayonnaise", "mayo"],
    products: [
      p("superstore", "No Name Mayonnaise", "890 ml", 4.99, { ml: 890 }),
      p("walmart", "Great Value Mayonnaise", "890 ml", 4.47, { ml: 890 }),
      p("sobeys", "Compliments Mayonnaise", "890 ml", 5.29, { ml: 890 }),
    ],
  },
  {
    keys: ["lemon", "lemons"],
    products: [
      p("superstore", "Lemon", "1 ea", 0.79, { each: 1 }),
      p("walmart", "Lemon", "1 ea", 0.67, { each: 1 }),
      p("sobeys", "Lemon", "1 ea", 0.89, { each: 1 }),
    ],
  },
  {
    keys: ["celery"],
    products: [
      p("superstore", "Celery", "1 bunch", 2.49, { each: 1 }),
      p("walmart", "Celery", "1 bunch", 2.27, { each: 1 }),
      p("sobeys", "Celery", "1 bunch", 2.69, { each: 1 }),
    ],
  },
  {
    keys: ["potato", "potatoes", "russet"],
    gramsPerCup: 150,
    products: [
      p("superstore", "Russet Potatoes", "5 lb bag", 4.99, { grams: 2268 }),
      p("walmart", "Russet Potatoes", "5 lb bag", 4.47, { grams: 2268 }),
      p("sobeys", "Russet Potatoes", "5 lb bag", 5.29, { grams: 2268 }),
    ],
  },
  {
    keys: ["carrot", "carrots"],
    gramsPerCup: 110,
    products: [
      p("superstore", "Carrots", "2 lb bag", 2.49, { grams: 907 }),
      p("walmart", "Carrots", "2 lb bag", 2.27, { grams: 907 }),
      p("sobeys", "Carrots", "2 lb bag", 2.69, { grams: 907 }),
    ],
  },
  {
    keys: ["bread", "sandwich bread"],
    products: [
      p("superstore", "No Name White Bread", "675 g", 2.49, { grams: 675 }),
      p("walmart", "Great Value White Bread", "675 g", 2.17, { grams: 675 }),
      p("sobeys", "Compliments White Bread", "675 g", 2.69, { grams: 675 }),
    ],
  },
  {
    keys: ["lobster", "live lobster", "live lobsters"],
    products: [
      p("superstore", "Live Lobster", "1 ea ~ 1.25 lb", 16.99, { each: 1 }),
      p("walmart", "Frozen Lobster Tails", "2 ea", 19.97, { each: 2 }),
      p("sobeys", "Live Lobster", "1 ea", 17.99, { each: 1 }),
    ],
  },
];
