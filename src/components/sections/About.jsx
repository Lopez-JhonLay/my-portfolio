import { User } from "lucide-react";
import { motion } from "framer-motion";
import profilePhoto from "@/assets/profile.png";
import { about, profile } from "@/data/portfolio";

const PHOTO_WEB_HUB = { x: 360, y: 120 };
const PHOTO_WEB_ANCHORS = [
  { x: 460, y: 0 },
  { x: 500, y: 70 },
  { x: 500, y: 280 },
  { x: 470, y: 520 },
  { x: 320, y: 620 },
  { x: 110, y: 620 },
  { x: 0, y: 500 },
  { x: 0, y: 290 },
  { x: 0, y: 90 },
  { x: 130, y: 0 },
  { x: 290, y: 0 },
];
const PHOTO_WEB_RING_SCALES = [0.12, 0.22, 0.33, 0.45, 0.58, 0.71, 0.84, 0.97];

function pointOnPhotoSpoke(anchor, scale) {
  return {
    x: PHOTO_WEB_HUB.x + (anchor.x - PHOTO_WEB_HUB.x) * scale,
    y: PHOTO_WEB_HUB.y + (anchor.y - PHOTO_WEB_HUB.y) * scale,
  };
}

function createPhotoWebRing(scale) {
  const points = PHOTO_WEB_ANCHORS.map((anchor) => pointOnPhotoSpoke(anchor, scale));
  const first = points[0];
  let path = `M ${first.x} ${first.y}`;

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const midpoint = {
      x: (point.x + next.x) / 2,
      y: (point.y + next.y) / 2,
    };
    const control = {
      x: PHOTO_WEB_HUB.x + (midpoint.x - PHOTO_WEB_HUB.x) * 0.86,
      y: PHOTO_WEB_HUB.y + (midpoint.y - PHOTO_WEB_HUB.y) * 0.86,
    };

    path += ` Q ${control.x} ${control.y} ${next.x} ${next.y}`;
  });

  return `${path} Z`;
}

export function About() {
  return (
    <motion.section
      className="noir-section"
      id="about"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">{about.eyebrow}</div>
      <h2 className="section-title">
        <User />
        {about.title}
      </h2>
      <p className="section-lead">{about.lead}</p>

      <div className="dossier">
        <span className="dossier-stamp type">CLEARED</span>
        <aside className="dossier-photo-panel" aria-label="Profile photo">
          <div className="photo-web-stage">
            <svg
              className="dossier-web"
              viewBox="0 0 500 620"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g className="web-spokes">
                {PHOTO_WEB_ANCHORS.map((anchor) => (
                  <path
                    key={`${anchor.x}-${anchor.y}`}
                    d={`M ${PHOTO_WEB_HUB.x} ${PHOTO_WEB_HUB.y} L ${anchor.x} ${anchor.y}`}
                  />
                ))}
              </g>
              <g className="web-cross-strands">
                {PHOTO_WEB_RING_SCALES.map((scale) => (
                  <path key={scale} d={createPhotoWebRing(scale)} />
                ))}
              </g>
              <circle className="web-knot" cx={PHOTO_WEB_HUB.x} cy={PHOTO_WEB_HUB.y} r="3" />
            </svg>
            <div className="photo-frame">
              <span className="tape tape-left" />
              <span className="tape tape-right" />
              <img src={profilePhoto} alt={profile.name} />
            </div>
          </div>
          <p className="photo-caption type">Subject on record - {profile.location}</p>
        </aside>

        <div className="dossier-body">
          <h3>{profile.name}</h3>
          <div className="subline type">{profile.role}</div>
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="file-facts">
          {about.facts.map((fact) => (
            <div key={fact.label}>
              <span className="k type">{fact.label}</span>
              <span className="v">{fact.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
