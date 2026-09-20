"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePublicSite } from "@/lib/revalidate";
import { redirectWithSaved } from "./saved-redirect";

type SupabaseLike = NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>;
import {
  syncPricingTiers,
  syncHighlights,
  syncFaqs,
  syncAddons,
  syncActivities,
  syncExperienceTypes,
  syncVehicles,
  syncAccommodations,
  productScalarsToRow,
  type PricingTierInput,
  type HighlightInput,
  type FaqInput,
  type AddonInput,
  type ProductScalarsInput,
} from "./productShared";

export interface TourInput extends ProductScalarsInput {
  title: string;
  slug: string;
  destinationId: string;
  difficulty: string;
  durationDays: number;
  durationHours: number | null;
  heroImage: string;
  priceFrom: number;
  currency: string;
  tagline: string;
  shortDescription: string;
  overview: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; description: string }[];
  meetingPoint: string;
  pickupLocations: string[];
  featured: boolean;
  status: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  pricingTiers: PricingTierInput[];
  highlights: HighlightInput[];
  faqs: FaqInput[];
  addons: AddonInput[];
  activityIds: string[];
  experienceTypeIds: string[];
  vehicleIds: string[];
  accommodationIds: string[];
  safariThemeIds: string[];
  relatedJourneyIds: string[];
  relatedTourIds: string[];
  relatedBlogPostIds: string[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toRow(input: TourInput) {
  return {
    title: input.title,
    slug: input.slug || slugify(input.title),
    destination_id: input.destinationId,
    difficulty: input.difficulty || null,
    duration_days: input.durationDays,
    duration_hours: input.durationHours,
    hero_image: input.heroImage,
    price_from: input.priceFrom,
    currency: input.currency,
    tagline: input.tagline || null,
    short_description: input.shortDescription.slice(0, 250),
    overview: input.overview,
    inclusions: input.inclusions,
    exclusions: input.exclusions,
    itinerary: input.itinerary,
    meeting_point: input.meetingPoint,
    pickup_locations: input.pickupLocations,
    featured: input.featured,
    status: input.status,
    meta_title: input.metaTitle,
    meta_description: input.metaDescription,
    og_image: input.ogImage,
    ...productScalarsToRow(input),
  };
}

async function syncRelatedTable(
  supabase: SupabaseLike,
  table: string,
  tourId: string,
  relatedIds: string[],
  relatedColumn: string
) {
  const { error: deleteError } = await supabase.from(table).delete().eq("tour_id", tourId);
  if (deleteError) throw new Error(deleteError.message);
  if (relatedIds.length === 0) return;

  const { error } = await supabase.from(table).insert(
    relatedIds.map((relatedId, index) => ({
      tour_id: tourId,
      [relatedColumn]: relatedId,
      display_order: index,
    }))
  );
  if (error) throw new Error(error.message);
}

async function syncSafariThemes(supabase: SupabaseLike, tourId: string, safariThemeIds: string[]) {
  const { error: deleteError } = await supabase.from("tour_safari_themes").delete().eq("tour_id", tourId);
  if (deleteError) throw new Error(deleteError.message);
  if (safariThemeIds.length === 0) return;

  const { error } = await supabase
    .from("tour_safari_themes")
    .insert(safariThemeIds.map((safariThemeId) => ({ tour_id: tourId, safari_theme_id: safariThemeId })));
  if (error) throw new Error(error.message);
}

async function syncTourRelations(supabase: SupabaseLike, tourId: string, input: TourInput) {
  await Promise.all([
    syncPricingTiers(supabase, "tour_pricing_tiers", "tour_id", tourId, input.pricingTiers),
    syncHighlights(supabase, "tour_highlights", "tour_id", tourId, input.highlights),
    syncFaqs(supabase, "tour_faqs", "tour_id", tourId, input.faqs),
    syncAddons(supabase, "tour_addons", "tour_id", tourId, input.addons),
    syncActivities(supabase, "tour_activities", "tour_id", tourId, input.activityIds),
    syncExperienceTypes(supabase, "tour_experience_types", "tour_id", tourId, input.experienceTypeIds),
    syncVehicles(supabase, "tour_vehicles", "tour_id", tourId, input.vehicleIds),
    syncAccommodations(supabase, "tour_accommodations", "tour_id", tourId, input.accommodationIds),
    syncSafariThemes(supabase, tourId, input.safariThemeIds),
    syncRelatedTable(supabase, "tour_related_journeys", tourId, input.relatedJourneyIds, "related_journey_id"),
    syncRelatedTable(supabase, "tour_related_tours", tourId, input.relatedTourIds, "related_tour_id"),
    syncRelatedTable(supabase, "tour_related_blog_posts", tourId, input.relatedBlogPostIds, "blog_post_id"),
  ]);
}

export async function createTour(input: TourInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const { data, error } = await supabase.from("tours").insert(toRow(input)).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create tour.");

  await syncTourRelations(supabase, data.id, input);

  revalidatePath("/admin/tours");
  revalidatePublicSite();
  redirectWithSaved("/admin/tours", `"${input.title}" created.`);
}

export async function updateTour(id: string, input: TourInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const { error } = await supabase.from("tours").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);

  await syncTourRelations(supabase, id, input);

  revalidatePath("/admin/tours");
  revalidatePublicSite();
  redirectWithSaved("/admin/tours", `"${input.title}" saved.`);
}

function friendlyTourDeleteError(error: { code?: string; message: string }): string {
  if (error.code === "23503") {
    return "Can't delete this tour -- it's still referenced by a booking, review, or inquiry. Remove those first.";
  }
  return error.message;
}

export async function deleteTour(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const { error } = await supabase.from("tours").delete().eq("id", id);
  if (error) throw new Error(friendlyTourDeleteError(error));

  revalidatePath("/admin/tours");
  revalidatePublicSite();
  redirectWithSaved("/admin/tours", "Tour deleted.");
}