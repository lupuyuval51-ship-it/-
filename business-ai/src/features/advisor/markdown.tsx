/**
 * Renders the safe Markdown subset from ./markdownParse.ts with the design-system Text primitive.
 * No HTML, no images, no tappable links (a link renders as its label followed by the address in
 * quiet text — nothing opens on its own). Text is selectable so users can copy advice.
 */
import { memo, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Divider, Text } from '@/components/ui';
import type { TypeVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { parseMarkdown, type MdBlock, type MdInline } from './markdownParse';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' });

/** Glyph appended while a reply streams. */
const CURSOR = '▍';

function Inline({ nodes, codeBackground, variant }: { nodes: MdInline[]; codeBackground: string; variant: TypeVariant }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'text':
            return node.text;
          case 'strong':
            return (
              <Text key={i} variant={variant} tone="inherit" weight={600}>
                <Inline nodes={node.children} codeBackground={codeBackground} variant={variant} />
              </Text>
            );
          case 'em':
            return (
              <Text key={i} variant={variant} tone="inherit">
                <Inline nodes={node.children} codeBackground={codeBackground} variant={variant} />
              </Text>
            );
          case 'code':
            return (
              <Text key={i} variant={variant} tone="inherit" style={[styles.inlineCode, { backgroundColor: codeBackground }]}>
                {node.text}
              </Text>
            );
          case 'link':
            return (
              <Text key={i} variant={variant} tone="inherit">
                {node.text}
                {node.url !== node.text ? (
                  <Text tone="secondary" variant="callout">
                    {` (${node.url})`}
                  </Text>
                ) : null}
              </Text>
            );
        }
      })}
    </>
  );
}

function Cursor() {
  return (
    <Text tone="secondary" accessibilityElementsHidden importantForAccessibility="no">
      {CURSOR}
    </Text>
  );
}

export interface MarkdownProps {
  source: string;
  /** Shows a quiet cursor after the last character (streaming). */
  streaming?: boolean;
}

function MarkdownImpl({ source, streaming = false }: MarkdownProps) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  const code = colors.backgroundAlt;
  const lastIndex = blocks.length - 1;
  const last = blocks[lastIndex];
  const cursorInline = streaming && last !== undefined && last.type !== 'code' && last.type !== 'rule';

  const renderBlock = (block: MdBlock, index: number) => {
    const cursor = cursorInline && index === lastIndex ? <Cursor /> : null;
    switch (block.type) {
      case 'heading':
        return (
          <Text key={index} variant={block.level === 1 ? 'title' : 'heading'} selectable style={index > 0 ? styles.headingGap : null}>
            <Inline nodes={block.children} codeBackground={code} variant={block.level === 1 ? 'title' : 'heading'} />
            {cursor}
          </Text>
        );
      case 'paragraph':
        return (
          <Text key={index} variant="body" selectable>
            <Inline nodes={block.children} codeBackground={code} variant="body" />
            {cursor}
          </Text>
        );
      case 'list': {
        let counter = 0;
        return (
          <View key={index} style={styles.list}>
            {block.items.map((item, i) => {
              counter = item.ordered ? (item.number > 0 ? item.number : counter + 1) : counter;
              const marker = item.ordered ? `${counter}.` : item.depth > 0 ? '◦' : '•';
              const isLast = i === block.items.length - 1;
              return (
                <View key={i} style={[styles.item, item.depth > 0 ? styles.nested : null]}>
                  <Text variant="body" tone="secondary" numeric style={item.ordered ? styles.numberMarker : styles.bulletMarker}>
                    {marker}
                  </Text>
                  <Text variant="body" selectable style={styles.itemText}>
                    <Inline nodes={item.children} codeBackground={code} variant="body" />
                    {isLast ? cursor : null}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      }
      case 'code':
        return (
          <View key={index} style={[styles.codeBlock, { backgroundColor: code }]}>
            <Text variant="callout" selectable style={styles.codeText}>
              {block.text}
            </Text>
          </View>
        );
      case 'rule':
        return <Divider key={index} spacing={1} />;
    }
  };

  return (
    <View style={styles.root}>
      {blocks.map(renderBlock)}
      {streaming && !cursorInline ? <Cursor /> : null}
    </View>
  );
}

export const Markdown = memo(MarkdownImpl);

const styles = StyleSheet.create({
  root: { gap: spacing[3], alignSelf: 'stretch' },
  headingGap: { marginTop: spacing[2] },
  list: { gap: spacing[2] },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  nested: { paddingStart: spacing[5] },
  bulletMarker: { minWidth: 12 },
  numberMarker: { minWidth: 20 },
  itemText: { flex: 1 },
  inlineCode: { fontFamily: MONO, fontSize: 14 },
  codeBlock: { borderRadius: radii.control, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  codeText: { fontFamily: MONO, fontSize: 14, lineHeight: 20 },
});
