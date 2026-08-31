import Link from "next/link";
import Image from "next/image";
import type { Journey } from "@/lib/journeys";
import WishlistButton from "./WishlistButton";

export default function JourneyCard({
  journey,
  priority = false,
}: {
  journey: Journey;
  priority?: boolean;
}) {
  const destinationNames = journey.destinations.map((d) => d.countryName).join(" · ");

  return (
    <div className="card group flex h-full flex-col overflow-hidden">
      <Link href={`/journeys/${journey.slug}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-secondary/10">
          {journey.heroImage && (
            <Image
              src={journey.heroImage}
              alt={journey.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-110"
            />
          )}
          {destinationNames && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
              {destinationNames}
            </span>
          )}
          <WishlistButton id={journey.id} label={journey.title} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/journeys/${journey.slug}`}>
          <h3 className="font-heading text-lg font-semibold text-foreground hover:text-primary">
            {journey.title}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-foreground/70">{journey.tagline || journey.shortDescription}</p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <span>{journey.durationDays} day{journey.durationDays !== 1 ? "s" : ""}</span>
            <span className="font-heading font-semibold text-accent-ink">
              From {journey.currency} {journey.priceFrom.toLocaleString()}
            </span>
          </div>
          <Link href={`/journeys/${journey.slug}`} className="btn-primary mt-4 block w-full px-3 py-2 text-center text-sm">
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
}