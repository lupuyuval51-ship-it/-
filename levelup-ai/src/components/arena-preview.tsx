import { useId } from "react";

/** Lightweight, original map artwork. The actual 3D engine loads only on Play. */
export default function ArenaPreview({
  world = "future-city",
  compact = false,
}: {
  world?: string;
  compact?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const palette: Record<string, [string, string, string]> = {
    "future-city": ["#274752", "#6caba2", "#bfdcc5"],
    "sky-island": ["#344f74", "#83baa1", "#d7e4c1"],
    "ai-lab": ["#2f474b", "#76a6b3", "#bcd5d9"],
    "mystery-castle": ["#414459", "#939fa7", "#c9c9ba"],
    "digital-world": ["#263d6b", "#7a9bc8", "#bed3ea"],
  };
  const [back, floor, tile] = palette[world] || palette["future-city"];
  return (
    <svg
      className={"arena-preview" + (compact ? " compact" : "")}
      viewBox="0 0 640 370"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id + "-sky"}
          x1="320"
          y1="0"
          x2="320"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={back} />
          <stop offset="1" stopColor="#162839" />
        </linearGradient>
        <linearGradient
          id={id + "-ground"}
          x1="320"
          y1="55"
          x2="320"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={floor} />
          <stop offset="1" stopColor="#578279" />
        </linearGradient>
        <filter
          id={id + "-shadow"}
          x="-30%"
          y="-30%"
          width="160%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="9"
            stdDeviation="7"
            floodColor="#0c1829"
            floodOpacity=".25"
          />
        </filter>
      </defs>
      <path fill={`url(#${id}-sky)`} d="M0 0h640v370H0z" />
      <g opacity=".24" stroke="#99c0c7">
        <path d="M0 280 470 0M85 370 640 40M0 170l335 200M130 0l510 300" />
      </g>
      <path d="m320 53 260 139v29L320 359 60 221v-29Z" fill="#304a54" />
      <path
        d="m320 42 260 140L320 326 60 182Z"
        fill={`url(#${id}-ground)`}
        stroke="#a2c9bd"
        strokeWidth="4"
      />
      <g opacity=".24" stroke={tile} strokeWidth="1.5">
        <path d="m112 154 260 144M164 126l260 144M216 98l260 144M268 70l260 144M112 210 372 70M164 238 424 98M216 266l260-140M268 294l260-140" />
      </g>
      <path d="m319 125 108 58-108 62-108-62Z" fill={tile} opacity=".62" />
      <path
        d="m319 153 57 30-57 33-57-33Z"
        fill="#98c3b9"
        stroke="#e6ede0"
        strokeOpacity=".5"
      />
      <g filter={`url(#${id}-shadow)`}>
        <g>
          <path d="m154 127 61-33 33 18-61 34Z" fill="#e1e6cc" />
          <path d="M154 127v29l33 19v-29Z" fill="#8ba5a0" />
          <path d="m187 146 61-34v29l-61 34Z" fill="#b2c3b4" />
          <path d="m162 127 52-28" stroke="#f3f4de" strokeWidth="3" />
        </g>
        <g>
          <path d="m391 223 61-34 32 18-61 34Z" fill="#e1e6cc" />
          <path d="M391 223v26l32 18v-26Z" fill="#8ba5a0" />
          <path d="m423 241 61-34v26l-61 34Z" fill="#b2c3b4" />
        </g>
        <g>
          <path d="m402 108 43-23 29 16-43 24Z" fill="#dfdbbe" />
          <path d="M402 108v26l29 17v-26Z" fill="#8ba5a0" />
          <path d="m431 125 43-24v26l-43 24Z" fill="#b2c3b4" />
        </g>
        <g>
          <path d="m180 238 43-24 29 16-43 24Z" fill="#dfdbbe" />
          <path d="M180 238v24l29 17v-25Z" fill="#8ba5a0" />
          <path d="m209 254 43-24v24l-43 25Z" fill="#b2c3b4" />
        </g>
        {[
          { x: 142, y: 199 },
          { x: 464, y: 157 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <path d="m-20 0 20-11L20 0 0 12Z" fill="#806d53" />
            <path d="M-20 0v19L0 30V12Z" fill="#aa8350" />
            <path d="M0 12 20 0v19L0 30Z" fill="#d5af70" />
            <path d="M3 16 17 8M3 22l14-8" stroke="#e6c58b" strokeWidth="2" />
          </g>
        ))}
      </g>
      {[
        { x: 115, y: 174 },
        { x: 474, y: 217 },
        { x: 231, y: 99 },
        { x: 349, y: 79 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <ellipse rx="20" ry="10" fill="#2a6864" opacity=".5" />
          <path
            d="M0 2c-22-4-25-23-16-28C-3-26-3-15 0-9 3-31 13-40 20-31 31-19 9-4 0 2Z"
            fill={i % 2 ? "#497f67" : "#356f60"}
          />
          <path
            d="M0 1V-20"
            stroke="#88af89"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
      {[
        { x: 265, y: 139, c: "#68a8ef" },
        { x: 324, y: 109, c: "#dfa857" },
        { x: 381, y: 139, c: "#d98b87" },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <ellipse cy="18" rx="19" ry="9" fill="#274954" opacity=".45" />
          <path d="m-17 8 17-9 17 9-17 10Z" fill="#e8e3cd" />
          <path d="M-17 8v10l17 10V18ZM0 18l17-10v10L0 28Z" fill="#a7c0b7" />
          <path
            d="m0-29 13 8v17L0 4-13-4v-17Z"
            fill={p.c}
            stroke="#e4f0ed"
            strokeWidth="2"
          />
          <circle cy="-12" r="4" fill="#f3f5ed" />
        </g>
      ))}
      <g transform="translate(331 243)" filter={`url(#${id}-shadow)`}>
        <ellipse cy="12" rx="26" ry="12" fill="#355253" opacity=".7" />
        <rect x="-17" y="-8" width="13" height="24" rx="5" fill="#263e60" />
        <rect x="6" y="-8" width="13" height="24" rx="5" fill="#263e60" />
        <path
          d="M-23-26c0-9 46-9 46 0L18 2c-12 5-24 5-36 0Z"
          fill="#5b8ee5"
          stroke="#b8d5ed"
          strokeWidth="2"
        />
        <rect
          x="-31"
          y="-28"
          width="12"
          height="26"
          rx="6"
          fill="#acc9d9"
          transform="rotate(12 -31 -28)"
        />
        <rect
          x="19"
          y="-30"
          width="12"
          height="25"
          rx="6"
          fill="#acc9d9"
          transform="rotate(-24 19 -30)"
        />
        <rect
          x="20"
          y="-32"
          width="31"
          height="13"
          rx="5"
          fill="#2f4e6b"
          transform="rotate(-35 20 -32)"
        />
        <rect x="-23" y="-61" width="46" height="39" rx="17" fill="#e0e9df" />
        <rect x="-19" y="-49" width="38" height="18" rx="8" fill="#244661" />
        <path
          d="M-12-41h7m10 0h7"
          stroke="#8ee0db"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M0-71v10" stroke="#afc9c8" strokeWidth="3" />
        <circle cy="-73" r="4" fill="#e8c976" />
        <rect x="-6" y="-17" width="12" height="10" rx="3" fill="#e6c46e" />
      </g>
      <g transform="translate(403 181)">
        <ellipse cy="12" rx="21" ry="9" fill="#325855" opacity=".5" />
        <path
          d="M-14-19h28l8 11-7 19h-30l-7-19Z"
          fill="#d38a71"
          stroke="#ecd5ab"
          strokeWidth="2"
        />
        <rect x="-14" y="-10" width="28" height="12" rx="5" fill="#6e3d40" />
        <path
          d="M-8-4h4m8 0h4"
          stroke="#ffdda1"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="m-23-9-10-5m56 5 10-5"
          stroke="#d7ad8d"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <path
        d="m373 197 9-8"
        stroke="#fae9a5"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="m358 210 4-4"
        stroke="#fae9a5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g opacity=".65" fill="#d8e8d7">
        <circle cx="101" cy="107" r="2" />
        <circle cx="521" cy="154" r="2" />
        <circle cx="530" cy="255" r="1.5" />
      </g>
    </svg>
  );
}
