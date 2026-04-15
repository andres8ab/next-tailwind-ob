import Layout from "@/components/Layout";
import ProductItem from "@/components/ProductItem";
import Product from "@/models/Product";
import { Store } from "@/utils/Store";
import db from "@/utils/db";
import axios from "axios";
import Image from "next/image";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { fadeIn } from "@/utils/motion";
import SearchBar from "@/components/SearchBar";
import { clearsStockFlag } from "@/utils/cartStock";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";

const productsDetails = [
  {
    title: "Alternador",
    icon: "/images/AL-076.png",
  },
  {
    title: "Arranque",
    icon: "/images/AR-027.png",
  },
  {
    title: "Piezas Alternador",
    icon: "/images/RA-051.png",
  },
  {
    title: "Piezas Arranque",
    icon: "/images/ZM-893.png",
  },
  {
    title: "Motoventilador",
    icon: "/images/12-12V.png",
  },
  {
    title: "Distribuidor",
    icon: "/images/AP-005.png",
  },
  {
    title: "Refrigeracion",
    icon: "/images/2011945.png",
  },
  {
    title: "Pera",
    icon: "/images/YZ-022.png",
  },
];

const ServiceCard = ({ index, title, icon }) => {
  return (
    <Tilt className="xs:w-[250px] w-full h-full">
      <motion.div
        variants={fadeIn("right", "spring", 0.5 * index, 0.75)}
        className="w-full h-full green-pink-gradient p-[1px] rounded-[20px] shadow-card cursor-pointer"
      >
        <div
          options={{
            max: 45,
            scale: 1,
            speed: 450,
          }}
          className="rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col"
        >
          <Image
            src={icon}
            alt={title}
            className="object-contain"
            width={300}
            height={300}
          />
          <h3 className="text-white text-[20px] font-bold text-center">
            {title}
          </h3>
          <button onClick={(e) => e.stopPropagation()}></button>
        </div>
      </motion.div>
    </Tilt>
  );
};

export default function Home({ products }) {
  const { state, dispatch } = useContext(Store);
  const { cart, selectedCategory, modal } = state;
  const [catalogPdfLoading, setCatalogPdfLoading] = useState(false);
  const [showCatalogOptions, setShowCatalogOptions] = useState(false);
  const [catalogScope, setCatalogScope] = useState("todos");

  const categoryHandler = (categoryId) => {
    dispatch({ type: "SET_SELECTED_CATEGORY", payload: categoryId });
    dispatch({ type: "TOGGLE_MODAL" });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleReturn = () => {
    dispatch({ type: "TOGGLE_MODAL" });
  };

  const addToCartHandler = async (product) => {
    const existItem = cart.cartItems.find((x) => x.slug === product.slug);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);

    if (data.countInStock < quantity) {
      return toast.error("Lo sentimos. El producto está agotado");
    }
    dispatch({
      type: "CART_ADD_ITEM",
      payload: {
        ...product,
        ...data,
        quantity,
        clearsStock: clearsStockFlag(quantity, data.countInStock),
      },
    });
    toast.success("Producto agregado al carrito");
  };

  const downloadCatalog = (blobUrl, fileName) => {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openCatalogInNewTab = (blobUrl, previewWindow) => {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = blobUrl;
      return true;
    }

    const newTab = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (newTab) return true;

    const openLink = document.createElement("a");
    openLink.href = blobUrl;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    document.body.appendChild(openLink);
    openLink.click();
    openLink.remove();

    // Final fallback when popup blockers reject background tab opening.
    setTimeout(() => {
      if (!document.hidden) {
        window.location.assign(blobUrl);
      }
    }, 120);
    return false;
  };

  const catalogPdfHandler = async (scope = "todos", output = "open") => {
    const available = products.filter(
      (p) => p.countInStock > 0 && (scope === "ob" ? p.group === "ob" : true),
    );
    if (available.length === 0) {
      toast.error("No hay productos en stock para el catálogo");
      return;
    }

    let previewWindow = null;
    if (output === "open") {
      previewWindow = window.open("about:blank", "_blank");
    }

    setCatalogPdfLoading(true);
    try {
      const { generateCatalogPdf } = await import("@/utils/generateCatalogPdf");
      const { blobUrl, fileName } = await generateCatalogPdf(available);

      if (output === "open") {
        openCatalogInNewTab(blobUrl, previewWindow);
        toast.success("Catálogo abierto");
      } else {
        downloadCatalog(blobUrl, fileName);
        toast.success("Catálogo descargado");
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      if (err?.message === "NO_STOCK") {
        toast.error("No hay productos en stock para el catálogo");
      } else {
        toast.error("No se pudo generar el catálogo. Intenta de nuevo.");
      }
    } finally {
      setCatalogPdfLoading(false);
    }
  };

  return (
    <Layout title="Home">
      <div className="mx-auto pt-4 flex justify-center md:hidden">
        <SearchBar />
      </div>
      {modal ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-6">
          {productsDetails.map((productDetail, index) => (
            <div
              key={productDetail.title}
              onClick={() => categoryHandler(productDetail.title)}
            >
              <ServiceCard index={index} {...productDetail} />
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-4">
          <button
            className="rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => handleReturn()}
          >
            ‹ Regresar
          </button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-12">
            {products
              .filter(
                (product) =>
                  product.countInStock > 0 &&
                  product.category === selectedCategory
              )
              .map((product) => (
                <ProductItem
                  addToCartHandler={addToCartHandler}
                  product={product}
                  key={product.slug}
                ></ProductItem>
              ))}
          </div>
        </div>
      )}
      {showCatalogOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generar catálogo
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Selecciona grupo y salida del PDF.
            </p>
            <div className="mt-4 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={`rounded-md py-2 text-sm font-semibold transition ${
                    catalogScope === "ob"
                      ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-gray-100"
                      : "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setCatalogScope("ob")}
                >
                  OB
                </button>
                <button
                  type="button"
                  className={`rounded-md py-2 text-sm font-semibold transition ${
                    catalogScope === "todos"
                      ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-gray-100"
                      : "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setCatalogScope("todos")}
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={catalogPdfLoading}
                className="rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                onClick={() => {
                  setShowCatalogOptions(false);
                  catalogPdfHandler(catalogScope, "open");
                }}
              >
                Abrir PDF
              </button>
              <button
                type="button"
                disabled={catalogPdfLoading}
                className="rounded-lg bg-gray-200 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                onClick={() => {
                  setShowCatalogOptions(false);
                  catalogPdfHandler(catalogScope, "download");
                }}
              >
                Descargar PDF
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => setShowCatalogOptions(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setCatalogScope("todos");
          setShowCatalogOptions(true);
        }}
        disabled={catalogPdfLoading}
        aria-busy={catalogPdfLoading}
        aria-label="Descargar catálogo en PDF"
        title="Descargar catálogo PDF"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg ring-1 ring-white/10 transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:ring-black/5 dark:hover:bg-white dark:focus-visible:outline-gray-200"
      >
        <DocumentArrowDownIcon
          className={`h-5 w-5 shrink-0 ${catalogPdfLoading ? "animate-pulse" : ""}`}
          aria-hidden
        />
        {catalogPdfLoading ? "Generando…" : "Catálogo"}
      </button>
    </Layout>
  );
}

export async function getServerSideProps() {
  await db.connect();
  const products = await Product.find().sort({ slug: 1 }).lean();
  return {
    props: {
      products: products.map(db.convertDocToObj),
    },
  };
}
