"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";
import { useCart } from "@/app/lib/cart-context";

export default function CartDrawer() {
  const { isArabic, formatPrice } = useLanguage();
  const { cart, cartOpen, cartCount, cartTotal, updateQuantity, removeItem, setCartOpen } = useCart();

  if (!cartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />
      <aside
        dir={isArabic ? "rtl" : "ltr"}
        className="fixed right-0 top-0 z-[70] h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#f0dfc7] px-6 py-5">
          <div>
            <h3 className="text-2xl font-black text-[#2d170d]">
              {isArabic ? "سلة التسوق" : "Shopping cart"}
            </h3>
            <p className="mt-1 text-sm text-[#6f4d34]">
              {cartCount} {isArabic ? "منتج" : "items"}
            </p>
          </div>
          <button onClick={() => setCartOpen(false)} aria-label={isArabic ? "إغلاق السلة" : "Close cart"}>
            <X className="h-6 w-6 text-[#6f4d34]" />
          </button>
        </div>

        <div className="px-6 py-6">
          {cart.length === 0 ? (
            <div className="rounded-[2rem] border border-[#f0dfc7] bg-[#f8f1e7] p-8 text-center text-[#6f4d34]">
              {isArabic ? "السلة فارغة" : "Your cart is empty"}
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map((item) => (
                <div key={item.id} className="rounded-[2rem] border border-[#f0dfc7] bg-[#fff8f1] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-[#2d170d]">{item.name}</h4>
                      <p className="mt-2 text-sm text-[#6f4d34]">{item.size}</p>
                      <p className="mt-3 text-sm font-bold text-[#2d170d]">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <button onClick={() => removeItem(item.id)} aria-label={isArabic ? "حذف المنتج" : "Remove item"}>
                      <Trash2 className="h-5 w-5 text-[#b54d35]" />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-[#e0c9b0] bg-white p-2 text-[#5f3b1f] transition hover:bg-[#f7f0e6]"
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={isArabic ? "إنقاص الكمية" : "Decrease quantity"}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[24px] text-center font-black text-[#2d170d]">{item.quantity}</span>
                    <button
                      type="button"
                      className="rounded-full border border-[#e0c9b0] bg-white p-2 text-[#5f3b1f] transition hover:bg-[#f7f0e6]"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="rounded-[2rem] border border-[#f0dfc7] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between text-lg font-black text-[#2d170d]">
                  <span>{isArabic ? "الإجمالي" : "Total"}</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 block w-full rounded-[1.7rem] bg-[#15803d] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#7f4d1d]"
                >
                  {isArabic ? "الدفع الآن" : "Checkout now"}
                </Link>
                <div className="mt-4 rounded-[1.8rem] border border-[#e8d3b8] bg-[#f8f2e9] p-4 text-sm text-[#5f3b1f]">
                  <div className="font-black uppercase tracking-[0.14em] text-[#15803d]">
                    {isArabic ? "طرق الدفع" : "Payment methods"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                    <span className="rounded-full bg-[#15803d] px-3 py-1 text-white shadow-sm">
                      {isArabic ? "الدفع عند الاستلام" : "Cash on Delivery"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 shadow-sm">Visa</span>
                    <span className="rounded-full bg-white px-3 py-1 shadow-sm">Mastercard</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#6f4d34]">
                    {isArabic
                      ? "ادفع نقداً عند الاستلام أو بالبطاقة عبر Stripe الآمن."
                      : "Pay cash on delivery or securely by card via Stripe."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
