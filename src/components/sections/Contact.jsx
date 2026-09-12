import { FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { profile, socialLinks } from "@/data/portfolio";

const socialIcons = {
  GitHub: FaGithub,
  LinkedIn: FaLinkedin,
  Facebook: FaFacebook,
};

export function Contact() {
  return (
    <motion.section
      className="noir-section"
      id="contact"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">05 - Make Contact</div>
      <h2 className="section-title">
        <Mail />
        Open a Line
      </h2>
      <p className="section-lead">{profile.availability}</p>

      <div className="contact-wrap">
        <div className="contact-note">
          <h3>Leave Word</h3>
          <p>
            Send a message about internship opportunities, collaborations, or
            software projects worth building.
          </p>
          <a className="contact-line" href={`mailto:${profile.email}`}>
            <Mail />
            <span>{profile.email}</span>
          </a>
          <p className="contact-line">
            <MapPin />
            <span>{profile.location}</span>
          </p>
        </div>

        <div className="social-board" aria-label="Social links">
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.label];
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
      </div>
    </motion.section>
  );
}
