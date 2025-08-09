import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "~/app/_components/providers";

export const metadata: Metadata = {
  title: "Instagram",
  description: "Chia sẻ khoảnh khắc với bạn bè của bạn",
  icons: [
    {
      rel: "icon",
      url: "/1491580658-yumminkysocialmedia06_83104.ico",
      sizes: "32x32",
    },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playwrite+HU:wght@100..400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-black text-white">
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
