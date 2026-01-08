import Link from "next/link";
import React, { useState } from "react";
import NoImage from "../public/images/no-image.png";
import ImageWithFallback from "./ImageWithFallback";

export default function ProductItem({ product, addToCartHandler }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`product-card ${isHovered ? "scale-[1.02] shadow-2xl" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`}>
        <ImageWithFallback
          src={product.image}
          fallbackSrc={NoImage}
          alt={product.name}
          className="max-w-sm max-h-40 md:max-w-[280px] md:max-h-32 justify-self-center object-contain"
        />
      </Link>

      <div className="grid p-4 gap-3">
        <Link href={`/product/${product.slug}`}>
          <h2
            className={`text-xl px-1 font-bold md:text-sm text-gray-900 dark:text-gray-100 transition-colors ${
              isHovered ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {product.name}
          </h2>
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-lg px-2 md:text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${product.price.toLocaleString()}
          </p>
          <p className="mb-2 px-2 md:text-sm text-gray-600 dark:text-gray-400">
            {product.brand}
          </p>
        </div>
        {product.countInStock === 0 ? (
          <button
            disabled
            className="rounded bg-gray-300 dark:bg-gray-600 py-2 px-4 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium"
          >
            Agotado
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={() => addToCartHandler(product)}
          >
            Agregar al Carrito
          </button>
        )}
      </div>
    </div>
  );
}
