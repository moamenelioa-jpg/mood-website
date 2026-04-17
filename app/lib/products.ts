// Product Type Definition
export interface Product {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  subtitleEn: string;
  subtitleAr: string;
  size: string;
  badgeEn: string;
  badgeAr: string;
  price: number;
  image: string;
}

// All Mood Products - 10 Premium Peanut Butter Products
export const products: Product[] = [
  {
    id: 1,
    slug: "crunchy",
    nameEn: "Crunchy Peanut Butter",
    nameAr: "زبدة فول سوداني كرنشي",
    subtitleEn: "Bold texture, rich taste",
    subtitleAr: "قوام غني وطعم قوي",
    size: "300g",
    badgeEn: "Best Seller",
    badgeAr: "الأكثر مبيعًا",
    price: 60,
    image: "/products/crunchy.jpg",
  },
  {
    id: 2,
    slug: "creamy",
    nameEn: "Creamy Peanut Butter",
    nameAr: "زبدة فول سوداني كريمي",
    subtitleEn: "Smooth, premium, satisfying",
    subtitleAr: "ناعم، فاخر، ومشبع",
    size: "300g",
    badgeEn: "New",
    badgeAr: "جديد",
    price: 60,
    image: "/products/creamy.jpg",
  },
  {
    id: 3,
    slug: "chocolate",
    nameEn: "Chocolate Peanut Butter",
    nameAr: "زبدة فول سوداني بالشوكولاتة",
    subtitleEn: "A richer indulgent blend",
    subtitleAr: "مزيج أغنى وأكثر متعة",
    size: "300g",
    badgeEn: "Trending",
    badgeAr: "رائج",
    price: 80,
    image: "/products/chocolate.jpg",
  },
  {
    id: 4,
    slug: "family",
    nameEn: "Family Jar",
    nameAr: "العبوة العائلية",
    subtitleEn: "Made for daily moments",
    subtitleAr: "مناسبة للاستخدام اليومي",
    size: "1kg",
    badgeEn: "Value Pack",
    badgeAr: "عبوة اقتصادية",
    price: 180,
    image: "/products/family.jpg",
  },
  {
    id: 5,
    slug: "diet",
    nameEn: "Diet Peanut Butter",
    nameAr: "زبدة فول سوداني دايت",
    subtitleEn: "Low sugar, high protein",
    subtitleAr: "قليل السكر، عالي البروتين",
    size: "300g",
    badgeEn: "Healthy",
    badgeAr: "صحي",
    price: 60,
    image: "/products/diet.jpg",
  },
  {
    id: 6,
    slug: "honey-roasted",
    nameEn: "Peanut Butter with Honey",
    nameAr: "زبدة فول سوداني بالعسل",
    subtitleEn: "Honey roasted peanut butter delight",
    subtitleAr: "   زبدة فول سودانى بعسل النحل الطبيعى  ",
    size: "300g",
    badgeEn: "Premium",
    badgeAr: "فاخر",
    price: 70,
    image: "/products/honey.jpg",
  },
  {
    id: 7,
    slug: "chocolate-hazelnut",
    nameEn: "Chocolate Hazelnut Spread",
    nameAr: "شوكولاتة موود بالبندق",
    subtitleEn: "Rich hazelnut chocolate blend",
    subtitleAr: "مزيج شوكولاتة غني بالبندق",
    size: "350g",
    badgeEn: "Popular",
    badgeAr: "شائع",
    price: 50,
    image: "/products/chocolate-350g.jpg",
  },
  {
    id: 8,
    slug: "white-chocolate",
    nameEn: "Diet Peanut Butter  ",
    nameAr: " زبدة فول سودانى موود دايت  ",
    subtitleEn: "Creamy diet peanut butter",
    subtitleAr: "زبدة فول سوداني كريمية للدايت",
    size: "620g",
    badgeEn: "New",
    badgeAr: "جديد",
    price: 120,
    image: "/products/diet-620.jpg",
  },
  {
    id: 9,
    slug: "almond-butter",
    nameEn: "Chocolate Hazelnut Spread",
    nameAr: "شوكولاتة بالبندق",
    subtitleEn: "Pure chocolate hazelnut spread",
    subtitleAr: "شوكولاتة لذيذة بنكهة البندق",
    size: "5kg",
    badgeEn: "Premium",
    badgeAr: "فاخر",
    price: 249,
    image: "/products/mood-gallon.jpg",
  },
];

// Get featured products (first 4 for homepage)
export const featuredProducts = products.slice(0, 4);

// Get product by slug
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

// Get product by ID
export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
