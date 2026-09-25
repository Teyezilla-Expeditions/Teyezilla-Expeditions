"use client";

import { useState } from "react";
import type { Destination } from "@/types";
import type { Activity } from "@/lib/activities";
import type { ExperienceType } from "@/lib/experienceTypes";
import type { SafariTheme } from "@/lib/safari";
import type { AdminVehicle } from "@/lib/admin/data/vehicles";
import type { AdminAccommodation } from "@/lib/admin/data/accommodations";
import type { AdminTourDetail, ItineraryDay } from "@/lib/admin/data/tours";
import type { PricingTierInput, HighlightInput, FaqInput, AddonInput } from "@/lib/admin/actions/productShared";
import type { MediaItem } from "@/lib/admin/data/media";
import { createTour, updateTour, deleteTour } from "@/lib/admin/actions/tours";
import ItineraryEditor from "./ItineraryEditor";
import PricingTiersEditor from "./PricingTiersEditor";
import HighlightsEditor from "./HighlightsEditor";
import FaqsEditor from "./FaqsEditor";
import AddonsEditor from "./AddonsEditor";
import ActivitiesPicker from "./ActivitiesPicker";
import ExperienceTypesPicker from "./ExperienceTypesPicker";
import VehiclesPicker from "./VehiclesPicker";
import AccommodationsPicker from "./AccommodationsPicker";
import MediaPickerField from "./MediaPickerField";
import RelatedContentEditor from "./RelatedContentEditor";
import { useToast } from "./Toast";

