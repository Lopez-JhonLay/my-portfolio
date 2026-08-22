import { profile } from "@/data/portfolio";

export function Footer() {
  return (
    <footer className="noir-footer">
      <p className="type">(c) 2026 {profile.name.toUpperCase()} - CASE FILE ACTIVE</p>
      <p>Built in the dark. Reads fine in the light.</p>
    </footer>
  );
}
