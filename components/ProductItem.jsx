/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import React from 'react';

export default function ProductItem({ product, addToCartHandler }) {
  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`}>
        <img
          src={product.image}
          alt={product.name}
          className="max-w-sm max-h-40"
        />
      </Link>

      <div className="grid">
        <Link href={`/product/${product.slug}`}>
          <h2 className="text-xl px-1 font-bold">{product.name}</h2>
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-lg px-2">${product.price.toLocaleString()}</p>
          <p className="mb-2 px-2">{product.brand}</p>
        </div>
        {product.countInStock === 0 ? (
          <button disabled>Agotado</button>
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
