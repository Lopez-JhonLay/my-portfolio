import { describe, expect, it } from "vitest";

import {
  CONTENT_SECTION_KEYS,
  parseContentDocument,
} from "./content-contract.ts";

const documents = {
  hero: {
    name: "Jhon Lay Lopez",
    role: "Software Engineer",
    heroRole: "Application Developer",
    location: "Pasay, Philippines",
    description: "Practical software.",
  },
  about: {
    paragraphs: ["About paragraph"],
    facts: [{ label: "Status", value: "Open" }],
  },
  "projects-presentation": {
    eyebrow: "Projects",
    title: "Open Case Files",
    lead: "Proof of work",
    allProjectsLinkLabel: "View All Projects",
    backLinkLabel: "Back to Home",
    groups: [
      {
        category: "Personal Project",
        eyebrow: "Personal",
        title: "Personal Projects",
      },
      { category: "Work Project", eyebrow: "Work", title: "Work Projects" },
      {
        category: "Capstone Project",
        eyebrow: "Team",
        title: "Capstone Projects",
      },
    ],
  },
  timeline: {
    entries: [
      {
        role: "Developer",
        organization: "Company",
        location: "City",
        date: "2026",
        detail: "Built software.",
      },
    ],
  },
  technologies: {
    groups: [
      {
        category: "Frontend",
        technologies: [{ name: "React", iconKey: "react" }],
      },
    ],
  },
  contact: {
    availability: "Available",
    noteBody: "Send a message.",
    email: "owner@example.com",
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com/example",
        iconKey: "github",
      },
    ],
  },
  "media-resume": {
    profileImageMediaId: null,
    resumeMediaId: null,
  },
} as const;

describe("content contracts", () => {
  it("accepts one strict document for every registered section", () => {
    for (const sectionKey of CONTENT_SECTION_KEYS) {
      expect(parseContentDocument(sectionKey, documents[sectionKey])).toEqual(
        documents[sectionKey],
      );
    }
  });

  it("strips legacy presentation copy from personal content documents", () => {
    expect(
      parseContentDocument("about", {
        ...documents.about,
        eyebrow: "Theme label",
        title: "Theme title",
        lead: "Theme lead",
        stamp: "Theme stamp",
        photoCaptionPrefix: "Theme caption",
      }),
    ).toEqual(documents.about);
  });

  it("rejects unsafe links and duplicate ordered values", () => {
    expect(() =>
      parseContentDocument("contact", {
        ...documents.contact,
        socialLinks: [
          { label: "Bad", href: "javascript:alert(1)", iconKey: "external" },
        ],
      }),
    ).toThrow();
    expect(() =>
      parseContentDocument("technologies", {
        ...documents.technologies,
        groups: [
          {
            category: "Frontend",
            technologies: [{ name: "React" }, { name: "react" }],
          },
        ],
      }),
    ).toThrow();
  });
});
