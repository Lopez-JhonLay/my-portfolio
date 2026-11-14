import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { TimelineBodySkeleton } from "@/components/sections/content-skeletons";

export function Experience({ content, loading = false }) {
  return (
    <motion.section
      className="noir-section"
      id="experience"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">{content.eyebrow}</div>
      <h2 className="section-title">
        <Briefcase />
        {content.title}
      </h2>
      <p className="section-lead">{content.lead}</p>

      {loading ? <TimelineBodySkeleton /> : <div className="timeline">
        {content.entries.map((item) => (
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
      </div>}
    </motion.section>
  );
}

Experience.propTypes = {
  content: PropTypes.shape({
    entries: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string.isRequired, detail: PropTypes.string.isRequired, location: PropTypes.string.isRequired, organization: PropTypes.string.isRequired, role: PropTypes.string.isRequired })).isRequired,
    eyebrow: PropTypes.string.isRequired,
    lead: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  loading: PropTypes.bool,
};
