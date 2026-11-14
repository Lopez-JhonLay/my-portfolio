import { FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { ContactBodySkeleton } from "@/components/sections/content-skeletons";

const socialIcons = {
  github: FaGithub,
  linkedin: FaLinkedin,
  facebook: FaFacebook,
};

export function Contact({ content, loading = false, location }) {
  return (
    <motion.section
      className="noir-section"
      id="contact"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">{content.eyebrow}</div>
      <h2 className="section-title">
        <Mail />
        {content.title}
      </h2>
      <p className="section-lead">{content.availability}</p>

      {loading ? <ContactBodySkeleton /> : <div className="contact-wrap">
        <div className="contact-note">
          <h3>{content.noteTitle}</h3>
          <p>{content.noteBody}</p>
          <a className="contact-line" href={`mailto:${content.email}`}>
            <Mail />
            <span>{content.email}</span>
          </a>
          <p className="contact-line">
            <MapPin />
            <span>{location}</span>
          </p>
        </div>

        <div className="social-board" aria-label="Social links">
          {content.socialLinks.map((link) => {
            const Icon = socialIcons[link.iconKey];
            return (
              <a
                className="social-link"
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="social-card-inner">
                  <span className="social-card-face social-card-front">
                    {Icon ? <Icon aria-hidden="true" /> : null}
                    <span>{link.label}</span>
                  </span>
                  <span className="social-card-face social-card-back" aria-hidden="true">
                    <ArrowUpRight />
                    <span>Visit {link.label}</span>
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </div>}
    </motion.section>
  );
}

Contact.propTypes = {
  content: PropTypes.shape({
    availability: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    eyebrow: PropTypes.string.isRequired,
    noteBody: PropTypes.string.isRequired,
    noteTitle: PropTypes.string.isRequired,
    socialLinks: PropTypes.arrayOf(PropTypes.shape({
      href: PropTypes.string.isRequired,
      iconKey: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  loading: PropTypes.bool,
  location: PropTypes.string.isRequired,
};
