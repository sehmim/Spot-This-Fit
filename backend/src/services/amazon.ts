import type { Product } from "@spotthisfit/shared";

/**
 * Mock Amazon PA-API service for Amazon.ca
 *
 * When real PA-API credentials are available, replace the mock implementation
 * with actual API calls using the Amazon Product Advertising API 5.0.
 *
 * Required env vars for real implementation:
 *   AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
 *
 * Marketplace: Amazon.ca (www.amazon.ca, region ca-east-1)
 */

export interface AmazonListing {
  asin: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
  seller: string;
}

// Realistic mock data keyed by category + keywords for the test video
// (person wearing: cap, navy jacket, white tee, crossbody bag, grey jeans, black loafers)
const MOCK_LISTINGS: Record<string, AmazonListing[]> = {
  cap: [
    {
      asin: "B0CK9N7R2X",
      title: "New Era 9FORTY Adjustable Structured Cap - Men's Classic Baseball Hat",
      price: 34.99,
      originalPrice: 42.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71YdWqLqHvL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CK9N7R2X?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 2847,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B09QK3BXML",
      title: "Nike Sportswear Heritage86 Futura Washed Cap - Unisex",
      price: 29.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61kT9QLJ+IL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B09QK3BXML?tag=spotthisfit-20",
      rating: 4.6,
      reviewCount: 5123,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  jacket: [
    {
      asin: "B0BXNKLP7Y",
      title: "Nike Sportswear Windrunner Full-Zip Jacket - Men's Navy/Black",
      price: 119.99,
      originalPrice: 140.0,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61BXqSqPURL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0BXNKLP7Y?tag=spotthisfit-20",
      rating: 4.4,
      reviewCount: 1283,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B0CS4NRJML",
      title: "The North Face Resolve 2 Waterproof Jacket - Men's Navy",
      price: 149.99,
      originalPrice: 179.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71E7i3xgfTL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CS4NRJML?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 8934,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  tshirt: [
    {
      asin: "B0CHT3H8RX",
      title: "Gildan Men's Crew T-Shirt - 100% Cotton White",
      price: 8.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61z2p7jRGrL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CHT3H8RX?tag=spotthisfit-20",
      rating: 4.3,
      reviewCount: 42567,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B07BKXBRNH",
      title: "Champion Men's Classic Graphic Tee - White Cotton",
      price: 24.99,
      originalPrice: 34.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71jbzd2JSWL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07BKXBRNH?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 15890,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  crossbody: [
    {
      asin: "B0BZK87NVL",
      title: "Nike Sportswear Essentials Crossbody Bag - Black",
      price: 34.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61FZqPH5lYL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0BZK87NVL?tag=spotthisfit-20",
      rating: 4.6,
      reviewCount: 3421,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B0CNBK8R3M",
      title: "Carhartt Crossbody Zip Bag - Water Resistant",
      price: 44.99,
      originalPrice: 54.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71+gn3KWOYL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CNBK8R3M?tag=spotthisfit-20",
      rating: 4.7,
      reviewCount: 6782,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  jeans: [
    {
      asin: "B07H3QCC1W",
      title: "Levi's Men's 501 Original Fit Jeans - Light Stonewash",
      price: 69.99,
      originalPrice: 89.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71yP7WC6ZYL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07H3QCC1W?tag=spotthisfit-20",
      rating: 4.4,
      reviewCount: 24567,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B0BT3MKL8Q",
      title: "Wrangler Men's Relaxed Fit Jeans - Grey Wash",
      price: 44.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61KiHyb2p+L._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0BT3MKL8Q?tag=spotthisfit-20",
      rating: 4.3,
      reviewCount: 8934,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  loafers: [
    {
      asin: "B0CPMR42KL",
      title: "Bruno Marc Men's Penny Loafers - Black Leather Dress Shoes",
      price: 49.99,
      originalPrice: 64.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/61gHqYKMhvL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CPMR42KL?tag=spotthisfit-20",
      rating: 4.4,
      reviewCount: 12345,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B08YR6T9NH",
      title: "Cole Haan Men's Grand Ambition Slip-On Loafer - Black",
      price: 159.99,
      originalPrice: 199.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71dBvRz6VjL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B08YR6T9NH?tag=spotthisfit-20",
      rating: 4.3,
      reviewCount: 4567,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  sneakers: [
    {
      asin: "B07RZ6XNST",
      title: "Nike Air Force 1 '07 Men's Shoes - Triple White",
      price: 129.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71Gy5YhMOhL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07RZ6XNST?tag=spotthisfit-20",
      rating: 4.7,
      reviewCount: 34567,
      isPrime: true,
      seller: "Amazon.ca",
    },
    {
      asin: "B0BXNLP9QY",
      title: "adidas Men's Grand Court 2.0 Sneaker - Cloud White",
      price: 74.99,
      originalPrice: 95.0,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71EvJvvYBVL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0BXNLP9QY?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 18923,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  // Generic fallbacks
  top: [
    {
      asin: "B0CHT3H8RX",
      title: "Hanes Men's Essential Short Sleeve T-Shirt",
      price: 12.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71nwZE8cTcL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CHT3H8RX?tag=spotthisfit-20",
      rating: 4.4,
      reviewCount: 56789,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  bottom: [
    {
      asin: "B07PFHYD5Z",
      title: "Amazon Essentials Men's Classic-Fit Stretch Chino",
      price: 29.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71vv8vr5SSL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07PFHYD5Z?tag=spotthisfit-20",
      rating: 4.3,
      reviewCount: 34567,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  outerwear: [
    {
      asin: "B0B4M2RLKN",
      title: "Columbia Men's Watertight II Rain Jacket",
      price: 89.99,
      originalPrice: 119.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71vN+xLMusL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0B4M2RLKN?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 29876,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  shoes: [
    {
      asin: "B07N4NCSXY",
      title: "Skechers Men's Afterburn Memory-Foam Sneaker",
      price: 59.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/81IRKXH7gPL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07N4NCSXY?tag=spotthisfit-20",
      rating: 4.5,
      reviewCount: 87654,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  bag: [
    {
      asin: "B07CKDKT7N",
      title: "Herschel Supply Co. Classic Crosshatch Backpack",
      price: 64.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/71Y7e7kUqBL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B07CKDKT7N?tag=spotthisfit-20",
      rating: 4.6,
      reviewCount: 12345,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
  accessory: [
    {
      asin: "B0CMR5N7QL",
      title: "Ray-Ban Classic Wayfarer Sunglasses - Black",
      price: 179.99,
      currency: "CAD",
      imageUrl: "https://m.media-amazon.com/images/I/41tyYpMVNaL._AC_SX679_.jpg",
      affiliateUrl: "https://www.amazon.ca/dp/B0CMR5N7QL?tag=spotthisfit-20",
      rating: 4.6,
      reviewCount: 23456,
      isPrime: true,
      seller: "Amazon.ca",
    },
  ],
};

// Keywords from search queries mapped to listing keys
const KEYWORD_TO_KEY: [RegExp, string][] = [
  [/cap|hat|beanie/i, "cap"],
  [/jacket|windrunner|windbreaker|bomber|zip.?up/i, "jacket"],
  [/t.?shirt|tee|crew.?neck/i, "tshirt"],
  [/crossbody|sling|messenger/i, "crossbody"],
  [/jean|denim/i, "jeans"],
  [/loafer|moccasin|slip.?on/i, "loafers"],
  [/sneaker|air.?force|air.?max|trainer|running.?shoe/i, "sneakers"],
];

function findListingKey(searchQuery: string, category: string): string {
  // Try keyword matching on the search query first
  for (const [pattern, key] of KEYWORD_TO_KEY) {
    if (pattern.test(searchQuery)) {
      return key;
    }
  }
  // Fall back to category
  return category;
}

/**
 * Search Amazon.ca for a product using the AI-generated search query.
 * Returns the best matching listing.
 *
 * MOCK implementation — returns realistic fake data.
 * Replace with real PA-API SearchItems call when credentials are ready.
 */
export async function searchAmazon(
  product: Product
): Promise<AmazonListing | null> {
  // Simulate network delay (200-600ms)
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));

  const key = findListingKey(product.searchQuery ?? product.name, product.category);
  const listings = MOCK_LISTINGS[key];

  if (!listings || listings.length === 0) {
    return null;
  }

  // Pick the first listing (best match) — real PA-API would rank by relevance
  return listings[0];
}

/**
 * Enrich a Product with Amazon listing data.
 * Returns a new Product with affiliate fields populated.
 */
export function enrichWithAmazon(
  product: Product,
  listing: AmazonListing
): Product {
  return {
    ...product,
    price: listing.price,
    originalPrice: listing.originalPrice,
    currency: listing.currency,
    imageUrl: listing.imageUrl,
    shopUrl: listing.affiliateUrl,
    affiliateUrl: listing.affiliateUrl,
    amazonAsin: listing.asin,
    amazonRating: listing.rating,
    amazonReviewCount: listing.reviewCount,
    amazonPrime: listing.isPrime,
    retailer: "Amazon.ca",
  };
}
