import { getSupabasePublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database";

export interface SafariTheme {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// tour_safari_themes join table -> tour IDs tagged under a given theme.
// Used to actually filter the Safari page's tour grid when a specific
// theme is selected (e.g. from the navbar's Safari dropdown) -- the theme
// cards themselves previously had no filtering behavior at all, just an
// anchor scroll to the section.
export async function getTourIdsBySafariThemeSlug(slug: string): Promise<string[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tour_safari_themes")
    .select("tour_id, safari_themes!inner(slug)")
    .eq("safari_themes.slug", slug);

  if (error || !data) {
    console.warn("[safari] Supabase query failed:", error?.message);
    return [];
  }

  return (data as unknown as { tour_id: string }[]).map((row) => row.tour_id);
}

// journey_safari_themes join table -> journey IDs tagged under a given
// theme. Mirrors getTourIdsBySafariThemeSlug exactly; journeys have no
// separate "is this a safari" flag the way tours have productType, so
// theme assignment alone is what makes a journey a safari journey.
export async function getJourneyIdsBySafariThemeSlug(slug: string): Promise<string[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("journey_safari_themes")
    .select("journey_id, safari_themes!inner(slug)")
    .eq("safari_themes.slug", slug);

  if (error || !data) {
    console.warn("[safari] Supabase query failed:", error?.message);
    return [];
  }

  return (data as unknown as { journey_id: string }[]).map((row) => row.journey_id);
}

// Every journey ID that has at least one safari theme assigned, regardless
// of which one -- powers the unfiltered "Safari Journeys" view (no ?theme=
// in the URL), same role getPublishedTours().filter(productType === "safari")
// plays for tours, just sourced from the join table instead of a column
// since journeys don't have that flag.
export async function getAllSafariJourneyIds(): Promise<string[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("journey_safari_themes").select("journey_id");

  if (error || !data) {
    console.warn("[safari] Supabase query failed:", error?.message);
    return [];
  }

  return Array.from(new Set((data as unknown as { journey_id: string }[]).map((row) => row.journey_id)));
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export async function getSafariThemes(): Promise<SafariTheme[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[safari] Supabase not configured, returning no themes.");
    return [];
  }

  const { data, error } = await supabase
    .from("safari_themes")
    .select("id, name, slug, description")
    .order("display_order");

  if (error || !data) {
    console.warn("[safari] Supabase query failed:", error?.message);
    return [];
  }

  return (data as Pick<Tables<"safari_themes">, "id" | "name" | "slug" | "description">[]).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description ?? "",
  }));
}

export async function getSafariGuideFaqs(): Promise<Faq[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.warn("[safari] Supabase not configured, returning no FAQs.");
    return [];
  }

  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("category", "safari-guide")
    .order("display_order");

  if (error || !data) {
    console.warn("[safari] Supabase query failed:", error?.message);
    return [];
  }

  return data;
}