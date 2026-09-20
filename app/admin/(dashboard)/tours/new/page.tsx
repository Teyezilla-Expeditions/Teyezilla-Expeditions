import PageHeader from "@/components/admin/PageHeader";
import TourForm from "@/components/admin/TourForm";
import { getDestinations } from "@/lib/destinations";
import { getActivities } from "@/lib/activities";
import { getExperienceTypes } from "@/lib/experienceTypes";
import { getSafariThemes } from "@/lib/safari";
import { getAdminVehicles } from "@/lib/admin/data/vehicles";
import { getAdminAccommodations } from "@/lib/admin/data/accommodations";
import { getMediaItems } from "@/lib/admin/data/media";
import { getAdminTours } from "@/lib/admin/data/tours";
import { getAdminJourneys } from "@/lib/admin/data/journeys";
import { getAdminBlogPosts } from "@/lib/admin/data/blog";

export default async function NewTourPage() {
  const [destinations, activities, experienceTypes, safariThemes, vehicles, accommodations, mediaItems, allTours, journeys, blogPosts] = await Promise.all([
    getDestinations(),
    getActivities(),
    getExperienceTypes(),
    getSafariThemes(),
    getAdminVehicles(),
    getAdminAccommodations(),
    getMediaItems(),
    getAdminTours(),
    getAdminJourneys(),
    getAdminBlogPosts(),
  ]);

  return (
    <div>
      <PageHeader title="Add Tour" description="Create a new tour package." />
      <TourForm
        destinations={destinations}
        activities={activities}
        experienceTypes={experienceTypes}
        safariThemes={safariThemes}
        vehicles={vehicles}
        accommodations={accommodations}
        mediaItems={mediaItems}
        otherTours={allTours}
        journeys={journeys}
        blogPosts={blogPosts}
      />
    </div>
  );
}