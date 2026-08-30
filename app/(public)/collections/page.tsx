import type { Metadata } from "next";
import Link from "next/link";
import { getCollections } from "@/lib/collections";
import { getSiteSetting, resolveSiteText } from "@/lib/settings";
import { COLLECTIONS_PAGE_DEFAULTS, type CollectionsPageKey } from "@/lib/homepageContent";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Teyezilla Collections",
  description: "Curated collections, each a distinct way to experience Africa with Teyezilla Expeditions.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 3600;

const TEXT_KEYS = Object.keys(COLLECTIONS_PAGE_DEFAULTS) as CollectionsPageKey[];

export default async function CollectionsPage() {
  const [collections, ...textValues] = await Promise.all([
    getCollections(),
    ...TEXT_KEYS.map((key) => getSiteSetting(key)),
  ]);
  const text = resolveSiteText(COLLECTIONS_PAGE_DEFAULTS, TEXT_KEYS, textValues);

  // The following is the original version of the page, which was replaced with a new design. It is kept here for reference in case we want to revert to it in the future.
  // return (
  //   <div className="section">
  //     <h1 className="h1-page">{text.collectionsHeadline}</h1>
  //     {/* Count-based, so it's generated here rather than being part of the
  //         editable copy below -- a static admin-entered string would drift
  //         out of sync with the real collections count. */}
  //     <p className="mt-3 max-w-2xl text-foreground/70">
  //       {collections.length} curated way{collections.length !== 1 ? "s" : ""} to experience the magic of Africa,
  //       each one hand-curated by our team.
  //     </p>
  //     <p className="mt-3 max-w-2xl whitespace-pre-line text-foreground/70">{text.collectionsIntro}</p>
  //     <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  //       {collections.map((collection) => (
  //         <Link key={collection.id} href={`/collections/${collection.slug}`} className="card p-6">
  //           <h2 className="font-heading text-xl font-semibold text-foreground">{collection.name}</h2>
  //           <p className="mt-2 text-sm text-foreground/70">{collection.description}</p>
  //         </Link>
  //       ))}
  //       {collections.length === 0 && <p className="text-sm text-foreground/50">No collections yet.</p>}
  //     </div>
  //   </div>
  // );
  return (
    <div className="section">
      <h1 className="h1-page">{text.collectionsHeadline}</h1>
      {/* Count-based, so it's generated here rather than being part of the
          editable copy below -- a static admin-entered string would drift
          out of sync with the real collections count. */}
      <p className="mt-3 max-w-2xl text-foreground/70">
        {collections.length} curated way{collections.length !== 1 ? "s" : ""} to experience the magic of Africa,
        each one hand-curated by our team.
      </p>
      <p className="mt-3 max-w-2xl whitespace-pre-line text-foreground/70">{text.collectionsIntro}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, i) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="card overflow-hidden p-0"
          >
            {collection.heroImage && (
              <div className="relative h-48 w-full">
                <Image
                  src={collection.heroImage}
                  alt={collection.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">{collection.name}</h2>
              <p className="mt-2 text-sm text-foreground/70">{collection.description}</p>
            </div>
          </Link>
        ))}
        {collections.length === 0 && <p className="text-sm text-foreground/50">No collections yet.</p>}
      </div>
    </div>
  );
}
