import { Store } from '@/utils/Store'
import Head from 'next/head'
import Link from 'next/link'
import { ToastContainer } from 'react-toastify'
import { Menu } from '@headlessui/react'
import React, { useContext, useEffect, useState } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import { signOut, useSession } from 'next-auth/react'
import DropdownLink from './DropdownLink'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { Bars4Icon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'
import dynamic from 'next/dynamic'

function Layout({ title, children }) {
  const { systemTheme, theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const renderThemeChanger = () => {
    if (!mounted) return null
    const currentTheme = theme === 'system' ? systemTheme : theme

    if (currentTheme === 'dark') {
      return (
        <SunIcon
          className="w-5 h-5 m-2"
          role="button"
          onClick={() => setTheme('light')}
        />
      )
    } else {
      return (
        <MoonIcon
          className="w-5 h-5 m-2"
          role="button"
          onClick={() => setTheme('dark')}
        />
      )
    }
  }

  const { status, data: session } = useSession()

  const { state, dispatch } = useContext(Store)
  const { cart } = state
  const [cartItemsCount, setCartItemsCount] = useState(0)
  useEffect(() => {
    setCartItemsCount(cart.cartItems.reduce((a, c) => a + c.quantity, 0))
  }, [cart.cartItems])

  const logoutClickHandler = () => {
    Cookies.remove('cart')
    dispatch({ type: 'CART_RESET' })
    signOut({ callbackUrl: '/login' })
  }

  const [nav, setNav] = useState(false)

  const handleNav = () => {
    setNav(!nav)
  }

  return (
    <div className="dark:border-gray-700 font-sans">
      <Head>
        <title>{title ? title + ' - OB' : 'OB'}</title>
        <meta name="description" content="OB Pagina Ecommerce" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <ToastContainer position="bottom-center" limit={1} />

      <div className="flex min-h-screen flex-col justify-between">
        <header className="fixed left-0 top-0 w-full z-10 ease-in duration-300">
          <nav className="flex h-12 items-center px-4 justify-between shadow-md">
            <Link href="/" className="text-lg font-bold">
              <Image
                className="rounded w-auto h-auto"
                src="/logos/logoob.jpg"
                alt="logo ob"
                width={50}
                height={50}
              />
            </Link>
            <div className="mx-auto hidden justify-center md:flex">
              <SearchBar />
            </div>
            {/* {Mobile Button} */}
            <div className="flex items-center gap-8 sm:hidden">
              <div onClick={handleNav} className="flex z-10">
                {nav ? (
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                ) : (
                  <Bars4Icon className="h-6 w-6 text-gray-500" />
                )}
              </div>
            </div>
            <div
              className={
                nav
                  ? 'sm:hidden absolute top-0 left-0 right-0 bottom-0 flex justify-center pt-10 w-full h-screen bg-black text-center ease-in duration-300'
                  : 'sm:hidden absolute top-0 left-[-100%] right-0 bottom-0 flex justify-center items-center w-full h-screen bg-black text-center ease-in duration-300'
              }
            >
              <ul>
                <li
                  onClick={handleNav}
                  className="p-4 text-4xl hover:text-gray-500"
                >
                  <Link href="/">Inicio</Link>
                </li>

                <li className="p-4 text-4xl hover:text-gray-500">
                  {status === 'loading' ? (
                    'Cargando'
                  ) : session?.user ? (
                    <Menu as="div" className="relative inline-block">
                      <Menu.Button className="text-blue-600">
                        {session.user.name}
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 w-56 origin-top-right bg-white shadow-lg rounded-md">
                        <Menu.Item>
                          <DropdownLink
                            className="dropdown-link"
                            href="/profile"
                          >
                            Perfil
                          </DropdownLink>
                        </Menu.Item>
                        <Menu.Item>
                          <DropdownLink
                            className="dropdown-link"
                            href="/order-history"
                          >
                            Historial Ordenes
                          </DropdownLink>
                        </Menu.Item>
                        {session.user.isAdmin && (
                          <Menu.Item>
                            <DropdownLink
                              className="dropdown-link"
                              href="/admin/dashboard"
                            >
                              Admin Panel
                            </DropdownLink>
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          <a
                            className="dropdown-link"
                            href="#"
                            onClick={logoutClickHandler}
                          >
                            Cerrar Sesión
                          </a>
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                  ) : (
                    <Link href="/login" className="p-2">
                      Iniciar Sesión
                    </Link>
                  )}
                </li>
                <li
                  onClick={handleNav}
                  className="p-4 text-4xl hover:text-gray-500"
                >
                  <Link href="/cart" className="p-2">
                    Carrito
                    {cartItemsCount > 0 && (
                      <span className="ml-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li
                  onClick={handleNav}
                  className="p-4 text-4xl hover:text-gray-500"
                >
                  <Link href="/search">Bucar Productos</Link>
                </li>
              </ul>
            </div>
            <Link href="/cart" className="p-2 flex">
              <ShoppingCartIcon className="h-6 w-6 text-gray-500" />
              {cartItemsCount > 0 && (
                <span className="ml-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            {/* Big screen menu */}
            <div className="hidden sm:flex items-center z-10 mx-3">
              {status === 'loading' ? (
                'Cargando'
              ) : session?.user ? (
                <Menu as="div" className="relative inline-block">
                  <Menu.Button className="text-blue-600">
                    {session.user.name}
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 w-56 origin-top-right bg-white shadow-lg">
                    <Menu.Item>
                      <DropdownLink className="dropdown-link" href="/profile">
                        Perfil
                      </DropdownLink>
                    </Menu.Item>
                    <Menu.Item>
                      <DropdownLink
                        className="dropdown-link"
                        href="/order-history"
                      >
                        Historial Ordenes
                      </DropdownLink>
                    </Menu.Item>
                    {session.user.isAdmin && (
                      <Menu.Item>
                        <DropdownLink
                          className="dropdown-link"
                          href="/admin/dashboard"
                        >
                          Admin Panel
                        </DropdownLink>
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      <a
                        className="dropdown-link"
                        href="#"
                        onClick={logoutClickHandler}
                      >
                        Cerrar Sesión
                      </a>
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              ) : (
                <Link href="/login" className="p-2">
                  Iniciar Sesión
                </Link>
              )}
            </div>
            {renderThemeChanger()}
          </nav>
        </header>
        <main className="container m-auto mt-12 px-4">{children}</main>
        <footer className="flex h-10 justify-center items-center shadow-inner">
          <p>Copyright ©️ 2023 OB</p>
        </footer>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(Layout), { ssr: false })
