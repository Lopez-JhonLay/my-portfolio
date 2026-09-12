import { Code2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  FaGitAlt,
  FaJs,
  FaReact,
} from "react-icons/fa";
import {
  SiCloudflare,
  SiCloudflareworkers,
  SiGithub,
  SiGithubactions,
  SiGooglebigquery,
  SiGooglecloud,
  SiJsonwebtokens,
  SiMui,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";
import { skillGroups } from "@/data/portfolio";

const skillIcons = {
  Git: FaGitAlt,
  JavaScript: FaJs,
  React: FaReact,
  "Next.js": SiNextdotjs,
  "Vue.js": SiVuedotjs,
  "Material UI": SiMui,
  "Tailwind CSS": SiTailwindcss,
  TypeScript: SiTypescript,
  "Node.js": SiNodedotjs,
  NestJS: SiNestjs,
  "Cloudflare Workers": SiCloudflareworkers,
  PostgreSQL: SiPostgresql,
  BigQuery: SiGooglebigquery,
  "Google Cloud Platform": SiGooglecloud,
  Cloudflare: SiCloudflare,
  "GitHub Actions": SiGithubactions,
  GitHub: SiGithub,
  JWT: SiJsonwebtokens,
};

export function Skills() {
  return (
    <motion.section
      className="noir-section"
      id="skills"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">04 - Tools of the Trade</div>
      <h2 className="section-title">
        <Code2 />
        The Arsenal
      </h2>
      <p className="section-lead">
        Technologies I use across frontend, backend, data, cloud, and testing.
      </p>

      <div className="arsenal-grid">
        {skillGroups.map((group) => (
          <article className="weapon-card" key={group.category}>
            <h3>{group.category}</h3>
            <div className="skill-list">
              {group.skills.map((skill) => {
                const Icon = skillIcons[skill];
                return (
                  <span className="skill-pill" key={skill}>
                    {Icon ? <Icon aria-hidden="true" /> : null}
                    {skill}
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
