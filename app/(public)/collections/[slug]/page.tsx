import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getCollections } from "@/lib/collections";
import TourCard from "@/components/TourCard";
import JourneyCard from "@/components/JourneyCard";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd, collectionPageJsonLd } from "@/lib/jsonld";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.metaTitle || collection.name,
    description: collection.metaDescription || collection.description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: collection.metaTitle || collection.name,
      description: collection.metaDescription || collection.description,
      images: collection.ogImage ? [collection.ogImage] : [collection.heroImage],
    },
  };
}

// Mirrors the pattern from app/(public)/safari/page.tsx -- both grids
// share one count (see sharedGridClass below) so a lone card in one
// section doesn't render narrower than a full row in the other.
function gridColsClass(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-2xl mx-auto";
  if (count === 2) return "sm:grid-cols-2";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

function headingAlignClass(count: number): string {
  return count <= 1 ? "text-center" : "";
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const breadcrumbJsonLd = breadcrumbListJsonLd([
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: collection.name, path: `/collections/${collection.slug}` },
  ]);

  const collectionPageJsonLdData = collectionPageJsonLd({
    name: collection.name,
    description: collection.description,
    path: `/collections/${collection.slug}`,
    items: [
      ...collection.tours.map((t) => ({ name: t.title, path: `/tours/${t.slug}` })),
      ...collection.journeys.map((j) => ({ name: j.title, path: `/journeys/${j.slug}` })),
    ],
  });

  const hasItems = collection.tours.length > 0 || collection.journeys.length > 0;

  // Both sections share one column count (based on whichever has more
  // items) rather than sizing independently -- otherwise a lone card in
  // one section renders narrower than a full row in the other, even
  // though they're stacked on the same page.
  const sharedGridClass = gridColsClass(Math.max(collection.tours.length, collection.journeys.length));

  return (
    <div className="section">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionPageJsonLdData} />
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        The Teyezilla Collections
      </span>
      <h1 className="mt-3 h1-page">{collection.name}</h1>
      <p className="mt-3 max-w-2xl text-foreground/70">{collection.description}</p>

      {collection.tours.length > 0 && (
        <div className="mt-10">
          <h2 className={`font-heading text-xl font-semibold text-foreground ${headingAlignClass(collection.tours.length)}`}>Tours</h2>
          <div className={`mt-4 grid gap-6 ${sharedGridClass}`}>
            {collection.tours.map((tour, i) => (
              <TourCard key={tour.id} tour={tour} priority={i === 0} />
            ))}
          </div>
        </div>
      )}

      {collection.journeys.length > 0 && (
        <div className="mt-10">
          <h2 className={`font-heading text-xl font-semibold text-foreground ${headingAlignClass(collection.journeys.length)}`}>Journeys</h2>
          <div className={`mt-4 grid gap-6 ${sharedGridClass}`}>
            {collection.journeys.map((journey, i) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                priority={collection.tours.length === 0 && i === 0}
              />
            ))}
          </div>
        </div>
      )}

      {!hasItems && (
        <p className="mt-10 text-sm text-foreground/50">More journeys and tours coming soon to this collection.</p>
      )}
    </div>
  );
}