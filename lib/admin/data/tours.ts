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

function mapRow(row: Record<string, any>): AdminTourDetail {
  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destination_id,
    title: row.title,
    categoryLabel: row.category_label ?? "",
    heroImage: row.hero_image ?? "",
    tagline: row.tagline ?? "",
    shortDescription: row.short_description ?? "",
    overview: row.overview ?? "",
    durationDays: Number(row.duration_days ?? 0),
    durationHours: row.duration_hours != null ? Number(row.duration_hours) : null,
    priceFrom: Number(row.price_from ?? 0),
    currency: row.currency ?? "USD",
    difficulty: row.difficulty ?? "",
    featured: Boolean(row.featured),
    status: row.status ?? "draft",
    metaTitle: row.meta_title ?? "",
    metaDescription: row.meta_description ?? "",
    ogImage: row.og_image ?? "",
    inclusions: row.inclusions ?? [],
    exclusions: row.exclusions ?? [],
    itinerary: row.itinerary ?? [],
    meetingPoint: row.meeting_point ?? "",
    pickupLocations: row.pickup_locations ?? [],
    ...mapProductScalars(row),
    pricingTiers: (row.tour_pricing_tiers ?? []).map(mapPricingTierRow),
    highlights: (row.tour_highlights ?? []).map(mapHighlightRow),
    faqs: (row.tour_faqs ?? []).map(mapFaqRow),
    addons: (row.tour_addons ?? []).map(mapAddonRow),
    activityIds: (row.tour_activities ?? []).map((a: any) => a.activity_id),
    experienceTypeIds: (row.tour_experience_types ?? []).map((e: any) => e.experience_type_id),
    vehicleIds: (row.tour_vehicles ?? []).map((v: any) => v.vehicle_id),
    accommodationIds: (row.tour_accommodations ?? []).map((a: any) => a.accommodation_id),
    safariThemeIds: (row.tour_safari_themes ?? []).map((s: any) => s.safari_theme_id),
    relatedJourneyIds: [...(row.tour_related_journeys ?? [])]
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((r: any) => r.related_journey_id),
    relatedTourIds: [...(row.tour_related_tours ?? [])]
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((r: any) => r.related_tour_id),
    relatedBlogPostIds: [...(row.tour_related_blog_posts ?? [])]
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((r: any) => r.blog_post_id),
  };
}

const LIST_SELECT = `
  id, slug, destination_id, title, category_label, product_type, hero_image,
  tagline, short_description, duration_days, duration_hours, price_from, currency,
  difficulty, featured, status, meta_title, meta_description, og_image
`;

function mapListRow(row: any): Tour {
  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destination_id,
    title: row.title,
    categoryLabel: row.category_label ?? "",
    productType: row.product_type ?? "experience",
    heroImage: row.hero_image ?? "",
    tagline: row.tagline ?? "",
    shortDescription: row.short_description ?? "",
    durationDays: Number(row.duration_days ?? 0),
    durationHours: row.duration_hours != null ? Number(row.duration_hours) : null,
    priceFrom: Number(row.price_from ?? 0),
    currency: row.currency ?? "USD",
    difficulty: row.difficulty ?? "",
    featured: Boolean(row.featured),
    status: row.status ?? "draft",
    metaTitle: row.meta_title ?? "",
    metaDescription: row.meta_description ?? "",
    ogImage: row.og_image ?? "",
  };
}

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

  return data.map(mapListRow);
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

  return { items: data.map(mapListRow), total: count ?? 0 };
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

  return mapRow(data);
}