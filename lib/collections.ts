import type { Tour } from "@/types";
import type { Journey } from "@/lib/journeys";
import { getJourneysByIds } from "@/lib/journeys";
import { getSupabasePublicClient } from "@/lib/supabase/public";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  heroImage: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface CollectionWithTours extends Collection {
  tours: Tour[];
  journeys: Journey[];
}

function mapTourRow(row: Record<string, unknown>): Tour {
  return {
    id: row.id as string,
    slug: row.slug as string,
    destinationId: row.destination_id as string,
    title: row.title as string,
    categoryLabel: (row.category_label as string) ?? "",
    productType: (row.product_type as string) ?? "experience",
    heroImage: (row.hero_image as string) ?? "",
    tagline: (row.tagline as string) ?? "",
    shortDescription: (row.short_description as string) ?? "",
    durationDays: Number(row.duration_days ?? 0),
    durationHours: row.duration_hours != null ? Number(row.duration_hours) : null,
    priceFrom: Number(row.price_from ?? 0),
    currency: (row.currency as string) ?? "USD",
    difficulty: (row.difficulty as Tour["difficulty"]) ?? "",
    featured: Boolean(row.featured),
    status: (row.status as Tour["status"]) ?? "draft",
    metaTitle: (row.meta_title as string) ?? "",
    metaDescription: (row.meta_description as string) ?? "",
    ogImage: (row.og_image as string) ?? "",
  };
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[collections] Supabase not configured, returning none.");
    return [];
  }

  const { data, error } = await supabase
    .from("collections")
    .select("id, name, slug, description, hero_image, meta_title, meta_description, og_image")
    .order("display_order");

  if (error || !data) {
    console.warn("[collections] Supabase query failed:", error?.message);
    return [];
  }

  return (data as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    description: (c.description as string) ?? "",
    heroImage: (c.hero_image as string) ?? "",
    metaTitle: (c.meta_title as string) ?? "",
    metaDescription: (c.meta_description as string) ?? "",
    ogImage: (c.og_image as string) ?? "",
  }));
}

export async function getCollectionBySlug(slug: string): Promise<CollectionWithTours | undefined> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[collections] Supabase not configured, returning none.");
    return undefined;
  }

  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, name, slug, description, hero_image, meta_title, meta_description, og_image, collection_tours(tours(*)), collection_journeys(display_order, journey_id)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[collections] Supabase query failed:", error.message);
    return undefined;
  }

  const row = data as Record<string, unknown>;
  const collectionTours = (row.collection_tours as { tours: Record<string, unknown> | null }[] | null) ?? [];
  const collectionJourneys =
    (row.collection_journeys as { display_order: number; journey_id: string }[] | null) ?? [];

  const orderedJourneyIds = [...collectionJourneys]
    .sort((a, b) => a.display_order - b.display_order)
    .map((cj) => cj.journey_id);

  // getJourneysByIds already filters to published (via RLS on getJourneys)
  // and preserves the display_order we pass in.
  const journeys = await getJourneysByIds(orderedJourneyIds);

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? "",
    heroImage: (row.hero_image as string) ?? "",
    metaTitle: (row.meta_title as string) ?? "",
    metaDescription: (row.meta_description as string) ?? "",
    ogImage: (row.og_image as string) ?? "",
    tours: collectionTours.map((ct) => ct.tours).filter((t): t is Record<string, unknown> => Boolean(t)).map(mapTourRow),
    journeys,
  };
}