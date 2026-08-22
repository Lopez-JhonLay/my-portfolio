import { useRef, useState } from "react";
import { useTheme } from "../../contexts/theme-context";
import { Lightbulb } from "lucide-react";
import { FaSpider } from "react-icons/fa";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [ropeOffset, setRopeOffset] = useState({ x: 0, y: 0 });
  const [isSwitching, setIsSwitching] = useState(false);
  const bulbRef = useRef(null);
  const ignoredClick = useRef(false);
  const transitionLock = useRef(false);
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const isDark = theme === "dark";

  useMotionValueEvent(pullX, "change", (x) => {
    setRopeOffset((current) => ({ ...current, x }));
  });

  useMotionValueEvent(pullY, "change", (y) => {
    setRopeOffset((current) => ({ ...current, y }));
  });

  const toggleTheme = async () => {
    if (transitionLock.current) return;

    transitionLock.current = true;
    const nextTheme = isDark ? "light" : "dark";
    const root = document.documentElement;
    const bulbBounds = bulbRef.current?.getBoundingClientRect();
    const originX = bulbBounds ? bulbBounds.left + bulbBounds.width / 2 : window.innerWidth;
    const originY = bulbBounds ? bulbBounds.top + bulbBounds.height / 2 : 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.style.setProperty("--theme-origin-x", `${originX}px`);
    root.style.setProperty("--theme-origin-y", `${originY}px`);
    setIsSwitching(true);

    const applyTheme = () => {
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      localStorage.setItem("theme", nextTheme);
      setTheme(nextTheme);
    };

    if (prefersReducedMotion || !document.startViewTransition) {
      applyTheme();
      window.setTimeout(() => {
        setIsSwitching(false);
        transitionLock.current = false;
      }, prefersReducedMotion ? 0 : 480);
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 140));

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    try {
      await transition.finished;
    } finally {
      setIsSwitching(false);
      transitionLock.current = false;
    }
  };

  const handleClick = () => {
    if (ignoredClick.current) {
      ignoredClick.current = false;
      return;
    }

    toggleTheme();
    animate(pullY, [pullY.get(), 22, -3, 7, -1, 0], {
      duration: 0.82,
      ease: [0.45, 0, 0.2, 1],
    });
    animate(pullX, [pullX.get(), 3, -4, 2, -1, 0], {
      duration: 0.9,
      ease: [0.45, 0, 0.2, 1],
    });
  };

  const handleDrag = (...dragArguments) => {
    const info = dragArguments[1];

    if (Math.abs(info.offset.x) > 3 || Math.abs(info.offset.y) > 3) {
      ignoredClick.current = true;
    }
  };

  const handleDragEnd = (...dragArguments) => {
    const info = dragArguments[1];

    if (info.offset.y >= 32) {
      toggleTheme();
    }
  };

  const ropePath = [
    "M 42 21",
    `C ${38 + ropeOffset.x * 0.12} ${44 + ropeOffset.y * 0.18}`,
    `${46 + ropeOffset.x * 0.72} ${68 + ropeOffset.y * 0.72}`,
    `${42 + ropeOffset.x} ${86 + ropeOffset.y}`,
  ].join(" ");

  return (
    <button
      className="pull-light-toggle"
      type="button"
      aria-pressed={isDark}
      aria-label={`Pull spider to switch to ${isDark ? "light" : "dark"} mode`}
      title={`Pull for ${isDark ? "daylight" : "nightfall"}`}
      onClick={handleClick}
    >
      <span className="pull-label type">
        {isDark ? "Pull for daylight" : "Pull for nightfall"}
      </span>
      <span className={`pull-light${isSwitching ? " is-switching" : ""}`} aria-hidden="true">
        <span className="pull-bulb" ref={bulbRef}>
          <Lightbulb />
        </span>
        <svg className="pull-rope" viewBox="0 0 84 150">
          <path d={ropePath} />
        </svg>
        <motion.span
          className="pull-handle"
          style={{ x: pullX, y: pullY }}
          drag
          dragConstraints={{ left: -32, right: 32, top: 0, bottom: 52 }}
          dragElastic={0.08}
          dragMomentum={false}
          dragSnapToOrigin
          dragTransition={{ bounceStiffness: 190, bounceDamping: 9 }}
          onDragStart={() => {
            ignoredClick.current = false;
          }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          <FaSpider className="pull-spider" />
        </motion.span>
      </span>
    </button>
  );
}
