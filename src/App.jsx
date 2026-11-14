import { ThemeProvider } from "@/components/ui/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";
import { ContentLoadNotice } from "@/components/sections/ContentLoadNotice";
import { AllProjects } from "@/components/pages/AllProjects";
import { Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import PropTypes from "prop-types";
import { about, contactContent, heroContent, technologiesContent, timelineContent } from "@/data/portfolio";
import { usePublicContent } from "@/features/content/use-public-content";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:3000";
const ProjectDetail = lazy(() =>
  import("@/components/pages/ProjectDetail").then((module) => ({
    default: module.ProjectDetail,
  })),
);

function HomePage({ hero, aboutContent, contact, timeline, technologies, media, apiOrigin, contentError, contentLoading, onContentRetry }) {
  return (
    <main>
      {contentError ? <ContentLoadNotice onRetry={onContentRetry} /> : null}
      <Hero content={hero} loading={contentLoading} resumeUrl={media?.resumeMediaId ? `${apiOrigin}/api/media/${media.resumeMediaId}` : undefined} />
      <About content={aboutContent} identity={hero} loading={contentLoading} profilePhotoUrl={media?.profileImageMediaId ? `${apiOrigin}/api/media/${media.profileImageMediaId}` : undefined} />
      <Projects />
      <Experience content={timeline} loading={contentLoading} />
      <Skills content={technologies} loading={contentLoading} />
      <Contact content={contact} loading={contentLoading} location={hero.location} />
    </main>
  );
}

HomePage.propTypes = {
  aboutContent: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  contentError: PropTypes.bool.isRequired,
  contentLoading: PropTypes.bool.isRequired,
  hero: PropTypes.shape({ location: PropTypes.string.isRequired }).isRequired,
  onContentRetry: PropTypes.func.isRequired,
  technologies: PropTypes.object.isRequired,
  media: PropTypes.object,
  apiOrigin: PropTypes.string.isRequired,
  timeline: PropTypes.object.isRequired,
};

function App() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
  const published = usePublicContent(apiOrigin);
  const hero = { ...heroContent, ...published.sections.hero };
  const aboutSection = { ...about, ...published.sections.about };
  const contact = { ...contactContent, ...published.sections.contact };
  const timeline = { ...timelineContent, ...published.sections.timeline };
  const technologies = {
    ...technologiesContent,
    ...published.sections.technologies,
  };
  const media = published.sections["media-resume"];

  useEffect(() => {
    document.title = heroContent.browserTitle;
  }, []);

  return (
    <ThemeProvider>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Navbar brand={heroContent.brand} navigation={heroContent.navigation} />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              hero={hero}
              aboutContent={aboutSection}
              contact={contact}
              timeline={timeline}
              technologies={technologies}
              media={media}
              apiOrigin={apiOrigin}
              contentError={published.status === "error"}
              contentLoading={published.status === "loading"}
              onContentRetry={published.retry}
            />
          }
        />
        <Route path="/all-projects" element={<AllProjects />} />
        <Route
          path="/projects/:slug"
          element={
            <Suspense fallback={<main className="project-detail"><p>Loading Project…</p></main>}>
              <ProjectDetail />
            </Suspense>
          }
        />
      </Routes>
      <Footer content={contactContent} />
    </ThemeProvider>
  );
}

export default App;
