/**
 * Open-source pieces shown on the About / Credits screens (website and Android app). Only packages that are real
 * dependencies in package.json are listed, with the license their own package.json declares; `tests/unit/credits.test.ts`
 * checks both against package.json and node_modules, so this list cannot drift or invent anything. No versions are
 * printed on purpose: they change with every update and the lockfile is the source of truth.
 */
export const OPEN_SOURCE_CREDITS = [
  { name: "React", pkg: "react", license: "MIT" },
  { name: "Next.js", pkg: "next", license: "MIT" },
  { name: "three.js", pkg: "three", license: "MIT" },
  { name: "React Three Fiber", pkg: "@react-three/fiber", license: "MIT" },
  { name: "Capacitor", pkg: "@capacitor/core", license: "MIT" },
  { name: "Supabase JS", pkg: "@supabase/supabase-js", license: "MIT" },
  { name: "Tailwind CSS", pkg: "tailwindcss", license: "MIT" },
  { name: "Zod", pkg: "zod", license: "MIT" },
  { name: "Prisma", pkg: "@prisma/client", license: "Apache-2.0" },
  { name: "Lucide", pkg: "lucide-react", license: "ISC" },
  { name: "Heebo (Fontsource)", pkg: "@fontsource-variable/heebo", license: "OFL-1.1" },
] as const;
