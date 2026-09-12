import { profile } from "@/data/portfolio";

export function Footer() {
  return (
    <footer className="noir-footer">
      <p className="type">(c) 2026 {profile.name} - Case file active</p>
      <p>Built in the dark. Reads fine in the light.</p>
    </footer>
  );
}
