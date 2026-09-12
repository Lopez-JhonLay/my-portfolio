import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { experience } from "@/data/portfolio";

export function Experience() {
  return (
    <motion.section
      className="noir-section"
      id="experience"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">03 - Field Notes</div>
      <h2 className="section-title">
        <Briefcase />
        Timeline
      </h2>
      <p className="section-lead">
        A record of my professional experience and education.
      </p>

      <div className="timeline">
        {experience.map((item) => (
          <article className="timeline-item" key={`${item.role}-${item.date}`}>
            <div className="timeline-marker" aria-hidden="true" />
            <div>
              <div className="timeline-date type">{item.date}</div>
              <h3>{item.role}</h3>
              <p className="timeline-org">
                {item.organization} - {item.location}
              </p>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
