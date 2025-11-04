import type {Metadata} from "next";
import {Raleway, Poppins} from "next/font/google";
import "./globals.css";
import { Providers } from './providers'

const raleway = Raleway({
    variable: "--font-raleway",
    subsets: ["latin"],
});

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["400", "700"],
});

export const metadata: Metadata = {
    title: "E2I AgentSecu",
    description: "E2I AgentSecu",
      robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
        <head>
            {/* Meta tags pour empêcher le cache navigateur */}
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
        </head>
        <body
            className={`${raleway.variable} ${poppins.variable} px-4`}
        >
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    );
}
