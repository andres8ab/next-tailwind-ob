import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { toast } from "react-toastify";
import CheckoutWizard from "@/components/CheckoutWizard";
import Layout from "@/components/Layout";
import { getError } from "@/utils/error";
import { Store } from "@/utils/Store";
import { useSession } from "next-auth/react";

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, user: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

// Utility function for precise decimal calculations
const round2 = (num) => {
  return Number(Number(num).toFixed(2));
};

// Separate function to calculate order totals
const calculateOrderTotals = (cartItems, clientDiscount = 0) => {
  // Ensure all numbers are properly typed and calculated
  const itemsPrice = round2(
    cartItems.reduce((acc, item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      return acc + quantity * price;
    }, 0)
  );

  const shippingPrice = 0;
  const discountPrice = round2((itemsPrice * Number(clientDiscount)) / 100);
  const beforeTaxPrice = round2(itemsPrice - discountPrice);
  const taxPrice = round2(beforeTaxPrice * 0.19);
  const totalPrice = round2(
    itemsPrice - discountPrice + taxPrice + shippingPrice
  );

  return {
    itemsPrice,
    shippingPrice,
    discountPrice,
    beforeTaxPrice,
    taxPrice,
    totalPrice,
  };
};

export default function PlaceorderClientScreen() {
  const { data: session } = useSession();
  const userClient = session.user._id;

  const [{ loading, error, user }, dispatch] = useReducer(reducer, {
    loading: true,
    user: {},
    error: "",
  });
  useEffect(() => {
    const fetchData = async () => {
      if (!userClient) return;
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/users/${userClient}`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [userClient]);

  const { shippingAddress, paymentMethod, clientDiscount, seller } = user;

  const { state, dispatch: storeDispatch } = useContext(Store);
  const { cart } = state;
  const { cartItems } = cart;

  // const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  // const itemsPrice = round2(
  //   cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
  // ); // 123.4567 => 123.46

  // const shippingPrice = 0;
  // const discountPrice = round2((itemsPrice * clientDiscount) / 100);
  // const beforeTaxPrice = round2(itemsPrice - discountPrice);
  // const taxPrice = round2(beforeTaxPrice * 0.19);
  // const totalPrice = round2(
  //   itemsPrice + shippingPrice - discountPrice + taxPrice
  // );

  // Calculate all order totals
  const { itemsPrice, shippingPrice, discountPrice, taxPrice, totalPrice } =
    calculateOrderTotals(cartItems, clientDiscount);

  const router = useRouter();
  const [sendLoading, setSendLoading] = useState(false);
  const [comment, setComment] = useState("");

  const placeOrderHandler = async () => {
    try {
      setSendLoading(true);
      const { data } = await axios.post("api/orders", {
        orderItems: cartItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        discountPrice,
        totalPrice,
        seller,
        comment,
      });
      storeDispatch({ type: "CART_CLEAR_ITEMS" });
      Cookies.set(
        "cart",
        JSON.stringify({
          ...cart,
          cartItems: [],
        })
      );
      router.push(`/order/${data._id}`);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <Layout title="Enviar Orden">
      <CheckoutWizard activeStep={3} />
      <h1 className="mb-4 text-xl">Enviar Orden</h1>
      {cartItems.length === 0 ? (
        <div>
          El carrito está vacío. <Link href="/">Agregar productos</Link>
        </div>
      ) : loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="alert-error">{error}</div>
      ) : (
        <div className="grid lg:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <div className="card p-5">
              <h2 className="mb-2 text-xl">Dirección Envío</h2>
              <div>
                {shippingAddress.fullName}, {shippingAddress.address},{" "}
                {shippingAddress.city}
              </div>
              <div>
                <Link href="/shipping">Editar</Link>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="mb-2 text-xl">Método Pago</h2>
              <div>{paymentMethod}</div>
              <div>
                <Link href="/payment">Editar</Link>
              </div>
            </div>
            <div className="card overflow-x-auto p-5">
              <h2 className="mb-2 text-xl">Pedido</h2>
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 text-left">Item</th>
                    <th className="px-5 text-right">Cantidad</th>
                    <th className="px-5 text-right">Precio</th>
                    <th className="px-5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item._id} className="border-b">
                      <td>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          ></Image>
                          &nbsp;
                          {item.name}
                        </Link>
                      </td>
                      <td className="p-5 text-right">{item.quantity}</td>
                      <td className="p-5 text-right">{item.price}</td>
                      <td className="p-5 text-right">
                        {item.quantity * item.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <Link href="/cart">Editar</Link>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="mb-2 text-xl">Comentarios</h2>
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full"
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="card p-5">
              <h2 className="mb-2 text-lg">Resumen Orden</h2>
              <ul>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Items</div>
                    <div>${itemsPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Dcto.</div>
                    <div>${discountPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Iva</div>
                    <div>${taxPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Envío</div>
                    <div>${shippingPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Total</div>
                    <div>${totalPrice}</div>
                  </div>
                </li>
                <li>
                  <button
                    disabled={sendLoading}
                    onClick={placeOrderHandler}
                    className="primary-button w-full"
                  >
                    {sendLoading ? "Cargando..." : "Enviar Orden"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

PlaceorderClientScreen.auth = true;
