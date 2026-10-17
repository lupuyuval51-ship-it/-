/** Re-mounts on every navigation, so each page enters with a short fade/rise (disabled under reduced motion). */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="lu-page">{children}</div>;
}
