import type { Activity } from "@/lib/activities";
import type { Vehicle } from "@/lib/vehicles";
import type { Accommodation } from "@/lib/accommodations";
import type { Tour } from "@/types";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import {
  mapPricingTierRow,
  mapHighlightRow,
  mapFaqRow,
  mapAddonRow,
  mapProductScalars,
  type ItineraryDay,
  type PricingTier,
  type ProductHighlight,
  type ProductFaq,
  type ProductAddon,
  type ProductScalars,
} from "@/lib/productShared";

export type { ItineraryDay, PricingTier, ProductHighlight, ProductFaq, ProductAddon };

export interface JourneyType {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Journey {
  id: string;
  slug: string;
  title: string;
  heroImage: string;
  tagline: string;
  shortDescription: string;
  durationDays: number;
  priceFrom: number;
  currency: string;
  featured: boolean;
  destinations: { id: string; countryName: string; slug: string }[];
  journeyTypes: string[];
}

export interface JourneyDetail extends Journey, ProductScalars {
  overview: string;
  difficulty: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  meetingPoint: string;
  pickupLocations: string[];
  status: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  pricingTiers: PricingTier[];
  highlights: ProductHighlight[];
  faqs: ProductFaq[];
  addons: ProductAddon[];
  activities: Activity[];
  vehicles: Vehicle[];
  accommodations: Accommodation[];
  includedTours: Tour[];
  // Staff-curated "Bring This to Life" picks, in display order. Empty means
  // no manual picks yet -- callers should fall back to the destination-match
  // auto-compute (getJourneysByDestination/getRelatedTours/getRelatedBlogPosts).
  relatedJourneyIds: string[];
  relatedTourIds: string[];
  relatedBlogPostIds: string[];
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

function mapRow(row: Record<string, unknown>): Journey {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    heroImage: (row.hero_image as string) ?? "",
    tagline: (row.tagline as string) ?? "",
    shortDescription: (row.short_description as string) ?? "",
    durationDays: Number(row.duration_days ?? 0),
    priceFrom: Number(row.price_from ?? 0),
    currency: (row.currency as string) ?? "USD",
    featured: Boolean(row.featured),
    destinations: ((row.journey_destinations as Record<string, unknown>[]) ?? [])
      .filter((jd) => jd.destinations)
      .map((jd) => ({
        id: jd.destination_id as string,
        countryName: (jd.destinations as Record<string, unknown>).country_name as string,
        slug: (jd.destinations as Record<string, unknown>).slug as string,
      })),
    journeyTypes: ((row.journey_journey_types as Record<string, unknown>[]) ?? [])
      .map((jjt) => (jjt.journey_types as Record<string, unknown> | undefined)?.name as string | undefined)
      .filter(Boolean) as string[],
  };
}

const SELECT = `
  id, slug, title, hero_image, tagline, short_description, duration_days, price_from, currency, featured,
  journey_destinations(destination_id, destinations(country_name, slug)),
  journey_journey_types(journey_types(name))
`;

export async function getJourneyTypes(): Promise<JourneyType[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[journeys] Supabase not configured, returning no journey types.");
    return [];
  }

  const { data, error } = await supabase.from("journey_types").select("id, name, slug, description");

  if (error || !data) {
    console.warn("[journeys] Supabase query failed:", error?.message);
    return [];
  }

  return data;
}

export async function getJourneys(): Promise<Journey[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[journeys] Supabase not configured, returning no journeys.");
    return [];
  }

  const { data, error } = await supabase.from("journeys").select(SELECT);

  if (error || !data) {
    console.warn("[journeys] Supabase query failed:", error?.message);
    return [];
  }

  return data.map((row) => mapRow(row as Record<string, unknown>));
}

// RLS already restricts anon reads to status = 'published', so this only
// needs to filter on the featured flag.
export async function getFeaturedJourneys(): Promise<Journey[]> {
  const all = await getJourneys();
  return all.filter((j) => j.featured);
}

// Powers "related journeys" sections on tour/destination/blog pages.
export async function getJourneysByDestination(
  destinationId: string,
  excludeSlug?: string,
  limit = 3
): Promise<Journey[]> {
  const all = await getJourneys();
  return all
    .filter((j) => j.slug !== excludeSlug && j.destinations.some((d) => d.id === destinationId))
    .slice(0, limit);
}

// Powers staff-curated "Bring This to Life" picks -- returns published
// journeys in the same order as `ids` (the junction table's display_order).
export async function getJourneysByIds(ids: string[]): Promise<Journey[]> {
  if (ids.length === 0) return [];

  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[journeys] Supabase not configured, returning no journeys.");
    return [];
  }

  const { data, error } = await supabase.from("journeys").select(SELECT).in("id", ids);

  if (error || !data) {
    console.warn("[journeys] Supabase query failed:", error?.message);
    return [];
  }

  const byId = new Map(
    data.map((row) => [(row as Record<string, unknown>).id as string, mapRow(row as Record<string, unknown>)])
  );
  return ids.map((id) => byId.get(id)).filter((j): j is Journey => Boolean(j));
}

