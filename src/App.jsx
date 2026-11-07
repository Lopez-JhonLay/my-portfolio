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
import { useEffect } from "react";
import PropTypes from "prop-types";
import { about, contactContent, heroContent } from "@/data/portfolio";
import { usePublicContent } from "@/features/content/use-public-content";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:3000";

function HomePage({ hero, aboutContent, contact, contentError, onContentRetry }) {
  return (
    <main>
      {contentError ? <ContentLoadNotice onRetry={onContentRetry} /> : null}
      <Hero content={hero} />
      <About content={aboutContent} identity={hero} />
      <Projects />
      <Experience />
      <Skills />
      <Contact content={contact} location={hero.location} />
    </main>
  );
}

HomePage.propTypes = {
  aboutContent: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  contentError: PropTypes.bool.isRequired,
  hero: PropTypes.shape({ location: PropTypes.string.isRequired }).isRequired,
  onContentRetry: PropTypes.func.isRequired,
};

function App() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
  const published = usePublicContent(apiOrigin);
  const hero = published.sections.hero || heroContent;
  const aboutSection = published.sections.about || about;
  const contact = published.sections.contact || contactContent;

  useEffect(() => {
    document.title = hero.browserTitle;
  }, [hero.browserTitle]);

  return (
    <ThemeProvider>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Navbar brand={hero.brand} navigation={hero.navigation} />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              hero={hero}
              aboutContent={aboutSection}
              contact={contact}
              contentError={published.status === "error"}
              onContentRetry={published.retry}
            />
          }
        />
        <Route path="/all-projects" element={<AllProjects />} />
      </Routes>
      <Footer content={contact} />
    </ThemeProvider>
  );
}

export default App;
