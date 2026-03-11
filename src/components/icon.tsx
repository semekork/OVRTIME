/**
 * Cross-platform Icon component.
 * - iOS: Uses expo-symbols SymbolView (SF Symbols)
 * - Android/Web: Uses @expo/vector-icons MaterialIcons
 */
import { Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

let SymbolView: any = null;
if (Platform.OS === 'ios') {
  // Only import on iOS to avoid crash on Android
  SymbolView = require('expo-symbols').SymbolView;
}

type IconProps = {
  /** SF Symbol name (iOS) */
  sf: string;
  /** Material Icon name (Android fallback) */
  material: string;
  size?: number;
  color?: string;
};

export function Icon({ sf, material, size = 20, color = '#FFFFFF' }: IconProps) {
  if (Platform.OS === 'ios' && SymbolView) {
    return <SymbolView name={sf} tintColor={color} size={size} />;
  }
  return <MaterialIcons name={material as any} size={size} color={color} />;
}
