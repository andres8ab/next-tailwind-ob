import { useRouter } from 'next/router';
import React, { useState } from 'react';
import SearchIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const router = useRouter();
  const submitHandler = (e) => {
    e.preventDefault();
    router.push(`/search?query=${query}`);
  };

  return (
    <form onSubmit={submitHandler} className="mx-auto justify-center flex">
      <input
        onChange={(e) => setQuery(e.target.value)}
        type="text"
        className="rounded-tr-none rounded-br-none p-1 text-sm focus:ring-0"
        placeholder="Buscar productos"
      />
      <button
        className="rounded rounded-tl-none rounded-bl-none bg-amber-300 p-1 text-sm dark:text-black"
        type="submit"
        id="button-addon2"
      >
        <SearchIcon className="h-5 w-5"></SearchIcon>
      </button>
    </form>
  );
}
