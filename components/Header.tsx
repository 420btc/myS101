"use client";
import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className="text-white w-full p-5 sm:px-10 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <Link href="/">
            <img src="/favicon.ico" alt="BamBot Logo" className="w-8 h-8" />
        </Link>
      </header>
    </>
  );
}
