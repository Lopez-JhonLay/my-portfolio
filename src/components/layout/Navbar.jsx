import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { BrandLogo } from "@/components/layout/brand-logo";
import PropTypes from "prop-types";

/** Thin bar along the navbar's bottom edge that fills as the page scrolls. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: reduceMotion ? scrollYProgress : smoothProgress }}
      aria-hidden="true"
    />
  );
}

export function Navbar({ brand, navigation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="noir-nav">
      <a
        className="noir-brand"
        href="/#home"
        aria-label={`${brand} - Home`}
        onClick={() => setIsOpen(false)}
      >
        <BrandLogo className="noir-brand-logo" />
      </a>

      <nav className="noir-desktop-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="noir-nav-actions">
        <ThemeSwitcher />
        <button
          className="noir-menu-button"
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen ? (
        <nav className="noir-mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      <ScrollProgress />
    </header>
  );
}

Navbar.propTypes = {
  brand: PropTypes.string.isRequired,
  navigation: PropTypes.arrayOf(
    PropTypes.shape({ href: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
};
