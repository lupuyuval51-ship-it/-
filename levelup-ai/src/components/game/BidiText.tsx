import { segmentGameText } from "@/lib/game";

/** Plain React text nodes: content is never interpreted as HTML. */
export function BidiText({ children }: { children: string }) {
  return <>{segmentGameText(children).map((segment,index) => segment.ltr ? <bdi dir="ltr" key={index}>{segment.text}</bdi> : segment.text)}</>;
}
