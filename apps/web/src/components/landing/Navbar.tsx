"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

const navLinks = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#beneficios", label: "Beneficios" },
  { href: "/#para-quien", label: "Para quién" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-subtle" : "bg-black/50 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/Icono-Proofy.svg"
            alt="Proofy"
            width={56}
            height={56}
            className="h-11 w-11 invert sm:h-14 sm:w-14"
          />
          <span className="font-logo text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Proofy
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted transition-colors duration-200 hover:text-white"
            >
              {label}
            </a>
          ))}
          <Link
            href="/contrato"
            className="text-sm font-medium text-lime transition-colors duration-200 hover:text-lime-hover"
          >
            Analizar contrato
          </Link>
        </div>

        {/* Desktop CTA */}
        <ConnectWallet className="hidden md:block" id="navbar-connect-wallet" redirectTo="/contrato" />

        {/* Mobile Toggle */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          id="navbar-mobile-toggle"
        >
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              mobileOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              mobileOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-navigation"
        inert={!mobileOpen}
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          mobileOpen ? "max-h-[28rem]" : "max-h-0"
        }`}
      >
        <div className="glass border-t border-subtle px-6 pb-6 pt-2">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="block py-3 text-muted transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <Link
            href="/contrato"
            className="block py-3 text-lime transition-colors hover:text-lime-hover"
            onClick={() => setMobileOpen(false)}
          >
            Analizar contrato
          </Link>
          <ConnectWallet className="mt-3" id="navbar-mobile-connect" redirectTo="/contrato" />
        </div>
      </div>
    </nav>
  );
}
