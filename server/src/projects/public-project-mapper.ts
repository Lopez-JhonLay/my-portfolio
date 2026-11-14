import { PROJECT_CATEGORY_ORDER } from "./project-contract.ts";
import type { ProjectGallery, ProjectVersion } from "./project-contract.ts";
import {
  publicFeaturedProjectsSchema,
  publicProjectCardSchema,
  publicProjectDetailSchema,
  publicProjectGroupsSchema,
} from "./public-project-contract.ts";
import type {
  PublicFeaturedProjectsDto,
  PublicProjectCardDto,
  PublicProjectDetailDto,
  PublicProjectGroupsDto,
} from "./public-project-contract.ts";

/** Projects one canonical published version onto the public card allowlist. */
export function mapPublicProjectCard(
  project: ProjectVersion,
  gallery: ProjectGallery = [],
): PublicProjectCardDto {
  const cover = gallery.find(({ isCover }) => isCover);
  return publicProjectCardSchema.parse({
    number: project.number,
    name: project.name,
    category: project.category,
    description: project.description,
    ...(project.role === undefined ? {} : { role: project.role }),
    tech: [...project.tech],
    ...(project.repo === undefined ? {} : { repo: project.repo }),
    ...(project.liveUrl === undefined ? {} : { liveUrl: project.liveUrl }),
    slug: project.slug,
    ...(cover === undefined
      ? {}
      : { cover: { mediaId: cover.mediaId, altText: cover.altText } }),
  });
}

/** Projects one canonical published version onto the public detail allowlist. */
export function mapPublicProjectDetail(
  project: ProjectVersion,
  gallery: ProjectGallery = [],
): PublicProjectDetailDto {
  return publicProjectDetailSchema.parse({
    ...mapPublicProjectCard(project, gallery),
    ...(project.longDescriptionMarkdown === undefined
      ? {}
      : { longDescriptionMarkdown: project.longDescriptionMarkdown }),
    gallery: gallery.map(({ mediaId, altText }) => ({ mediaId, altText })),
  });
}

/** Maps published versions into fixed category and within-group order. */
export function mapPublicProjectGroups(
  projects: readonly ProjectVersion[],
  galleries: ReadonlyMap<string, ProjectGallery> = new Map(),
): PublicProjectGroupsDto {
  const orderedProjects = [...projects].sort(
    (left, right) => left.groupOrder - right.groupOrder,
  );

  return publicProjectGroupsSchema.parse([
    {
      category: PROJECT_CATEGORY_ORDER[0],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[0])
        .map((project) =>
          mapPublicProjectCard(project, galleries.get(project.slug)),
        ),
    },
    {
      category: PROJECT_CATEGORY_ORDER[1],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[1])
        .map((project) =>
          mapPublicProjectCard(project, galleries.get(project.slug)),
        ),
    },
    {
      category: PROJECT_CATEGORY_ORDER[2],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[2])
        .map((project) =>
          mapPublicProjectCard(project, galleries.get(project.slug)),
        ),
    },
  ]);
}

/** Maps exactly three published versions without changing featured-slot order. */
export function mapPublicFeaturedProjects(
  projects: readonly [ProjectVersion, ProjectVersion, ProjectVersion],
  galleries: ReadonlyMap<string, ProjectGallery> = new Map(),
): PublicFeaturedProjectsDto {
  return publicFeaturedProjectsSchema.parse({
    projects: projects.map((project) =>
      mapPublicProjectCard(project, galleries.get(project.slug)),
    ),
  });
}
