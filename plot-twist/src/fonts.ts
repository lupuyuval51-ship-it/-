// Self-hosted variable fonts (bundled by Vite — no third-party font CDN at runtime).
import '@fontsource-variable/fraunces/full.css'; // opsz, wght, SOFT, WONK
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/instrument-sans/wdth.css'; // wght + wdth (75–100%)
import '@fontsource-variable/jetbrains-mono/wght.css';

export const FONT_DISPLAY = '"Fraunces Variable", "Fraunces", Georgia, serif';
export const FONT_SANS = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';
