import { Menu, X } from "lucide-react";
import { FaSpider } from "react-icons/fa";
import { useState } from "react";
import { navItems, profile } from "@/data/portfolio";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="noir-nav">
      <a className="noir-brand" href="/#home" onClick={() => setIsOpen(false)}>
        <FaSpider aria-hidden="true" />
        <span>{profile.brand}</span>
      </a>

      <nav className="noir-desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
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
          {navItems.map((item) => (
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
    </header>
  );
}
