import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navItems, profile } from "@/data/portfolio";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="noir-nav">
      <a className="noir-brand" href="#home" onClick={() => setIsOpen(false)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2l1.2 6.4L20 6l-5.4 4.4L21 14l-7-.8 2 6.8-4-4.6L8 20l2-6.8-7 .8 6.4-3.6L4 6l6.8 2.4L12 2Z"
          />
        </svg>
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
