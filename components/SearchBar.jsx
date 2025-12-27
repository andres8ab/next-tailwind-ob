/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import SearchIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import axios from "axios";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If query is empty, clear products
    if (query.trim() === "") {
      setProducts([]);
      return;
    }

    // Debounce search requests
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `/api/products/search?q=${encodeURIComponent(query)}`
        );
        setProducts(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSelect = (product) => {
    if (product) {
      setQuery("");
      setProducts([]);
      router.push(`/product/${product.slug}`);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?query=${query}`);
    }
  };

  const filteredProducts = products;

  return (
    <Combobox
      as="div"
      className="mx-auto justify-center flex relative"
      value={null}
      onChange={handleSelect}
    >
      <div className="relative flex w-full">
        <Combobox.Input
          className="rounded-tr-none rounded-br-none p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full transition-all duration-200"
          placeholder="Buscar productos"
          displayValue={() => query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          className="rounded rounded-tl-none rounded-bl-none bg-red-500 hover:bg-red-600 active:bg-red-700 p-1 text-sm text-white transition-all duration-200 shadow-md hover:shadow-lg"
          type="button"
        >
          <SearchIcon className="h-4 w-4" />
        </button>

        {query && (
          <Combobox.Options className="absolute z-10 mt-10 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-2 text-base shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 border border-gray-200 dark:border-gray-700 focus:outline-none sm:text-sm">
            {loading ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                Buscando...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Combobox.Option
                  key={product.id}
                  value={product}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-4 pr-4 transition-colors duration-150 ${
                      active
                        ? "bg-red-50 dark:bg-red-900/30 text-gray-900 dark:text-white"
                        : "text-gray-900 dark:text-gray-100"
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <span className="block font-medium line-clamp-2">
                        {product.name}
                      </span>
                    </div>
                  </div>
                </Combobox.Option>
              ))
            ) : (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                No se encontraron productos
              </div>
            )}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
