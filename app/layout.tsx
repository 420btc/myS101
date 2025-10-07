import type { Metadata } from "next";
import { Inter, Bowlby_One } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });
const bowlbyOne = Bowlby_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bowlby-one"
});

export const metadata: Metadata = {
  title: "SO ARM 101 CPF",
  description: "Make it easy to play with robots 🤖",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${bowlbyOne.variable} bg-black text-white w-screen h-screen overflow-x-hidden`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
          <Header />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
