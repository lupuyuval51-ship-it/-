export default function QuestArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"quest-art " + className}
      viewBox="0 0 660 410"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sky"
          x1="320"
          y1="10"
          x2="320"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#141f36" />
          <stop offset="1" stopColor="#162a49" />
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#3d5c81" />
          <stop offset="1" stopColor="#1e304c" />
        </linearGradient>
        <linearGradient id="gate" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#789fff" />
          <stop offset="1" stopColor="#365cac" />
        </linearGradient>
      </defs>
      <rect width="660" height="410" fill="url(#sky)" />
      <circle cx="432" cy="81" r="37" fill="#bfcede" opacity=".7" />
      <path
        d="M0 300 70 245 130 276 230 214 335 250 431 196 530 229 660 146V410H0Z"
        fill="#101d31"
      />
      <g opacity=".45" stroke="#7697be" strokeWidth="1">
        <path d="m0 355 330-174 330 174M0 403 330 229 330 403M60 410 330 267 600 410M140 410 330 309 520 410" />
        <path d="m40 220 344 190M120 180 426 410M210 140 514 410M620 210 257 410M550 179 174 410M470 155 92 410" />
      </g>
      <g>
        <path d="m486 241 50-28 38 23v-126l-38-22-50 28z" fill="#223b5c" />
        <path d="m486 116 50 29v96l-50-28z" fill="#334f71" />
        <path d="m486 116 50-28 38 22-50 28z" fill="#52749a" />
        <path
          d="m504 130 20 12v7l-20-12zm0 25 20 12v7l-20-12zm0 25 20 12v7l-20-12z"
          fill="#82b1de"
        />
        <path d="m61 280 58-33 42 24v-95l-42-24-58 33z" fill="#263e59" />
        <path d="m61 185 43 24v95l-43-24z" fill="#395a7a" />
        <path d="m61 185 58-33 42 24-57 33z" fill="#567797" />
        <path d="m76 202 14 8v41l-14-8z" fill="#88a9c7" />
        <path d="m161 193 31-18 27 16v-85l-27-16-31 18z" fill="#253c56" />
        <path d="m161 108 27 16v85l-27-16z" fill="#385775" />
        <path d="m161 108 31-18 27 16-31 18z" fill="#547294" />
      </g>
      <path d="m182 296 178-100 134 78-178 104z" fill="#506b85" />
      <path d="m182 296 134 78v24l-134-78z" fill="#243a51" />
      <path d="m316 374 178-100v24L316 398z" fill="#172c45" />
      <path
        d="m202 294 158-88 113 67-157 91z"
        stroke="#8ca7c4"
        strokeWidth="2"
      />
      <path d="m216 300 135-75 100 57-135 80z" fill="#1c354e" />
      <path d="m248 311 106-61 51 29-106 62z" fill="#567593" />
      <path
        d="m253 308 104-59M269 318l104-59M286 328l104-59"
        stroke="#97b6d5"
        strokeWidth="2"
      />
      <g>
        <path
          d="m312 244 0-117 77 44v118l-13 7v-116l-50-28v102z"
          fill="url(#gate)"
        />
        <path d="m312 127 13-8 77 44-13 8z" fill="#aecbff" />
        <path d="m389 171 13-8v118l-13 8z" fill="#315a9c" />
        <path d="m327 158 45 26v92l-45-26z" fill="#4d7dd2" opacity=".15" />
        <path d="m330 164 37 21v83" stroke="#a7c7ff" strokeWidth="2" />
      </g>
      <g>
        <path d="m406 270v-92l42 24v94l-9 5v-93l-24-14v82z" fill="#5d738d" />
        <path d="m406 178 10-6 42 24-10 6z" fill="#8ca0b7" />
        <path d="m448 202 10-6v94l-10 6z" fill="#344c68" />
      </g>
      <g transform="translate(272 262)">
        <ellipse cy="44" rx="21" ry="10" fill="#0f2033" />
        <path d="m-13 7 14-8 15 9-14 8z" fill="#b3c5df" />
        <path d="m-13 7 15 9v19l-15-9z" fill="#5274a7" />
        <path d="m2 16 14-8v19L2 35z" fill="#365585" />
        <path d="m-9 30 7 4v14l-7-4zm16 2 7-4v13l-7 4z" fill="#adc0d7" />
        <rect x="-6" y="-11" width="21" height="19" rx="6" fill="#d1dfef" />
        <rect x="-2" y="-6" width="14" height="8" rx="3" fill="#243c61" />
        <path d="M1-2h2m4 0h2" stroke="#8fcaff" strokeWidth="2" />
      </g>
      <g fill="#a5c3ef" opacity=".7">
        <circle cx="271" cy="89" r="1.5" />
        <circle cx="366" cy="52" r="1.5" />
        <circle cx="590" cy="115" r="1.5" />
        <circle cx="100" cy="68" r="1.5" />
        <circle cx="205" cy="45" r="1.5" />
      </g>
      <path d="m470 347 24-14 23 14-23 14z" stroke="#81a4ce" />
      <path d="m156 349 14-8 14 8-14 8z" fill="#59799f" />
    </svg>
  );
}
