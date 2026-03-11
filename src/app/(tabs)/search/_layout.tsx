import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: Platform.OS === 'ios',
          headerTitle: 'Search',
          headerLargeTitle: false,
          headerStyle: { backgroundColor: '#000000' },
          headerLargeTitleStyle: { color: '#FFFFFF' },
          headerTintColor: '#FFFFFF',
          headerSearchBarOptions: {
            placeholder: 'Search by team, league, or competition...',
            hideWhenScrolling: true,
          },
        }}
      />
    </Stack>
  );
}
