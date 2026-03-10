/**
 * OVRTIME Match Live Activity
 * Uses expo-widgets + @expo/ui/swift-ui.
 * Note: @expo/ui Image only supports SF Symbols (systemName), so we use
 * team abbreviation text alongside soccerball icon for the Dynamic Island.
 */
import {
  HStack,
  VStack,
  Text,
  Image,
  Spacer,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  padding,
  frame,
  background,
  cornerRadius,
} from '@expo/ui/swift-ui/modifiers';
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

const MatchActivity = (props: MatchActivityProps = {} as MatchActivityProps) => {
  'widget';

  const scoreText = `${props.homeScore}  –  ${props.awayScore}`;
  const clockText = props.isLive ? `${props.clock}'` : (props.statusDetail || 'FT');
  const liveColor = '#FF3B30';
  const accentColor = '#FF6B00';

  return {
    // Lock Screen banner – full-width
    banner: (
      <VStack modifiers={[padding({ all: 14 })]}>
        {/* Score row */}
        <HStack>
          <VStack>
            <Text modifiers={[font({ size: 12 }), foregroundStyle('#999999')]}>
              {props.homeAbbrev}
            </Text>
            <Text modifiers={[font({ weight: 'bold', size: 28 }), foregroundStyle('#FFFFFF')]}>
              {props.homeScore}
            </Text>
          </VStack>
          <Spacer />
          <VStack>
            <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(props.isLive ? liveColor : '#666666')]}>
              {clockText}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle('#666666')]}>
              {props.leagueName}
            </Text>
          </VStack>
          <Spacer />
          <VStack>
            <Text modifiers={[font({ size: 12 }), foregroundStyle('#999999')]}>
              {props.awayAbbrev}
            </Text>
            <Text modifiers={[font({ weight: 'bold', size: 28 }), foregroundStyle('#FFFFFF')]}>
              {props.awayScore}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    ),

    // Compact Dynamic Island – leading (home score)
    compactLeading: (
      <HStack modifiers={[padding({ horizontal: 6 })]}>
        <Image systemName="soccerball" modifiers={[frame({ width: 14, height: 14 }), foregroundStyle(accentColor)]} />
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle('#FFFFFF'), padding({ leading: 3 })]}>
          {props.homeScore}
        </Text>
      </HStack>
    ),

    // Compact Dynamic Island – trailing (away score)
    compactTrailing: (
      <HStack modifiers={[padding({ horizontal: 6 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle('#FFFFFF'), padding({ trailing: 3 })]}>
          {props.awayScore}
        </Text>
      </HStack>
    ),

    // Minimal Dynamic Island (smallest form)
    minimal: (
      <Text modifiers={[font({ weight: 'bold', size: 12 }), foregroundStyle(accentColor)]}>
        {props.homeScore}–{props.awayScore}
      </Text>
    ),

    // Expanded Dynamic Island – leading panel (home team)
    expandedLeading: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image systemName="house.fill" modifiers={[frame({ width: 20, height: 20 }), foregroundStyle(accentColor)]} />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#CCCCCC'), padding({ top: 4 })]}>{props.homeAbbrev}</Text>
        <Text modifiers={[font({ weight: 'bold', size: 26 }), foregroundStyle('#FFFFFF')]}>{props.homeScore}</Text>
      </VStack>
    ),

    // Expanded Dynamic Island – trailing panel (away team)
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 10 })]}>
        <Image systemName="airplane" modifiers={[frame({ width: 20, height: 20 }), foregroundStyle('#888888')]} />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#CCCCCC'), padding({ top: 4 })]}>{props.awayAbbrev}</Text>
        <Text modifiers={[font({ weight: 'bold', size: 26 }), foregroundStyle('#FFFFFF')]}>{props.awayScore}</Text>
      </VStack>
    ),

    // Expanded Dynamic Island – center (clock)
    expandedCenter: (
      <VStack>
        <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(props.isLive ? liveColor : '#888888')]}>
          {clockText}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle('#555555')]}>{props.leagueName}</Text>
      </VStack>
    ),

    // Expanded Dynamic Island – bottom strip
    expandedBottom: (
      <HStack modifiers={[padding({ horizontal: 16, bottom: 8 })]}>
        <Image systemName="soccerball" modifiers={[frame({ width: 12, height: 12 }), foregroundStyle(accentColor)]} />
        <Text modifiers={[font({ size: 12 }), foregroundStyle('#777777'), padding({ leading: 6 })]}>
          {props.homeTeam} vs {props.awayTeam}
        </Text>
      </HStack>
    ),
  };
};

export default createLiveActivity('MatchActivity', MatchActivity);
