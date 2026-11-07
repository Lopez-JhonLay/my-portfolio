import { PROJECT_CATEGORY_ORDER } from "./project-contract.ts";
import type { ProjectVersion } from "./project-contract.ts";
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
): PublicProjectCardDto {
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
  });
}

/** Projects one canonical published version onto the public detail allowlist. */
export function mapPublicProjectDetail(
  project: ProjectVersion,
): PublicProjectDetailDto {
  return publicProjectDetailSchema.parse({
    ...mapPublicProjectCard(project),
    ...(project.longDescriptionMarkdown === undefined
      ? {}
      : { longDescriptionMarkdown: project.longDescriptionMarkdown }),
  });
}

/** Maps published versions into fixed category and within-group order. */
export function mapPublicProjectGroups(
  projects: readonly ProjectVersion[],
): PublicProjectGroupsDto {
  const orderedProjects = [...projects].sort(
    (left, right) => left.groupOrder - right.groupOrder,
  );

  return publicProjectGroupsSchema.parse([
    {
      category: PROJECT_CATEGORY_ORDER[0],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[0])
        .map(mapPublicProjectCard),
    },
    {
      category: PROJECT_CATEGORY_ORDER[1],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[1])
        .map(mapPublicProjectCard),
    },
    {
      category: PROJECT_CATEGORY_ORDER[2],
      projects: orderedProjects
        .filter(({ category }) => category === PROJECT_CATEGORY_ORDER[2])
        .map(mapPublicProjectCard),
    },
  ]);
}

/** Maps exactly three published versions without changing featured-slot order. */
export function mapPublicFeaturedProjects(
  projects: readonly [ProjectVersion, ProjectVersion, ProjectVersion],
): PublicFeaturedProjectsDto {
  return publicFeaturedProjectsSchema.parse({
    projects: projects.map(mapPublicProjectCard),
  });
}
