"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import SearchBox from "./SearchBox";
import { TOGGLE_MOBILE_MENU_EVENT } from "./MobileTabBar";

interface DropdownLink {
  label: string;
  href: string;
}

interface DropdownGroup {
  label: string;
  links: DropdownLink[];
}

interface NavItem {
  label: string;
  href: string;
  dropdown?: DropdownLink[];
  groups?: DropdownGroup[];
}

export default function NavbarClient({
  destinationGroups,
  journeyLinks,
  experienceLinks,
  collectionLinks,
  safariLinks,
}: {
  destinationGroups: DropdownGroup[];
  journeyLinks: DropdownLink[];
  experienceLinks: DropdownLink[];
  collectionLinks: DropdownLink[];
  safariLinks: DropdownLink[];
}) {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  // Mobile-only: sections with grouped sub-links (currently just Destinations,
  // whose sub-continent groups can flatten into a long list) start truncated
  // to 3 links with a "View more" toggle. Desktop keeps its own per-group
  // slice (line ~184) untouched.
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const transparent = isHome && !condensed && !menuOpen && !hovered;

  const NAV_ITEMS: NavItem[] = [
    { label: "Destinations", href: "/destinations", groups: destinationGroups },
    { label: "Journeys", href: "/journeys", dropdown: journeyLinks },
    { label: "Experiences", href: "/experiences", dropdown: experienceLinks },
    { label: "Collections", href: "/collections", dropdown: collectionLinks },
    { label: "Safari", href: "/safari", dropdown: safariLinks },
    { label: "Bespoke", href: "/tailor-made-trips" },
    { label: "Journal", href: "/blog" },
  ];

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Resets ephemeral UI state (open menu/dropdowns) whenever the route
  // changes, so navigating away doesn't leave a stale menu open on the
  // next page. react-hooks/set-state-in-effect flags the unconditional
  // setState calls here, but there's no way around the extra render this
  // causes: these are independent pieces of state, not one value a `key`
  // prop could reset by remounting the subtree (which would also nuke
  // state this effect has no business touching, like the search box).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    setOpenDropdown(null);
    setOpenMobileSection(null);
    setExpandedMobileGroups({});
  }, [pathname]);

  // MobileTabBar's Search/Menu buttons live outside this component (they're
  // rendered from app/(public)/layout.tsx, not here), so they open this
  // panel via a plain window event instead of lifted state.
  useEffect(() => {
    function onToggle() {
      setMenuOpen((v) => !v);
    }
    window.addEventListener(TOGGLE_MOBILE_MENU_EVENT, onToggle);
    return () => window.removeEventListener(TOGGLE_MOBILE_MENU_EVENT, onToggle);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <header
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed inset-x-0 top-0 z-50 h-20 transition-colors duration-300 ${
        transparent ? "bg-transparent" : "bg-background/95 shadow-card backdrop-blur"
      }`}
    >
      <div ref={navRef} className="mx-auto flex h-full max-w-7xl items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-[42px] transition-all duration-300 lg:h-12 lg:w-[50px]">
            <Image
              src="/logo.png"
              alt="Teyezilla Expeditions"
              fill
              priority
              quality={70}
              sizes="50px"
              className={`object-contain transition-all duration-300 ${
                transparent ? "brightness-0 invert" : ""
              }`}
            />
          </div>
        </Link>

        {/* The following is the original version of logo placement on the navbar, which was replaced with a new design. It is kept here for reference in case we want to revert to it in the future. */}
        {/* <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Teyezilla Expeditions"
            width={50}
            height={48}
            priority
            quality={70}
            className={`h-10 w-auto lg:h-12 transition-all duration-300 ${
              transparent ? "brightness-0 invert" : ""
            }`}
          />
        </Link> */}

        {/* lg: (1024px) is deliberate, not the default choice left unexamined:
            8 nav items plus the phone/search icons and "Plan Your Journey"
            CTA need roughly 750px on their own, and tablets (768-1023px)
            only have about 360px left after the logo and CTA. Rather than
            force that into a strip too narrow to read, tablets get the
            mobile menu below -- widened to use the extra room instead of
            rendering it identically to a 375px phone (see md: classes there).

            lg:ml-6/gap-4 (not the xl:ml-40/gap-6 values) at exactly 1024px:
            measured live, the full row (logo + items + icons + CTA) needs
            ~1093px, which the xl-tier spacing alone doesn't leave room for
            at 1024px -- the CTA button rendered with its right edge past
            the viewport, with no scrollbar to reach it since the header is
            fixed-position (overflow there doesn't extend document scrollWidth,
            so a generic overflow-x audit won't catch this the way it would
            for normal in-flow content).

            xl:ml-40 (not xl:ml-32): dropping the Concierge nav item left a
            ~108px gap between the last item and the search/phone/CTA block
            at every viewport >=1280px (the row is capped by max-w-7xl, so
            that gap doesn't grow with a wider screen) -- measured live and
            nudged right by 32px to close some of it while still leaving the
            two groups visually separated, not touching lg:ml-6 since 1024px
            has near-zero slack per the note above. */}
        <nav className="hidden items-center gap-4 lg:ml-6 lg:flex xl:ml-40 xl:gap-6">
          {NAV_ITEMS.map((item) =>
            item.groups && item.groups.length > 0 ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {/* Label navigates straight to item.href on click (hover
                    already previews the dropdown on desktop); the chevron
                    is a separate toggle for touch/keyboard use where
                    hover isn't available. */}
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    transparent ? "text-white" : "text-foreground"
                  }`}
                >
                  <Link
                    href={item.href}
                    className={`transition-colors ${transparent ? "hover:text-accent" : "hover:text-primary"}`}
                  >
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((v) => (v === item.label ? null : item.label))}
                    aria-expanded={openDropdown === item.label}
                    aria-label={`Toggle ${item.label} menu`}
                    className={`transition-colors ${transparent ? "hover:text-accent" : "hover:text-primary"}`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {openDropdown === item.label && (
                  <div className="absolute left-1/2 top-full z-10 w-[36rem] -translate-x-1/2 pt-3">
                    <div className="flex gap-6 rounded-2xl bg-white p-6 text-left shadow-cardHover">
                      {item.groups.map((group) => (
                        <div key={group.label} className="flex-1">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/40">
                            {group.label}
                          </p>
                          <div className="flex flex-col gap-1">
                            {group.links.slice(0, 3).map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/15 hover:text-primary"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="w-full border-t border-secondary/20 pt-3">
                        <Link
                          href={item.href}
                          className="block text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          View All {item.label} →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : item.dropdown && item.dropdown.length > 0 ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    transparent ? "text-white" : "text-foreground"
                  }`}
                >
                  <Link
                    href={item.href}
                    className={`transition-colors ${transparent ? "hover:text-accent" : "hover:text-primary"}`}
                  >
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((v) => (v === item.label ? null : item.label))}
                    aria-expanded={openDropdown === item.label}
                    aria-label={`Toggle ${item.label} menu`}
                    className={`transition-colors ${transparent ? "hover:text-accent" : "hover:text-primary"}`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {openDropdown === item.label && (
                  <div className="absolute left-1/2 top-full z-10 w-56 -translate-x-1/2 pt-3">
                    <div className="rounded-2xl bg-white p-2 text-left shadow-cardHover">
                      {item.dropdown.slice(0, 3).map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/15 hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <Link
                        href={item.href}
                        className="mt-1 block rounded-xl px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/15"
                      >
                        View All {item.label} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-200 hover:after:w-full ${
                  transparent ? "text-white hover:text-accent" : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex xl:gap-4">
          <SearchBox variant="desktop" transparent={transparent} />
          <Link
            href="/contact"
            aria-label="Contact us"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              transparent ? "text-white hover:text-accent" : "text-foreground hover:text-primary"
            }`}
          >
            <Phone className="h-5 w-5" />
          </Link>
          <Link href="/booking" className="btn-secondary text-sm">
            Plan Your Journey
          </Link>
        </div>

        <button
          className={`ml-auto -mr-2.5 flex h-11 w-11 items-center justify-center ${transparent ? "text-white lg:hidden" : "text-primary lg:hidden"}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mx-auto flex max-h-[calc(100vh-5rem)] max-w-3xl flex-col gap-1 overflow-y-auto border-t border-secondary/30 bg-background px-6 py-6 lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <SearchBox variant="mobile" />
            <Link
              href="/contact"
              aria-label="Contact us"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-foreground"
            >
              <Phone className="h-5 w-5" />
            </Link>
          </div>
          {/* md: widens this to 2 columns of sublinks instead of 1 once a
              section is expanded, so tablet width (768-1023px) doesn't sit
              on an unused right half the way a plain phone-width column would. */}
          {NAV_ITEMS.map((item) => {
            // A destination can appear in more than one sub-continent group
            // (e.g. an island group and its parent region); dedupe by href
            // so the flattened mobile list doesn't repeat it or collide on
            // React key.
            const flatLinks: DropdownLink[] = item.groups
              ? Array.from(new Map(item.groups.flatMap((g) => g.links).map((l) => [l.href, l])).values())
              : item.dropdown ?? [];
            const showAll = expandedMobileGroups[item.label] ?? false;
            const visibleLinks = !showAll ? flatLinks.slice(0, 3) : flatLinks;

            return flatLinks.length > 0 ? (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenMobileSection((v) => (v === item.label ? null : item.label))
                  }
                  className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-foreground"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openMobileSection === item.label ? "rotate-180" : ""}`}
                  />
                </button>
                {openMobileSection === item.label && (
                  <div className="ml-3 grid grid-cols-1 gap-1 border-l border-secondary/30 pl-3 pb-2 md:grid-cols-2 md:gap-x-6">
                    {visibleLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="py-1.5 text-sm text-foreground/70 hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                    {!showAll && flatLinks.length > 3 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileGroups((v) => ({ ...v, [item.label]: true }))
                        }
                        className="py-1.5 text-left text-sm font-semibold text-primary"
                      >
                        View more
                      </button>
                    )}
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="py-1.5 text-sm font-semibold text-primary"
                    >
                      View All {item.label} →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="py-2.5 text-sm font-medium text-foreground hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/booking" className="btn-secondary mt-3 text-sm" onClick={() => setMenuOpen(false)}>
            Plan Your Journey
          </Link>
        </nav>
      )}
    </header>
  );
}
