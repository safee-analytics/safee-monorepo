import { Get, Query, Route, Security, Tags } from "tsoa";
import { Controller } from "@tsoa/runtime";
import { connect } from "@safee/database";

const { drizzle } = connect("slug-controller");

interface SlugResponse {
  nextSlug: string;
}

@Route("organizations/slugs")
@Tags("Organizations")
export class OrganizationSlugController extends Controller {
  /**
   * Get the next available slug for an organization name
   * Returns the slug with an incremented number if conflicts exist
   * @param baseSlug The base slug to check (e.g., "acme")
   * @returns The next available slug (e.g., "acme-3" if "acme" and "acme-2" exist)
   */
  @Get("next")
  @Security("jwt")
  public async getNextSlug(@Query() baseSlug: string): Promise<SlugResponse> {
    // Query for all slugs that match the pattern: baseSlug or baseSlug-*
    const orgs = await drizzle.query.organizations.findMany({
      where: (organizations, { or, eq, like }) =>
        or(eq(organizations.slug, baseSlug), like(organizations.slug, `${baseSlug}-%`)),
      columns: {
        slug: true,
      },
    });

    if (orgs.length === 0) {
      // No conflicts, use the base slug
      return { nextSlug: baseSlug };
    }

    // Extract numbers from slugs: "acme-2" -> 2, "acme-3" -> 3
    // Only count slugs that match the pattern exactly (baseSlug or baseSlug-<number>)
    const numbers = orgs
      .map((org) => {
        if (org.slug === baseSlug) return 1;

        const match = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`).exec(org.slug);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    // If no existing slugs with this base, return the base slug
    if (numbers.length === 0) {
      return { nextSlug: baseSlug };
    }

    // Find max number and increment
    const maxNumber = Math.max(...numbers);
    const nextSlug = `${baseSlug}-${maxNumber + 1}`;

    return { nextSlug };
  }
}
