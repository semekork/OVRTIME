import { HStack, VStack, Text, Image, Spacer, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame, background, cornerRadius, opacity } from '@expo/ui/swift-ui/modifiers';
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

const MatchActivity = (props?: MatchActivityProps) => {
  'widget';

  if (!props) {
    return {
      banner: (
        <VStack modifiers={[background('#0A0A0F'), frame({ maxWidth: Infinity })]}>
          <Text modifiers={[font({ size: 12 }), foregroundStyle('#555566')]}>Loading match...</Text>
        </VStack>
      ),
    };
  }

  // ── Palette ────────────────────────────────────────────────────────────────
  const BG_DEEP       = '#080B14';   // near-black navy
  const BG_CARD       = '#0F1623';   // card surface
  const BG_SEPARATOR  = '#1C2535';   // divider / subtle stroke
  const ACCENT_GREEN  = '#00E676';   // electric pitch-green
  const ACCENT_AMBER  = '#FFB300';   // caution amber
  const LIVE_PILL     = '#E53935';   // broadcast-red
  const WHITE         = '#FFFFFF';
  const OFF_WHITE     = '#E8EDF5';
  const GRAY_DIM      = '#8896AA';
  const GRAY_SUBTLE   = '#3A4556';

  const isLive    = props.isLive;
  const clockText = isLive ? `${props.clock}\u2032` : props.statusDetail || 'FT';
  const scoreColor = isLive ? WHITE : GRAY_DIM;

  // ── BANNER ─────────────────────────────────────────────────────────────────
  const banner = (
    <VStack modifiers={[background(BG_DEEP), frame({ maxWidth: Infinity })]}>

      {/* Top accent bar */}
      <ZStack modifiers={[
        frame({ maxWidth: Infinity, height: 3 }),
        background(isLive ? ACCENT_GREEN : GRAY_SUBTLE),
      ]}>{null}</ZStack>

      <HStack modifiers={[
        padding({ horizontal: 16, vertical: 10 }),
        frame({ maxWidth: Infinity }),
      ]}>

        {/* HOME: badge + name stacked, score to the right */}
        <HStack modifiers={[frame({ width: 120 })]}>
          <ZStack modifiers={[
            frame({ width: 40, height: 40 }),
            background(BG_CARD),
            cornerRadius(8),
          ]}>
            <Text modifiers={[font({ weight: 'black', size: 13 }), foregroundStyle(ACCENT_GREEN)]}>
              {props.homeAbbrev.slice(0, 3).toUpperCase()}
            </Text>
          </ZStack>
          <Spacer />
          <Text modifiers={[
            font({ weight: 'black', size: 36 }),
            foregroundStyle(scoreColor),
          ]}>
            {props.homeScore}
          </Text>
        </HStack>

        {/* CENTRE */}
        <VStack modifiers={[frame({ width: 68 })]}>
          {isLive ? (
            <ZStack modifiers={[
              background(LIVE_PILL),
              cornerRadius(4),
              padding({ horizontal: 7, vertical: 2 }),
            ]}>
              <Text modifiers={[font({ weight: 'bold', size: 10 }), foregroundStyle(WHITE)]}>
                LIVE
              </Text>
            </ZStack>
          ) : null}
          <Text modifiers={[
            font({ weight: 'bold', size: 16 }),
            foregroundStyle(isLive ? ACCENT_GREEN : GRAY_DIM),
            padding({ top: 2 }),
          ]}>
            {clockText}
          </Text>
          <Text modifiers={[font({ size: 9 }), foregroundStyle(GRAY_DIM), padding({ top: 1 })]}>
            {props.leagueName}
          </Text>
        </VStack>

        {/* AWAY: score to the left, badge to the right */}
        <HStack modifiers={[frame({ width: 120 })]}>
          <Text modifiers={[
            font({ weight: 'black', size: 36 }),
            foregroundStyle(scoreColor),
          ]}>
            {props.awayScore}
          </Text>
          <Spacer />
          <ZStack modifiers={[
            frame({ width: 40, height: 40 }),
            background(BG_CARD),
            cornerRadius(8),
          ]}>
            <Text modifiers={[font({ weight: 'black', size: 13 }), foregroundStyle(ACCENT_AMBER)]}>
              {props.awayAbbrev.slice(0, 3).toUpperCase()}
            </Text>
          </ZStack>
        </HStack>

      </HStack>
    </VStack>
  );

  // ── COMPACT LEADING (Dynamic Island left) ──────────────────────────────────
  const compactLeading = (
    <HStack modifiers={[padding({ horizontal: 8, vertical: 0 })]}>
      <Image
        systemName="soccerball.inverse"
        modifiers={[frame({ width: 12, height: 12 }), foregroundStyle(ACCENT_GREEN)]}
      />
      <Text modifiers={[
        font({ weight: 'black', size: 15 }),
        foregroundStyle(WHITE),
        padding({ leading: 4 }),
      ]}>
        {props.homeScore}
      </Text>
    </HStack>
  );

  // ── COMPACT TRAILING (Dynamic Island right) ────────────────────────────────
  const compactTrailing = (
    <HStack modifiers={[padding({ horizontal: 8 })]}>
      <Text modifiers={[font({ weight: 'black', size: 15 }), foregroundStyle(WHITE)]}>
        {props.awayScore}
      </Text>
      <ZStack modifiers={[
        background(isLive ? LIVE_PILL : GRAY_SUBTLE),
        cornerRadius(3),
        padding({ horizontal: 4, vertical: 1 }),
        padding({ leading: 6 }),
      ]}>
        <Text modifiers={[font({ weight: 'bold', size: 10 }), foregroundStyle(WHITE)]}>
          {isLive ? `${props.clock}'` : 'FT'}
        </Text>
      </ZStack>
    </HStack>
  );

  // ── MINIMAL (Dynamic Island tiny dot) ─────────────────────────────────────
  const minimal = (
    <Text modifiers={[font({ weight: 'black', size: 13 }), foregroundStyle(ACCENT_GREEN)]}>
      {props.homeScore}–{props.awayScore}
    </Text>
  );

  // ── EXPANDED LEADING ───────────────────────────────────────────────────────
  const expandedLeading = (
    <VStack modifiers={[
      padding({ all: 12 }),
      background(BG_CARD),
      cornerRadius(14),
      frame({ maxWidth: Infinity }),
    ]}>
      {/* Team colour bar */}
      <ZStack modifiers={[
        frame({ width: 28, height: 4 }),
        background(ACCENT_GREEN),
        cornerRadius(2),
      ]}>{null}</ZStack>
      <Text modifiers={[
        font({ weight: 'black', size: 13 }),
        foregroundStyle(OFF_WHITE),
        padding({ top: 8, bottom: 2 }),
      ]}>
        {props.homeAbbrev.toUpperCase()}
      </Text>
      <Text modifiers={[font({ size: 10 }), foregroundStyle(GRAY_DIM)]}>
        {props.homeTeam}
      </Text>
      <Text modifiers={[
        font({ weight: 'black', size: 36 }),
        foregroundStyle(WHITE),
        padding({ top: 6 }),
      ]}>
        {props.homeScore}
      </Text>
    </VStack>
  );

  // ── EXPANDED TRAILING ──────────────────────────────────────────────────────
  const expandedTrailing = (
    <VStack modifiers={[
      padding({ all: 12 }),
      background(BG_CARD),
      cornerRadius(14),
      frame({ maxWidth: Infinity }),
    ]}>
      <ZStack modifiers={[
        frame({ width: 28, height: 4 }),
        background(ACCENT_AMBER),
        cornerRadius(2),
      ]}>{null}</ZStack>
      <Text modifiers={[
        font({ weight: 'black', size: 13 }),
        foregroundStyle(OFF_WHITE),
        padding({ top: 8, bottom: 2 }),
      ]}>
        {props.awayAbbrev.toUpperCase()}
      </Text>
      <Text modifiers={[font({ size: 10 }), foregroundStyle(GRAY_DIM)]}>
        {props.awayTeam}
      </Text>
      <Text modifiers={[
        font({ weight: 'black', size: 36 }),
        foregroundStyle(WHITE),
        padding({ top: 6 }),
      ]}>
        {props.awayScore}
      </Text>
    </VStack>
  );

  // ── EXPANDED CENTER ────────────────────────────────────────────────────────
  const expandedCenter = (
    <VStack modifiers={[frame({ maxWidth: Infinity })]}>
      {isLive ? (
        <HStack>
          {/* Pulsing dot via tinted circle image */}
          <Image
            systemName="circle.fill"
            modifiers={[frame({ width: 7, height: 7 }), foregroundStyle(LIVE_PILL)]}
          />
          <Text modifiers={[
            font({ weight: 'bold', size: 11 }),
            foregroundStyle(LIVE_PILL),
            padding({ leading: 4 }),
          ]}>
            LIVE
          </Text>
        </HStack>
      ) : null}
      <Text modifiers={[
        font({ weight: 'black', size: 22 }),
        foregroundStyle(isLive ? ACCENT_GREEN : GRAY_DIM),
        padding({ top: 2 }),
      ]}>
        {clockText}
      </Text>
      {/* Thin separator */}
      <ZStack modifiers={[
        frame({ width: 32, height: 1 }),
        background(BG_SEPARATOR),
        padding({ vertical: 4 }),
      ]}>{null}</ZStack>
      <Text modifiers={[font({ size: 9 }), foregroundStyle(GRAY_DIM)]}>
        {props.leagueName}
      </Text>
    </VStack>
  );

  // ── EXPANDED BOTTOM ────────────────────────────────────────────────────────
  const expandedBottom = (
    <HStack modifiers={[
      padding({ horizontal: 16, vertical: 8 }),
      background(BG_CARD),
      frame({ maxWidth: Infinity }),
    ]}>
      <Image
        systemName="soccerball"
        modifiers={[frame({ width: 10, height: 10 }), foregroundStyle(ACCENT_GREEN)]}
      />
      <Text modifiers={[
        font({ size: 11 }),
        foregroundStyle(GRAY_DIM),
        padding({ leading: 6 }),
      ]}>
        {props.homeTeam}
      </Text>
      <Text modifiers={[font({ weight: 'bold', size: 11 }), foregroundStyle(GRAY_SUBTLE), padding({ horizontal: 4 })]}>
        vs
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(GRAY_DIM)]}>
        {props.awayTeam}
      </Text>
      <Spacer />
      <Image
        systemName="sportscourt"
        modifiers={[frame({ width: 12, height: 12 }), foregroundStyle(GRAY_SUBTLE)]}
      />
    </HStack>
  );

  return {
    banner,
    compactLeading,
    compactTrailing,
    minimal,
    expandedLeading,
    expandedTrailing,
    expandedCenter,
    expandedBottom,
  };
};

export default createLiveActivity('MatchActivity', MatchActivity);