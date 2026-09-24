import type { Tour } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
  type PricingTierRow,
  type ProductHighlightRow,
  type ProductFaqRow,
  type ProductAddonRow,
} from "@/lib/productShared";

export type { ItineraryDay };

export interface AdminTourDetail extends Tour, ProductScalars {
  overview: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  meetingPoint: string;
  pickupLocations: string[];
  pricingTiers: PricingTier[];
  highlights: ProductHighlight[];
  faqs: ProductFaq[];
  addons: ProductAddon[];
  activityIds: string[];
  experienceTypeIds: string[];
  vehicleIds: string[];
  accommodationIds: string[];
  safariThemeIds: string[];
  relatedJourneyIds: string[];
  relatedTourIds: string[];
  relatedBlogPostIds: string[];
}

function mapRow(row: Record<string, unknown>): AdminTourDetail {
  return {
    id: row.id as string,
    slug: row.slug as string,
    destinationId: row.destination_id as string,
    title: row.title as string,
    categoryLabel: (row.category_label as string) ?? "",
    heroImage: (row.hero_image as string) ?? "",
    tagline: (row.tagline as string) ?? "",
    shortDescription: (row.short_description as string) ?? "",
    overview: (row.overview as string) ?? "",
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
    inclusions: (row.inclusions as string[]) ?? [],
    exclusions: (row.exclusions as string[]) ?? [],
    itinerary: (row.itinerary as ItineraryDay[]) ?? [],
    meetingPoint: (row.meeting_point as string) ?? "",
    pickupLocations: (row.pickup_locations as string[]) ?? [],
    ...mapProductScalars(row),
    pricingTiers: ((row.tour_pricing_tiers as PricingTierRow[]) ?? []).map(mapPricingTierRow),
    highlights: ((row.tour_highlights as ProductHighlightRow[]) ?? []).map(mapHighlightRow),
    faqs: ((row.tour_faqs as ProductFaqRow[]) ?? []).map(mapFaqRow),
    addons: ((row.tour_addons as ProductAddonRow[]) ?? []).map(mapAddonRow),
    activityIds: ((row.tour_activities as Record<string, unknown>[]) ?? []).map((a) => a.activity_id as string),
    experienceTypeIds: ((row.tour_experience_types as Record<string, unknown>[]) ?? []).map(
      (e) => e.experience_type_id as string
    ),
    vehicleIds: ((row.tour_vehicles as Record<string, unknown>[]) ?? []).map((v) => v.vehicle_id as string),
    accommodationIds: ((row.tour_accommodations as Record<string, unknown>[]) ?? []).map(
      (a) => a.accommodation_id as string
    ),
    safariThemeIds: ((row.tour_safari_themes as Record<string, unknown>[]) ?? []).map(
      (s) => s.safari_theme_id as string
    ),
    relatedJourneyIds: [...((row.tour_related_journeys as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.related_journey_id as string),
    relatedTourIds: [...((row.tour_related_tours as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.related_tour_id as string),
    relatedBlogPostIds: [...((row.tour_related_blog_posts as Record<string, unknown>[]) ?? [])]
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((r) => r.blog_post_id as string),
  };
}

const LIST_SELECT = `
  id, slug, destination_id, title, category_label, product_type, hero_image,
  tagline, short_description, duration_days, duration_hours, price_from, currency,
  difficulty, featured, status, meta_title, meta_description, og_image
`;

function mapListRow(row: Record<string, unknown>): Tour {
  return {
    id: row.id as string,
    slug: row.slug as string,
    destinationId: row.destination_id as string,
    title: row.title as string,
    categoryLabel: (row.category_label as string) ?? "",
    productType: (row.product_type as Tour["productType"]) ?? "experience",
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

// Uses the authenticated staff session (not the public client) because
// tours' public-read RLS only exposes status='published' rows; the admin
// list needs drafts too, which the "Staff can manage tours" policy grants
// via its unconditional using(true). Mirrors getAdminJourneys() -- the
// public getTours() (lib/tours.ts) being used here instead was the actual
// cause of newly-created (draft) tours never appearing in Tour Management.
export async function getAdminTours(): Promise<Tour[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    console.warn("[admin/tours] Supabase not configured, returning no tours.");
    return [];
  }

  const { data, error } = await supabase
    .from("tours")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("[admin/tours] Supabase query failed:", error?.message);
    return [];
  }

  return data.map((row) => mapListRow(row as Record<string, unknown>));
}

export interface AdminToursQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: "created_at" | "title" | "price_from";
  sortDir?: "asc" | "desc";
  destinationId?: string;
  featured?: boolean;
}

export async function getAdminToursPaginated(query: AdminToursQuery): Promise<{ items: Tour[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    console.warn("[admin/tours] Supabase not configured, returning no tours.");
    return { items: [], total: 0 };
  }

  let q = supabase.from("tours").select(LIST_SELECT, { count: "exact" });
  if (query.search) q = q.ilike("title", `%${query.search}%`);
  if (query.destinationId) q = q.eq("destination_id", query.destinationId);
  if (query.featured !== undefined) q = q.eq("featured", query.featured);
  q = q.order(query.sortBy ?? "created_at", { ascending: query.sortDir === "asc" });

  const from = (query.page - 1) * query.pageSize;
  const { data, error, count } = await q.range(from, from + query.pageSize - 1);

  if (error || !data) {
    console.warn("[admin/tours] Supabase query failed:", error?.message);
    return { items: [], total: 0 };
  }

  return { items: data.map((row) => mapListRow(row as Record<string, unknown>)), total: count ?? 0 };
}

const DETAIL_SELECT = `
  *,
  tour_pricing_tiers(*),
  tour_highlights(*),
  tour_faqs(*),
  tour_addons(*),
  tour_activities(activity_id),
  tour_experience_types(experience_type_id),
  tour_vehicles(vehicle_id),
  tour_accommodations(accommodation_id),
  tour_safari_themes(safari_theme_id),
  tour_related_journeys(related_journey_id, display_order),
  tour_related_tours!tour_related_tours_tour_id_fkey(related_tour_id, display_order),
  tour_related_blog_posts(blog_post_id, display_order)
`;

// Admin edit form needs fields (inclusions/exclusions/itinerary/logistics/
// pricing tiers/highlights/add-ons/activities) that the public Tour type doesn't carry.
export async function getAdminTourBySlug(slug: string): Promise<AdminTourDetail | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    console.warn("[admin/tours] Supabase not configured, returning no tour.");
    return undefined;
  }

  const { data, error } = await supabase.from("tours").select(DETAIL_SELECT).eq("slug", slug).maybeSingle();

  if (error || !data) {
    if (error) console.warn("[admin/tours] Supabase query failed:", error.message);
    return undefined;
  }

  return mapRow(data as Record<string, unknown>);
}