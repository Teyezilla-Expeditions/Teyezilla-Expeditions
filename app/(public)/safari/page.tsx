import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedTours } from "@/lib/tours";
import { getJourneysByIds } from "@/lib/journeys";
import {
  getSafariThemes,
  getSafariGuideFaqs,
  getTourIdsBySafariThemeSlug,
  getJourneyIdsBySafariThemeSlug,
  getAllSafariJourneyIds,
} from "@/lib/safari";
import { getSiteSetting, resolveSiteText } from "@/lib/settings";
import { SAFARI_PAGE_DEFAULTS, type SafariPageKey } from "@/lib/homepageContent";
import TourCard from "@/components/TourCard";
import JourneyCard from "@/components/JourneyCard";
import JsonLd from "@/components/JsonLd";
import { faqPageJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Safari",
  description: "The art of the African safari, perfectly crafted: Wildlife & safari tours with Teyezilla Expeditions.",
  alternates: { canonical: "/safari" },
};

export const revalidate = 3600;

const TEXT_KEYS = Object.keys(SAFARI_PAGE_DEFAULTS) as SafariPageKey[];

function gridColsClass(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-2xl mx-auto";
  if (count === 2) return "sm:grid-cols-2";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

function headingAlignClass(count: number): string {
  return count <= 1 ? "text-center" : "";
}

export default async function SafariPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  const [tours, themes, faqs, themeTourIds, themeOrAllJourneyIds, ...textValues] = await Promise.all([
    getPublishedTours(),
    getSafariThemes(),
    getSafariGuideFaqs(),
    theme ? getTourIdsBySafariThemeSlug(theme) : Promise.resolve<string[] | null>(null),
    theme ? getJourneyIdsBySafariThemeSlug(theme) : getAllSafariJourneyIds(),
    ...TEXT_KEYS.map((key) => getSiteSetting(key)),
  ]);
  const text = resolveSiteText(SAFARI_PAGE_DEFAULTS, TEXT_KEYS, textValues);
  const selectedTheme = theme ? themes.find((t) => t.slug === theme) : undefined;
  const safariTours = tours
    .filter((t) => t.productType === "safari")
    .filter((t) => !themeTourIds || themeTourIds.includes(t.id));
  const safariJourneys = await getJourneysByIds(themeOrAllJourneyIds);
  const faqJsonLd = faqs.length > 0 ? faqPageJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer }))) : null;
  const hasResults = safariTours.length > 0 || safariJourneys.length > 0;

  // Both sections share one column count (based on whichever has more
  // items) rather than sizing independently -- otherwise a lone card in
  // one section renders narrower than a full row in the other, even
  // though they're stacked in the same results block.
  const sharedGridClass = gridColsClass(Math.max(safariTours.length, safariJourneys.length));

  return (
    <div>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <div className="section max-w-3xl">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{text.safariEyebrow}</span>
        <h1 className="mt-3 h1-page">
          {text.safariHeadline}
        </h1>
        <p className="mt-6 intro-text whitespace-pre-line text-foreground/70">{text.safariIntro}</p>
      </div>

      <div id="signature-safari" className="bg-secondary/10">
        <div className="section">
          <h2 className="font-heading text-2xl font-bold text-foreground">Signature Safari</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((t) => (
              <Link
                key={t.id}
                href={t.slug === theme ? "/safari#safari-results" : `/safari?theme=${t.slug}#safari-results`}
                className={`card p-5 transition-colors ${t.slug === theme ? "border-2 border-primary" : ""}`}
              >
                <h3 className="font-heading text-base font-semibold text-foreground">{t.name}</h3>
                <p className="mt-2 text-sm text-foreground/70">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div id="safari-results" className="section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {selectedTheme ? `${selectedTheme.name} Safari` : "Safari"}
          </h2>
          {selectedTheme && (
            <Link href="/safari#signature-safari" className="text-sm font-medium text-primary hover:underline">
              Clear filter ×
            </Link>
          )}
        </div>

        {safariTours.length > 0 && (
          <div className="mt-6">
            <h3 className={`font-heading text-lg font-semibold text-foreground ${headingAlignClass(safariTours.length)}`}>Tours</h3>
            <div className={`mt-4 grid gap-6 ${sharedGridClass}`}>
              {safariTours.map((tour, i) => (
                <TourCard key={tour.id} tour={tour} priority={i === 0} />
              ))}
            </div>
          </div>
        )}

        {safariJourneys.length > 0 && (
          <div className="mt-10">
            <h3 className={`font-heading text-lg font-semibold text-foreground ${headingAlignClass(safariJourneys.length)}`}>Journeys</h3>
            <div className={`mt-4 grid gap-6 ${sharedGridClass}`}>
              {safariJourneys.map((journey, i) => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  priority={safariTours.length === 0 && i === 0}
                />
              ))}
            </div>
          </div>
        )}

        {!hasResults && (
          <p className="mt-6 text-sm text-foreground/50">
            {selectedTheme ? `Nothing tagged under "${selectedTheme.name}" yet.` : "No safari tours or journeys published yet."}
          </p>
        )}
      </div>

      <div id="safari-guide" className="bg-secondary/10">
        <div className="section max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground">Safari Guide</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="card p-5">
                <h3 className="font-heading text-base font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm text-foreground/70">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}