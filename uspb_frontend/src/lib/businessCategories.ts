/**
 * Business Categories and Standard Tariff Rates
 * Balangoda Urban Council — Health Division / Garbage Collection Fee Management
 *
 * Official gazetted categories and standard annual rates in Sri Lankan Rupees (LKR).
 * Categories 1–13 have standard established council fees.
 * Categories 14–35 are assessed based on premises scale, waste volume, or inspection ("—").
 */

export interface BusinessCategory {
  id: number;
  englishName: string;
  sinhalaName: string;
  price: number | null; // null represents variable / custom assessed fee ("—")
  formattedPrice: string; // e.g. "6,000" or "—"
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 1,
    englishName: "Guest Houses",
    sinhalaName: "ගෙස්ට් හවුස්",
    price: 6000,
    formattedPrice: "6,000",
  },
  {
    id: 2,
    englishName: "Hotels",
    sinhalaName: "හෝටල්",
    price: 6000,
    formattedPrice: "6,000",
  },
  {
    id: 3,
    englishName: "Bakeries",
    sinhalaName: "බේකරි",
    price: 6500,
    formattedPrice: "6,500",
  },
  {
    id: 4,
    englishName: "Clothing Stores",
    sinhalaName: "රෙදි කඩ",
    price: 6500,
    formattedPrice: "6,500",
  },
  {
    id: 5,
    englishName: "Rice Shops, Restaurants, Tea & Coffee Shops",
    sinhalaName: "බත් කඩ, ආපනශාලා, තේ කඩ, කෝපි කඩ",
    price: 3600,
    formattedPrice: "3,600",
  },
  {
    id: 6,
    englishName: "Dining Establishments",
    sinhalaName: "භෝජනාගාර",
    price: 6000,
    formattedPrice: "6,000",
  },
  {
    id: 7,
    englishName: "Supermarkets",
    sinhalaName: "සුපිරි වෙළඳසැල්",
    price: 15600,
    formattedPrice: "15,600",
  },
  {
    id: 8,
    englishName: "Retail Shops",
    sinhalaName: "සිල්ලර කඩ",
    price: 2500,
    formattedPrice: "2,500",
  },
  {
    id: 9,
    englishName: "Salons & Beauty Parlours",
    sinhalaName: "සැලූන් / රූපලාවන්යාගාර",
    price: 3500,
    formattedPrice: "3,500",
  },
  {
    id: 10,
    englishName: "Rice Mills",
    sinhalaName: "වී මෝල්",
    price: 4000,
    formattedPrice: "4,000",
  },
  {
    id: 11,
    englishName: "Private Tuition Classes",
    sinhalaName: "පෞද්ගලික පන්ති",
    price: 10000,
    formattedPrice: "10,000",
  },
  {
    id: 12,
    englishName: "Wholesale Businesses",
    sinhalaName: "තොග වෙළෙඳාම",
    price: 10000,
    formattedPrice: "10,000",
  },
  {
    id: 13,
    englishName: "Hardware Stores",
    sinhalaName: "හාඩ්වෙයාර්",
    price: 10000,
    formattedPrice: "10,000",
  },
  {
    id: 14,
    englishName: "General / Mixed Trading",
    sinhalaName: "මිශ්ර වෙළෙඳාම",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 15,
    englishName: "Farm Shops",
    sinhalaName: "ෆාම් ෂොප්",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 16,
    englishName: "Footwear Stores",
    sinhalaName: "පාවහන් අලෙවිය",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 17,
    englishName: "Tyre Service Centres",
    sinhalaName: "ටයර් සර්විස්",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 18,
    englishName: "Printing Services",
    sinhalaName: "මුද්රණ කටයුතු",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 19,
    englishName: "Liquor Stores",
    sinhalaName: "සුරාසැල්",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 20,
    englishName: "Vegetable & Fruit Shops",
    sinhalaName: "එළවළු / පලතුරු අලෙවිය",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 21,
    englishName: "Animal Feed Stores",
    sinhalaName: "සත්ව ආහාර අලෙවිය",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 22,
    englishName: "Fancy Goods Stores",
    sinhalaName: "විසිතුරු භාණ්ඩ",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 23,
    englishName: "Betel Leaf Trading",
    sinhalaName: "බුලත් වෙළෙඳාම",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 24,
    englishName: "Lubricant Sales",
    sinhalaName: "ලිහිසි තෙල්",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 25,
    englishName: "Private Hospitals & Laboratories",
    sinhalaName: "පෞද්ගලික රෝහල් / රසායනාගාර",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 26,
    englishName: "General & Life Insurance Businesses",
    sinhalaName: "සාමාන්ය හා ජීවිත රක්ෂණ ව්යාපාර කටයුතු",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 27,
    englishName: "Gem Shops",
    sinhalaName: "මැණික් කඩ",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 28,
    englishName: "Pharmacies",
    sinhalaName: "බෙහෙත් වෙළඳසැල්",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 29,
    englishName: "Stationery Shops",
    sinhalaName: "ලිපි ද්රව්ය අලෙවිය",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 30,
    englishName: "Function Halls",
    sinhalaName: "උත්සව ශාලා",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 31,
    englishName: "Vehicle Repair Services",
    sinhalaName: "වාහන අලුත්වැඩියා",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 32,
    englishName: "Vehicle Spare Parts Stores",
    sinhalaName: "වාහන අමතර කොටස් විකිණීම",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 33,
    englishName: "Photography Studios",
    sinhalaName: "ස්ටුඩියෝ",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 34,
    englishName: "Cattle Slaughterhouses",
    sinhalaName: "ගව ඝාතකාගාර",
    price: null,
    formattedPrice: "—",
  },
  {
    id: 35,
    englishName: "Goat Meat & Beef Shops",
    sinhalaName: "එළු මස් / ගව මස් විකිණීම",
    price: null,
    formattedPrice: "—",
  },
];

/**
 * Retrieve a category by its 1-based numerical ID.
 */
export function getCategoryById(id: number): BusinessCategory | undefined {
  return BUSINESS_CATEGORIES.find((c) => c.id === id);
}

/**
 * Retrieve a category by English name match.
 */
export function getCategoryByName(name: string): BusinessCategory | undefined {
  const norm = name.trim().toLowerCase();
  return BUSINESS_CATEGORIES.find(
    (c) =>
      c.englishName.toLowerCase() === norm ||
      c.sinhalaName.toLowerCase() === norm
  );
}

/**
 * Formats a currency amount in LKR representation.
 */
export function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
