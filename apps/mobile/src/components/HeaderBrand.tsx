import { Platform, StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from '../design';

const fontFix = Platform.select({ ios: {}, android: { includeFontPadding: false } });

type HeaderBrandProps = {
  badgeLabel?: string;
  title?: string;
  subtitle?: string;
};

export function HeaderBrand({
  badgeLabel = 'GUISED UP',
  title = 'Real Connections',
  subtitle = 'Authenticity over popularity.',
}: HeaderBrandProps) {
  return (
    <View style={styles.wrap} accessible accessibilityRole="header">
      {/* Pill badge */}
      <View style={styles.badge}>
        <View style={styles.dotOuter}>
          <View style={styles.dot} />
        </View>
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Subtitle with decorative line */}
      <View style={styles.subRow}>
        <View style={styles.line} />
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space[6] ?? space[5],
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: color.accentBg,
    borderRadius: radius.full,
    paddingHorizontal: space[3] + 2,
    paddingVertical: space[1] + 2,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.accent + '33', // subtle tint border, modern glassy look
  },
  dotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.accent,
  },
  badgeText: {
    fontSize: type.tiny.size + 1,
    fontWeight: '700',
    color: color.accent,
    letterSpacing: type.tiny.tracking + 0.4,
    ...fontFix,
  },

  title: {
    fontSize: type.hero.size,
    fontWeight: type.hero.weight,
    color: color.primary,
    letterSpacing: type.hero.tracking,
    lineHeight: type.hero.leading,
    marginTop: space[5],
    ...fontFix,
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[3],
  },
  line: {
    width: space[5],
    height: 2,
    borderRadius: 1,
    backgroundColor: color.accent, // accent line instead of plain hairline — modern touch
    marginRight: space[3],
  },
  sub: {
    fontSize: type.label.size,
    fontWeight: '500',
    color: color.secondary,
    letterSpacing: 0.2,
    ...fontFix,
  },
});