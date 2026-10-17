import { forwardRef, type AnchorHTMLAttributes } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };

/** `next/link` for the offline app: website paths become hash routes. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, replace: _r, scroll: _s, ...rest }, ref) {
  return <a ref={ref} href={href.startsWith("#") || /^https?:/.test(href) ? href : `#${href}`} {...rest} />;
});
export default Link;
