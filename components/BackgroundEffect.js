import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const LIGHT_ORBS = [
  { color: "#f472b6", size: 800, left: "-5%",  top: "-20%", dx: [0, 120, -60, 80, 0], dy: [0, 100, 140, -50, 0], dur: 28 },
  { color: "#60a5fa", size: 700, left: "55%",  top: "-15%", dx: [0, -90, 70, -40, 0], dy: [0, 110, 40,  90, 0], dur: 33 },
  { color: "#34d399", size: 580, left: "18%",  top: "50%",  dx: [0, 90, -70, 50,  0], dy: [0, -90, 70, -50, 0], dur: 25 },
  { color: "#fbbf24", size: 520, left: "72%",  top: "52%",  dx: [0, -70, 90, -50, 0], dy: [0,-110, 50,  70, 0], dur: 37 },
  { color: "#a78bfa", size: 440, left: "38%",  top: "20%",  dx: [0, 100,-80,  60, 0], dy: [0,  70,-100, 80, 0], dur: 31 },
];

const DARK_ORBS = [
  { color: "#7c3aed", size: 800, left: "-5%",  top: "-20%", dx: [0, 120, -60, 80, 0], dy: [0, 100, 140, -50, 0], dur: 28 },
  { color: "#1d4ed8", size: 700, left: "55%",  top: "-15%", dx: [0, -90, 70, -40, 0], dy: [0, 110, 40,  90, 0], dur: 33 },
  { color: "#0f766e", size: 580, left: "18%",  top: "50%",  dx: [0, 90, -70, 50,  0], dy: [0, -90, 70, -50, 0], dur: 25 },
  { color: "#be185d", size: 520, left: "72%",  top: "52%",  dx: [0, -70, 90, -50, 0], dy: [0,-110, 50,  70, 0], dur: 37 },
  { color: "#4338ca", size: 440, left: "38%",  top: "20%",  dx: [0, 100,-80,  60, 0], dy: [0,  70,-100, 80, 0], dur: 31 },
];

function Orb({ color, size, left, top, dx, dy, dur }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        left,
        top,
        borderRadius: "50%",
        background: `radial-gradient(circle at center, ${color}60 0%, ${color}25 45%, transparent 70%)`,
        filter: "blur(70px)",
        willChange: "transform",
      }}
      animate={{ x: dx, y: dy }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function BackgroundEffect() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const orbs = isDark ? DARK_ORBS : LIGHT_ORBS;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        backgroundColor: isDark ? "#020617" : "#f8fafc",
        transition: "background-color 0.6s ease",
      }}
    >
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}

      {/* Grain texture overlay for depth */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
          opacity: isDark ? 0.04 : 0.07,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
