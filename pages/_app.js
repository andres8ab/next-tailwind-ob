import "@/styles/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import { StoreProvider } from "@/utils/Store";
import { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import { Poppins } from "next/font/google";
import { useScrollRestoration } from "next-restore-scroll-position";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const router = useRouter();
  useScrollRestoration(router);
  return (
    <SessionProvider session={session}>
      <StoreProvider>
        <main className={poppins.className}>
          <ThemeProvider
            enableSystem={false}
            attribute="class"
            defaultTheme="dark"
          >
            {Component.auth ? (
              <Auth adminOnly={Component.auth.adminOnly}>
                <Component {...pageProps} />
              </Auth>
            ) : (
              <Component {...pageProps} />
            )}
          </ThemeProvider>
        </main>
      </StoreProvider>
    </SessionProvider>
  );
}

function Auth({ children, adminOnly }) {
  const router = useRouter();
  const { status, data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/unauthorized?message=login required");
    },
  });
  if (status === "loading") {
    return <div>Cargando...</div>;
  }
  if (adminOnly && !session.user.isAdmin) {
    router.push("/unauthorized?message=admin inicio sesión requerido");
  }
  return children;
}
