import Image from "next/image";
import Link from "next/link";
import { getSiteSetting } from "@/lib/settings";
import { whatsappLink } from "@/lib/enquiry-shared";
import { buildSocialLinks } from "@/components/SocialIcons";
import FooterLinkGroup from "@/components/FooterLinkGroup";

const EXPLORE_LINKS = [
  { label: "Safaris", href: "/safari" },
  { label: "Journeys", href: "/journeys" },
  { label: "Experiences", href: "/experiences" },
  { label: "Destinations", href: "/destinations" },
  { label: "Collections", href: "/collections" },
];

const TRAVEL_WITH_US_LINKS = [
  { label: "Private Travel", href: "/private-travel" },
  { label: "Bespoke Journeys", href: "/tailor-made-trips" },
  { label: "About Teyezilla", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const INSPIRATION_LINKS = [
  { label: "Teyezilla Journal", href: "/blog" },
  { label: "Travel Guide", href: "/travel-guide" },
  { label: "FAQs", href: "/faqs" },
];

export default async function Footer() {
  const [instagramUrl, facebookUrl, tiktokUrl, youtubeUrl] = await Promise.all([
    getSiteSetting("instagramUrl"),
    getSiteSetting("facebookUrl"),
    getSiteSetting("tiktokUrl"),
    getSiteSetting("youtubeUrl"),
  ]);

  const socialLinks = buildSocialLinks({ instagramUrl, facebookUrl, tiktokUrl, youtubeUrl });

  return (
    <footer className="bg-primary pb-16 text-white lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          {/* <Link href="/" aria-label="Teyezilla Expeditions home">
            <Image
              src="/logo.png"
              alt="Teyezilla Expeditions"
              width={50}
              height={48}
              quality={70}
              className="h-12 w-auto brightness-0 invert"
            />
          </Link> */}
          <Link href="/" aria-label="Teyezilla Expeditions home" className="relative block h-12 w-[52px]">
            <Image
              src="/logo.png"
              alt="Teyezilla Expeditions"
              fill
              sizes="52px"
              quality={70}
              className="object-contain brightness-0 invert"
            />
          </Link>
          <h3 className="sr-only">Teyezilla Expeditions</h3>
          <p className="mt-3 text-sm text-white/80">Discover Africa, Your Way.</p>

          {socialLinks.length > 0 && (
            <div className="mt-6">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
                Follow Teyezilla
              </h4>
              <div className="mt-3 flex gap-3">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <FooterLinkGroup label="Explore">
          {EXPLORE_LINKS.map((link) => (
            <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
          ))}
        </FooterLinkGroup>

        <FooterLinkGroup label="Travel With Us">
          {TRAVEL_WITH_US_LINKS.map((link) => (
            <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
          ))}
        </FooterLinkGroup>

        <FooterLinkGroup label="Inspiration">
          {INSPIRATION_LINKS.map((link) => (
            <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
          ))}
        </FooterLinkGroup>

        <FooterLinkGroup label="Support">
          <li><Link href="/contact">Contact Us</Link></li>
          <li>
            <a
              href={whatsappLink("Hi! I have a question about Teyezilla Expeditions.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </li>
          <li><Link href="/booking-information">Booking Information</Link></li>
          <li><Link href="/cancellation-policy">Cancellation Policy</Link></li>
          <li><Link href="/terms">Terms & Conditions</Link></li>
          <li><Link href="/privacy-policy">Privacy Policy</Link></li>
        </FooterLinkGroup>
      </div>

      <div className="border-t border-white/20 px-6 py-6 text-center text-xs text-white/70">
        <p>© {new Date().getFullYear()} Teyezilla Expeditions. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
