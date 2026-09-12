import { ThemeProvider } from "@/components/ui/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";
import { AllProjects } from "@/components/pages/AllProjects";
import { Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Projects />
      <Experience />
      <Skills />
      <Contact />
    </main>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/all-projects" element={<AllProjects />} />
      </Routes>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
