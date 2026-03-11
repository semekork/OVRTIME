/**
 * OVRTIME Match Live Activity
 * Uses expo-widgets + @expo/ui/swift-ui.
 *
 * Lock Screen: full score banner with team abbreviations and match clock
 * Dynamic Island Compact: home score | clock | away score
 * Dynamic Island Expanded: team panels left/right, clock center, bottom strip
 */
import { HStack, VStack, Text, Image, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, background, cornerRadius } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type MatchActivityProps = {
  homeTeam: string;
  homeAbbrev: string;
  homeScore: string;
  awayTeam: string;
  awayAbbrev: string;
  awayScore: string;
  clock: string;
  statusDetail: string;
  leagueName: string;
  isLive: boolean;
};

const ACCENT = '#FF6B00';
const LIVE_RED = '#FF3B30';
const WHITE = '#FFFFFF';
const GRAY_LIGHT = '#AAAAAA';
const GRAY_MID = '#777777';
const GRAY_DARK = '#444444';
const BG_DARK = '#0A0A0A';

const MatchActivity = (props: MatchActivityProps = {} as MatchActivityProps) => {
  'widget';

  const clockText = props.isLive ? `${props.clock}'` : props.statusDetail || 'FT';
  const clockColor = props.isLive ? LIVE_RED : GRAY_LIGHT;

  return {
    // ─── Lock Screen banner ──────────────────────────────────────────────────
    banner: (
      <HStack modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
        {/* Home side */}
        <VStack modifiers={[frame({ width: 80 })]}>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(GRAY_LIGHT)]}>{props.homeAbbrev}</Text>
          <Text modifiers={[font({ weight: 'bold', size: 30 }), foregroundStyle(WHITE)]}>{props.homeScore}</Text>
        </VStack>

        <Spacer />

        {/* Center: clock + league */}
        <VStack>
          <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle(clockColor)]}>{clockText}</Text>
          <Text modifiers={[font({ size: 10 }), foregroundStyle(GRAY_MID)]}>{props.leagueName}</Text>
        </VStack>

        <Spacer />

        {/* Away side */}
        <VStack modifiers={[frame({ width: 80 })]}>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(GRAY_LIGHT)]}>{props.awayAbbrev}</Text>
          <Text modifiers={[font({ weight: 'bold', size: 30 }), foregroundStyle(WHITE)]}>{props.awayScore}</Text>
        </VStack>
      </HStack>
    ),

    // ─── Compact Dynamic Island — leading (home score) ──────────────────────
    compactLeading: (
      <HStack modifiers={[padding({ horizontal: 6 })]}>
        <Image
          systemName="soccerball"
          modifiers={[frame({ width: 13, height: 13 }), foregroundStyle(ACCENT)]}
        />
        <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(WHITE), padding({ leading: 3 })]}>
          {props.homeScore}
        </Text>
      </HStack>
    ),

    // ─── Compact Dynamic Island — trailing (away score) ─────────────────────
    compactTrailing: (
      <HStack modifiers={[padding({ horizontal: 6 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle(WHITE), padding({ trailing: 3 })]}>
          {props.awayScore}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(clockColor)]}>{clockText}</Text>
      </HStack>
    ),

    // ─── Minimal Dynamic Island ─────────────────────────────────────────────
    minimal: (
      <Text modifiers={[font({ weight: 'bold', size: 12 }), foregroundStyle(ACCENT)]}>
        {props.homeScore}–{props.awayScore}
      </Text>
    ),

    // ─── Expanded Dynamic Island — leading panel (home team) ────────────────
    expandedLeading: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image
          systemName="shield.lefthalf.filled"
          modifiers={[frame({ width: 22, height: 22 }), foregroundStyle(ACCENT)]}
        />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(WHITE), padding({ top: 6 })]}>
          {props.homeAbbrev}
        </Text>
        <Text modifiers={[font({ weight: 'bold', size: 28 }), foregroundStyle(WHITE)]}>{props.homeScore}</Text>
      </VStack>
    ),

    // ─── Expanded Dynamic Island — trailing panel (away team) ───────────────
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image
          systemName="shield.righthalf.filled"
          modifiers={[frame({ width: 22, height: 22 }), foregroundStyle(GRAY_LIGHT)]}
        />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(WHITE), padding({ top: 6 })]}>
          {props.awayAbbrev}
        </Text>
        <Text modifiers={[font({ weight: 'bold', size: 28 }), foregroundStyle(WHITE)]}>{props.awayScore}</Text>
      </VStack>
    ),

    // ─── Expanded Dynamic Island — center (clock + status) ──────────────────
    expandedCenter: (
      <VStack>
        <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(clockColor)]}>{clockText}</Text>
        <Text modifiers={[font({ size: 10 }), foregroundStyle(GRAY_DARK)]}>{props.leagueName}</Text>
      </VStack>
    ),

    // ─── Expanded Dynamic Island — bottom strip ──────────────────────────────
    expandedBottom: (
      <HStack modifiers={[padding({ horizontal: 14, bottom: 8 })]}>
        <Image
          systemName="soccerball"
          modifiers={[frame({ width: 11, height: 11 }), foregroundStyle(ACCENT)]}
        />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(GRAY_MID), padding({ leading: 5 })]}>
          {props.homeTeam} vs {props.awayTeam}
        </Text>
      </HStack>
    ),
  };
};

export default createLiveActivity('MatchActivity', MatchActivity);