export default function TourForm({
  existingTour,
  destinations,
  activities,
  experienceTypes,
  safariThemes,
  vehicles,
  accommodations,
  mediaItems,
  otherTours,
  journeys,
  blogPosts,
}: {
  existingTour?: AdminTourDetail;
  destinations: Destination[];
  activities: Activity[];
  experienceTypes: ExperienceType[];
  safariThemes: SafariTheme[];
  vehicles: AdminVehicle[];
  accommodations: AdminAccommodation[];
  mediaItems: MediaItem[];
  otherTours: { id: string; title: string }[];
  journeys: { id: string; title: string }[];
  blogPosts: { id: string; title: string }[];
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState(existingTour?.heroImage ?? "");
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    existingTour?.itinerary?.length ? existingTour.itinerary : [{ day: 1, title: "", description: "" }]
  );
  const [pricingTiers, setPricingTiers] = useState<PricingTierInput[]>(
    existingTour?.pricingTiers.map((t) => ({ ...t })) ?? []
  );
  const [highlights, setHighlights] = useState<HighlightInput[]>(
    existingTour?.highlights.map((h) => ({ ...h })) ?? []
  );
  const [faqs, setFaqs] = useState<FaqInput[]>(existingTour?.faqs.map((f) => ({ ...f })) ?? []);
  const [addons, setAddons] = useState<AddonInput[]>(existingTour?.addons.map((a) => ({ ...a })) ?? []);
  const [activityIds, setActivityIds] = useState<string[]>(existingTour?.activityIds ?? []);
  const [experienceTypeIds, setExperienceTypeIds] = useState<string[]>(existingTour?.experienceTypeIds ?? []);
  const [safariThemeIds, setSafariThemeIds] = useState<string[]>(existingTour?.safariThemeIds ?? []);
  const [vehicleIds, setVehicleIds] = useState<string[]>(existingTour?.vehicleIds ?? []);
  const [accommodationIds, setAccommodationIds] = useState<string[]>(existingTour?.accommodationIds ?? []);
  const [relatedJourneyIds, setRelatedJourneyIds] = useState<string[]>(existingTour?.relatedJourneyIds ?? []);
  const [relatedTourIds, setRelatedTourIds] = useState<string[]>(existingTour?.relatedTourIds ?? []);
  const [relatedBlogPostIds, setRelatedBlogPostIds] = useState<string[]>(existingTour?.relatedBlogPostIds ?? []);

  function toggleSafariTheme(id: string) {
    setSafariThemeIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const splitLines = (v: FormDataEntryValue | null) =>
      String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    const splitCommas = (v: FormDataEntryValue | null) =>
      String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

    const input = {
      title: String(formData.get("tourTitle") ?? ""),
      slug: existingTour?.slug ?? "",
      destinationId: String(formData.get("destinationId") ?? ""),
      productType: String(formData.get("productType") ?? "experience"),
      difficulty: String(formData.get("difficulty") ?? ""),
      durationDays: Number(formData.get("durationDays") ?? 0),
      durationHours: formData.get("durationHours") ? Number(formData.get("durationHours")) : null,
      priceFrom: Number(formData.get("priceFrom") ?? 0),
      currency: String(formData.get("currency") ?? "USD"),
      heroImage,
      tagline: String(formData.get("tagline") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      overview: String(formData.get("overview") ?? ""),
      inclusions: splitLines(formData.get("inclusions")),
      exclusions: splitLines(formData.get("exclusions")),
      itinerary,
      meetingPoint: String(formData.get("meetingPoint") ?? ""),
      pickupLocations: splitCommas(formData.get("pickupLocations")),
      minGuests: formData.get("minGuests") ? Number(formData.get("minGuests")) : null,
      maxGuests: formData.get("maxGuests") ? Number(formData.get("maxGuests")) : null,
      fitnessLevel: String(formData.get("fitnessLevel") ?? ""),
      bestFor: splitCommas(formData.get("bestFor")),
      languages: splitCommas(formData.get("languages")),
      transportation: String(formData.get("transportation") ?? ""),
      guideInfo: String(formData.get("guideInfo") ?? ""),
      foodAndDrinks: String(formData.get("foodAndDrinks") ?? ""),
      importantInfo: splitLines(formData.get("importantInfo")),
      bringList: splitCommas(formData.get("bringList")),
      cancellationPolicy: splitLines(formData.get("cancellationPolicy")),
      availabilityNote: String(formData.get("availabilityNote") ?? ""),
      teyezillaMoment: String(formData.get("teyezillaMoment") ?? ""),
      metaTitle: String(formData.get("metaTitle") ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? ""),
      ogImage: String(formData.get("ogImage") ?? ""),
      pricingTiers,
      highlights,
      faqs,
      addons,
      activityIds,
      experienceTypeIds,
      safariThemeIds,
      vehicleIds,
      accommodationIds,
      relatedJourneyIds,
      relatedTourIds,
      relatedBlogPostIds,
      featured: formData.get("featured") === "on",
      status: String(formData.get("status") ?? "draft"),
    };

    try {
      if (existingTour) {
        await updateTour(existingTour.id, input);
      } else {
        await createTour(input);
      }
      // On success the action redirects to /admin/tours; if we get here
      // without a redirect having thrown, something unexpected happened.
    } catch (err) {
      // Next.js redirect() throws a special error to trigger navigation;
      // let that propagate instead of treating it as a failure.
      if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      const message = err instanceof Error ? err.message : "Failed to save tour.";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingTour) return;
    if (!confirm(`Delete "${existingTour.title}"? This can't be undone.`)) return;
    setSaving(true);
    try {
      await deleteTour(existingTour.id);
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      const message = err instanceof Error ? err.message : "Failed to delete tour.";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}
      <p className="text-xs text-foreground/50">Fields marked with <span className="text-error">*</span> are required.</p>

      <section className="card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Basic Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tourTitle" className="text-xs font-medium text-foreground/60">Tour Title <span className="text-error">*</span></label>
            <input id="tourTitle" name="tourTitle" required defaultValue={existingTour?.title} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="destinationId" className="text-xs font-medium text-foreground/60">Destination <span className="text-error">*</span></label>
            <select id="destinationId" name="destinationId" required defaultValue={existingTour?.destinationId} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.countryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="productType" className="text-xs font-medium text-foreground/60">Product Type</label>
            <select id="productType" name="productType" defaultValue={existingTour?.productType ?? "experience"} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="experience">Experience</option>
              <option value="safari">Safari</option>
              <option value="private_travel">Private Travel</option>
            </select>
          </div>
          <div>
            <label htmlFor="difficulty" className="text-xs font-medium text-foreground/60">Difficulty (optional)</label>
            <select id="difficulty" name="difficulty" defaultValue={existingTour?.difficulty ?? ""} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Not set</option>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Challenging</option>
            </select>
          </div>
          <div>
            <label htmlFor="durationDays" className="text-xs font-medium text-foreground/60">
              Duration (days), leave as 0 if using hours instead
            </label>
            <input id="durationDays" name="durationDays" type="number" min={0} defaultValue={existingTour?.durationDays} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="durationHours" className="text-xs font-medium text-foreground/60">
              Duration (hours), for short experiences under a day
            </label>
            <input
              id="durationHours"
              name="durationHours"
              type="number"
              min={1}
              defaultValue={existingTour?.durationHours ?? undefined}
              placeholder="e.g. 4"
              className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="priceFrom" className="text-xs font-medium text-foreground/60">Price From</label>
            <input id="priceFrom" name="priceFrom" type="number" min={0} defaultValue={existingTour?.priceFrom} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="currency" className="text-xs font-medium text-foreground/60">Currency</label>
            <select id="currency" name="currency" defaultValue={existingTour?.currency ?? "USD"} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option>USD</option>
              <option>EUR</option>
              <option>KES</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <MediaPickerField id="heroImage" name="heroImage" label="Hero Image URL" value={heroImage} onChange={setHeroImage} mediaItems={mediaItems} />
        </div>
        <div className="mt-4">
          <label htmlFor="tagline" className="text-xs font-medium text-foreground/60">Tagline</label>
          <p className="mt-0.5 text-[11px] text-foreground/40">Short and punchy -- this is what shows on the card, not the Overview below.</p>
          <input id="tagline" name="tagline" maxLength={80} defaultValue={existingTour?.tagline} placeholder="e.g. Track the big five across endless plains" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="mt-4">
          <label htmlFor="shortDescription" className="text-xs font-medium text-foreground/60">Overview</label>
          <p className="mt-0.5 text-[11px] text-foreground/40">Shown on the detail page, not the card -- 250 characters max.</p>
          <textarea id="shortDescription" name="shortDescription" maxLength={250} defaultValue={existingTour?.shortDescription} rows={3} className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="mt-4">
          <label htmlFor="overview" className="text-xs font-medium text-foreground/60">Tour Story (Full Description)</label>
          <textarea id="overview" name="overview" defaultValue={existingTour?.overview} rows={4} className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </section>

      <HighlightsEditor highlights={highlights} onChange={setHighlights} />

      <FaqsEditor faqs={faqs} onChange={setFaqs} />

      <section className="card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Inclusions & Exclusions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="inclusions" className="text-xs font-medium text-foreground/60">Inclusions (one per line)</label>
            <textarea id="inclusions" name="inclusions" rows={4} defaultValue={existingTour?.inclusions?.join("\n")} placeholder="Airport transfers&#10;All game drives&#10;Park fees" className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="exclusions" className="text-xs font-medium text-foreground/60">Exclusions (one per line)</label>
            <textarea id="exclusions" name="exclusions" rows={4} defaultValue={existingTour?.exclusions?.join("\n")} placeholder="International flights&#10;Travel insurance&#10;Tips" className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
      </section>

      <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />

      <PricingTiersEditor tiers={pricingTiers} onChange={setPricingTiers} />
      <AddonsEditor addons={addons} onChange={setAddons} />
      <ActivitiesPicker activities={activities} selectedIds={activityIds} onChange={setActivityIds} />
      <ExperienceTypesPicker experienceTypes={experienceTypes} selectedIds={experienceTypeIds} onChange={setExperienceTypeIds} />

      <section className="card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Safari Themes</h2>
        <p className="mt-1 text-xs text-foreground/50">
          Only relevant if this tour&rsquo;s Product Type above is set to Safari -- controls which
          Signature Safari filter cards on the public Safari page this tour appears under.
        </p>
        {safariThemes.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">No safari themes set up yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {safariThemes.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={safariThemeIds.includes(t.id)} onChange={() => toggleSafariTheme(t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        )}
      </section>

      <VehiclesPicker vehicles={vehicles} selectedIds={vehicleIds} onChange={setVehicleIds} />
      <AccommodationsPicker accommodations={accommodations} selectedIds={accommodationIds} onChange={setAccommodationIds} />

      <RelatedContentEditor
        journeys={journeys.map((j) => ({ id: j.id, label: j.title }))}
        tours={otherTours.map((t) => ({ id: t.id, label: t.title }))}
        blogPosts={blogPosts.map((p) => ({ id: p.id, label: p.title }))}
        relatedJourneyIds={relatedJourneyIds}
        onChangeRelatedJourneyIds={setRelatedJourneyIds}
        relatedTourIds={relatedTourIds}
        onChangeRelatedTourIds={setRelatedTourIds}
        relatedBlogPostIds={relatedBlogPostIds}
        onChangeRelatedBlogPostIds={setRelatedBlogPostIds}
      />

      <section className="card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Logistics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="meetingPoint" className="text-xs font-medium text-foreground/60">Meeting Point</label>
            <input id="meetingPoint" name="meetingPoint" defaultValue={existingTour?.meetingPoint} placeholder="Jomo Kenyatta International Airport" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="pickupLocations" className="text-xs font-medium text-foreground/60">Pickup Locations (comma-separated)</label>
            <input id="pickupLocations" name="pickupLocations" defaultValue={existingTour?.pickupLocations?.join(", ")} placeholder="Nairobi CBD hotels, JKIA" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="minGuests" className="text-xs font-medium text-foreground/60">Min Guests</label>
            <input id="minGuests" name="minGuests" type="number" min={1} defaultValue={existingTour?.minGuests ?? undefined} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="maxGuests" className="text-xs font-medium text-foreground/60">Max Guests</label>
            <input id="maxGuests" name="maxGuests" type="number" min={1} defaultValue={existingTour?.maxGuests ?? undefined} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="fitnessLevel" className="text-xs font-medium text-foreground/60">Fitness Level</label>
            <input id="fitnessLevel" name="fitnessLevel" defaultValue={existingTour?.fitnessLevel} placeholder="Easy" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="bestFor" className="text-xs font-medium text-foreground/60">Best For (comma-separated)</label>
            <input id="bestFor" name="bestFor" defaultValue={existingTour?.bestFor?.join(", ")} placeholder="Couples, Families, Culture Lovers" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="languages" className="text-xs font-medium text-foreground/60">Languages (comma-separated)</label>
            <input id="languages" name="languages" defaultValue={existingTour?.languages?.join(", ")} placeholder="English" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="transportation" className="text-xs font-medium text-foreground/60">Transportation</label>
            <input id="transportation" name="transportation" defaultValue={existingTour?.transportation} placeholder="Private 4x4 safari vehicle" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="guideInfo" className="text-xs font-medium text-foreground/60">Guide Information</label>
            <input id="guideInfo" name="guideInfo" defaultValue={existingTour?.guideInfo} placeholder="Professional Teyezilla guide" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="foodAndDrinks" className="text-xs font-medium text-foreground/60">Food & Drinks</label>
            <input id="foodAndDrinks" name="foodAndDrinks" defaultValue={existingTour?.foodAndDrinks} placeholder="Bottled drinking water included" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="availabilityNote" className="text-xs font-medium text-foreground/60">Availability</label>
            <input id="availabilityNote" name="availabilityNote" defaultValue={existingTour?.availabilityNote} placeholder="Year-round, subject to conditions" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="bringList" className="text-xs font-medium text-foreground/60">Bring With You (comma-separated)</label>
            <input id="bringList" name="bringList" defaultValue={existingTour?.bringList?.join(", ")} placeholder="Comfortable shoes, Sun protection, Hat" className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="importantInfo" className="text-xs font-medium text-foreground/60">Important Information / Please Note (one per line)</label>
          <textarea
            id="importantInfo"
            name="importantInfo"
            defaultValue={existingTour?.importantInfo?.join("\n")}
            rows={6}
            placeholder={"Hotel pickup available from selected Nairobi locations.\nStandard pickup time is approximately 6:30 AM.\nNot recommended for guests with serious back or heart conditions."}
            className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="cancellationPolicy" className="text-xs font-medium text-foreground/60">Cancellation & Refund Policy (one per line)</label>
          <textarea
            id="cancellationPolicy"
            name="cancellationPolicy"
            defaultValue={existingTour?.cancellationPolicy?.join("\n")}
            rows={4}
            placeholder={"Free cancellation up to 14 days before departure.\n50% refund for cancellations within 7-14 days.\nNo refund within 7 days of departure."}
            className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="teyezillaMoment" className="text-xs font-medium text-foreground/60">Your Teyezilla Moment (standalone highlighted callout)</label>
          <textarea id="teyezillaMoment" name="teyezillaMoment" defaultValue={existingTour?.teyezillaMoment} rows={2} className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">SEO</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="metaTitle" className="text-xs font-medium text-foreground/60">Meta Title</label>
            <p className="mt-0.5 text-[11px] text-foreground/40">Aim for ~50–60 characters (longer titles get truncated in Google search results).</p>
            <input id="metaTitle" name="metaTitle" defaultValue={existingTour?.metaTitle} className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="metaDescription" className="text-xs font-medium text-foreground/60">Meta Description</label>
            <p className="mt-0.5 text-[11px] text-foreground/40">Aim for ~150–160 characters (Google&rsquo;s snippet cuts off beyond this).</p>
            <textarea id="metaDescription" name="metaDescription" defaultValue={existingTour?.metaDescription} rows={2} className="mt-1 w-full rounded-2xl border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="ogImage" className="text-xs font-medium text-foreground/60">Social Share Image URL</label>
            <input id="ogImage" name="ogImage" defaultValue={existingTour?.ogImage} placeholder="https://..." className="mt-1 w-full rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <label htmlFor="featured" className="flex items-center gap-2 text-sm">
            <input id="featured" name="featured" type="checkbox" defaultChecked={existingTour?.featured} /> Featured tour
          </label>
          <select id="status" name="status" defaultValue={existingTour?.status ?? "draft"} className="rounded-full border border-secondary/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          {existingTour && (
            <button type="button" onClick={handleDelete} disabled={saving} className="rounded-full border-2 border-error px-5 py-2 text-sm font-medium text-error hover:bg-error hover:text-white transition-colors disabled:opacity-50">
              Delete
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving…" : "Save Tour"}
          </button>
        </div>
      </section>
    </form>
  );
}