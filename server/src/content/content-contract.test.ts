import { describe, expect, it } from "vitest";

import {
  CONTENT_SECTION_KEYS,
  parseContentDocument,
} from "./content-contract.ts";

const documents = {
  hero: {
    browserTitle: "Portfolio",
    name: "Jhon Lay Lopez",
    brand: "JL",
    role: "Software Engineer",
    heroRole: "Application Developer",
    location: "Pasay, Philippines",
    navigation: [
      { label: "Home", href: "/#home" },
      { label: "About", href: "/#about" },
      { label: "Projects", href: "/#projects" },
      { label: "Experience", href: "/#experience" },
      { label: "Skills", href: "/#skills" },
      { label: "Contact", href: "/#contact" },
    ],
    sectionTag: "Open file",
    title: "Web & Mobile",
    description: "Practical software.",
    resumeButtonLabel: "Download Portfolio",
    scrollCue: "Descend",
  },
  about: {
    eyebrow: "About",
    title: "The Case File",
    lead: "Profile",
    paragraphs: ["About paragraph"],
    facts: [{ label: "Status", value: "Open" }],
    stamp: "Cleared",
    photoCaptionPrefix: "Subject",
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
    eyebrow: "Timeline",
    title: "Timeline",
    lead: "Experience",
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
    eyebrow: "Tools",
    title: "Technologies",
    lead: "Technology list",
    groups: [
      {
        category: "Frontend",
        technologies: [{ name: "React", iconKey: "react" }],
      },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Open a Line",
    availability: "Available",
    noteTitle: "Leave Word",
    noteBody: "Send a message.",
    email: "owner@example.com",
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com/example",
        iconKey: "github",
      },
    ],
    footerPrimary: "Copyright",
    footerSecondary: "Built with care.",
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