const DETAIL_SELECT = `
  *,
  journey_destinations(destination_id, destinations(country_name, slug)),
  journey_journey_types(journey_types(name)),
  journey_pricing_tiers(*),
  journey_highlights(*),
  journey_faqs(*),
  journey_addons(*),
  journey_activities(activities(id, name, slug, description, icon)),
  journey_vehicles(vehicles(id, name, slug, vehicle_type, seats, description, features, image)),
  journey_accommodations(accommodations(id, destination_id, name, slug, description, hero_image, tier)),
  journey_tours(display_order, tours(*)),
  journey_related_journeys!journey_related_journeys_journey_id_fkey(display_order, related_journey_id),
  journey_related_tours(display_order, tour_id),
  journey_related_blog_posts(display_order, blog_post_id)
`;

export async function getJourneyBySlug(slug: string): Promise<JourneyDetail | undefined> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[journeys] Supabase not configured, returning no journey.");
    return undefined;
  }

  const { data, error } = await supabase.from("journeys").select(DETAIL_SELECT).eq("slug", slug).maybeSingle();

  if (error || !data) {
    if (error) console.warn("[journeys] Supabase query failed:", error.message);
    return undefined;
  }

  const row = data as Record<string, unknown>;
  return {
    ...mapRow(row),
    overview: (row.overview as string) ?? "",
    difficulty: (row.difficulty as string) ?? "",
    inclusions: (row.inclusions as string[]) ?? [],
    exclusions: (row.exclusions as string[]) ?? [],
    itinerary: (row.itinerary as ItineraryDay[]) ?? [],
    meetingPoint: (row.meeting_point as string) ?? "",
    pickupLocations: (row.pickup_locations as string[]) ?? [],
    status: (row.status as string) ?? "draft",
    metaTitle: (row.meta_title as string) ?? "",
    metaDescription: (row.meta_description as string) ?? "",
    ogImage: (row.og_image as string) ?? "",
    ...mapProductScalars(row),
    pricingTiers: ((row.journey_pricing_tiers as Record<string, unknown>[]) ?? [])
      .map(mapPricingTierRow)
      .sort((a: PricingTier, b: PricingTier) => a.displayOrder - b.displayOrder),
    highlights: ((row.journey_highlights as Record<string, unknown>[]) ?? [])
      .map(mapHighlightRow)
      .sort((a: ProductHighlight, b: ProductHighlight) => a.displayOrder - b.displayOrder),
    faqs: ((row.journey_faqs as Record<string, unknown>[]) ?? [])
      .map(mapFaqRow)
      .sort((a: ProductFaq, b: ProductFaq) => a.displayOrder - b.displayOrder),
    addons: ((row.journey_addons as Record<string, unknown>[]) ?? [])
      .map(mapAddonRow)
      .sort((a: ProductAddon, b: ProductAddon) => a.displayOrder - b.displayOrder),
    activities: ((row.journey_activities as Record<string, unknown>[]) ?? [])
      .map((a) => a.activities as Record<string, unknown> | undefined)
      .filter((a): a is Record<string, unknown> => Boolean(a))
      .map((a) => ({
        id: a.id as string,
        name: a.name as string,
        slug: a.slug as string,
        description: (a.description as string) ?? "",
        icon: (a.icon as string) ?? "",
      })),
    vehicles: ((row.journey_vehicles as Record<string, unknown>[]) ?? [])
      .map((v) => v.vehicles as Record<string, unknown> | undefined)
      .filter((v): v is Record<string, unknown> => Boolean(v))
      .map((v) => ({
        id: v.id as string,
        name: v.name as string,
        slug: v.slug as string,
        vehicleType: (v.vehicle_type as string) ?? "",
        seats: (v.seats as number | null) ?? null,
        description: (v.description as string) ?? "",
        features: (v.features as string[]) ?? [],
        image: (v.image as string) ?? "",
      })),
    accommodations: ((row.journey_accommodations as Record<string, unknown>[]) ?? [])
      .map((a) => a.accommodations as Record<string, unknown> | undefined)
      .filter((a): a is Record<string, unknown> => Boolean(a))
      .map((a) => ({
        id: a.id as string,
        destinationId: a.destination_id as string,
        name: a.name as string,
        slug: (a.slug as string) ?? "",
        description: (a.description as string) ?? "",
        heroImage: (a.hero_image as string) ?? "",
        tier: (a.tier as string) ?? "",
      })),
    includedTours: [...((row.journey_tours as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((jt) => jt.tours as Record<string, unknown> | undefined)
      .filter((t): t is Record<string, unknown> => Boolean(t))
      .map(mapTourRow),
    relatedJourneyIds: [...((row.journey_related_journeys as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.related_journey_id as string),
    relatedTourIds: [...((row.journey_related_tours as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.tour_id as string),
    relatedBlogPostIds: [...((row.journey_related_blog_posts as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.blog_post_id as string),
  };
}