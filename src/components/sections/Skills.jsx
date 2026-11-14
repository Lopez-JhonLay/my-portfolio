import { Code2 } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { TechnologiesBodySkeleton } from "@/components/sections/content-skeletons";
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
const skillIcons = {
  git: FaGitAlt, javascript: FaJs, react: FaReact, nextjs: SiNextdotjs,
  vue: SiVuedotjs, "material-ui": SiMui, "tailwind-css": SiTailwindcss,
  typescript: SiTypescript, nodejs: SiNodedotjs, nestjs: SiNestjs,
  "cloudflare-workers": SiCloudflareworkers, postgresql: SiPostgresql,
  bigquery: SiGooglebigquery, "google-cloud": SiGooglecloud, cloudflare: SiCloudflare,
  "github-actions": SiGithubactions, github: SiGithub, jwt: SiJsonwebtokens,
};

export function Skills({ content, loading = false }) {
  return (
    <motion.section
      className="noir-section"
      id="skills"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">{content.eyebrow}</div>
      <h2 className="section-title">
        <Code2 />
        {content.title}
      </h2>
      <p className="section-lead">{content.lead}</p>

      {loading ? <TechnologiesBodySkeleton /> : <div className="arsenal-grid">
        {content.groups.map((group) => (
          <article className="weapon-card" key={group.category}>
            <h3>{group.category}</h3>
            <div className="skill-list">
              {group.technologies.map((technology) => {
                const Icon = skillIcons[technology.iconKey];
                return (
                  <span className="skill-pill" key={technology.name}>
                    {Icon ? <Icon aria-hidden="true" /> : null}
                    {technology.name}
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>}
    </motion.section>
  );
}

Skills.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({ category: PropTypes.string.isRequired, technologies: PropTypes.arrayOf(PropTypes.shape({ iconKey: PropTypes.string, name: PropTypes.string.isRequired })).isRequired })).isRequired,
    lead: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  loading: PropTypes.bool,
};
