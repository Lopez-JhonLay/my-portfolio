import { Code2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  FaAngular,
  FaBootstrap,
  FaCss3Alt,
  FaGitAlt,
  FaHtml5,
  FaJs,
  FaPhp,
  FaReact,
} from "react-icons/fa";
import {
  SiExpress,
  SiMongodb,
  SiMysql,
  SiPostman,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { skillGroups } from "@/data/portfolio";

const skillIcons = {
  Angular: FaAngular,
  "Bootstrap": FaBootstrap,
  "CSS3": FaCss3Alt,
  Git: FaGitAlt,
  HTML5: FaHtml5,
  JavaScript: FaJs,
  PHP: FaPhp,
  React: FaReact,
  Express: SiExpress,
  MongoDB: SiMongodb,
  MySQL: SiMysql,
  Postman: SiPostman,
  "Tailwind CSS": SiTailwindcss,
  TypeScript: SiTypescript,
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
        Grouped for quick scanning, with labels kept visible because recruiters
        read faster than icons.
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
