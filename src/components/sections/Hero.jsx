import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { profile } from "@/data/portfolio";

const WEB_HUB = { x: 930, y: 315 };
const WEB_ANCHORS = [
  { x: 1080, y: 0 },
  { x: 1420, y: 0 },
  { x: 1600, y: 210 },
  { x: 1600, y: 620 },
  { x: 1510, y: 900 },
  { x: 1080, y: 900 },
  { x: 680, y: 900 },
  { x: 300, y: 900 },
  { x: 0, y: 760 },
  { x: 0, y: 330 },
  { x: 0, y: 40 },
  { x: 350, y: 0 },
  { x: 720, y: 0 },
];
const WEB_RING_SCALES = [0.15, 0.27, 0.4, 0.55, 0.72, 0.92];

function pointOnSpoke(anchor, scale) {
  return {
    x: WEB_HUB.x + (anchor.x - WEB_HUB.x) * scale,
    y: WEB_HUB.y + (anchor.y - WEB_HUB.y) * scale,
  };
}

function createWebRing(scale) {
  const points = WEB_ANCHORS.map((anchor) => pointOnSpoke(anchor, scale));
  const first = points[0];
  let path = `M ${first.x} ${first.y}`;

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const midpoint = {
      x: (point.x + next.x) / 2,
      y: (point.y + next.y) / 2,
    };
    const control = {
      x: WEB_HUB.x + (midpoint.x - WEB_HUB.x) * 0.86,
      y: WEB_HUB.y + (midpoint.y - WEB_HUB.y) * 0.86,
    };

    path += ` Q ${control.x} ${control.y} ${next.x} ${next.y}`;
  });

  return `${path} Z`;
}

export function Hero() {
  return (
    <section className="noir-hero" id="home">
      <svg
        className="noir-web"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g className="web-spokes">
          {WEB_ANCHORS.map((anchor) => (
            <path
              key={`${anchor.x}-${anchor.y}`}
              d={`M ${WEB_HUB.x} ${WEB_HUB.y} L ${anchor.x} ${anchor.y}`}
            />
          ))}
        </g>
        <g className="web-cross-strands">
          {WEB_RING_SCALES.map((scale) => (
            <path key={scale} d={createWebRing(scale)} />
          ))}
        </g>
        <circle className="web-knot" cx="930" cy="315" r="4" />
      </svg>
      <motion.div
        className="noir-hero-inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="noir-hero-copy">
          <span className="case-tag type">Case No. 001 - Open File</span>
          <h1>{profile.heroTitle}</h1>
          <p className="role">{profile.heroRole}</p>
          <p className="tag">{profile.heroTag}</p>

          <div className="hero-cta">
            <a className="noir-button noir-button-solid" href={profile.portfolioUrl} download>
              <FileText />
              Download Portfolio
            </a>
          </div>
        </div>
      </motion.div>

      <div className="scroll-cue type">Descend</div>
    </section>
  );
}
