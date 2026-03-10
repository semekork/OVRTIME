import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerTitle: "Search",
          headerLargeTitle: true,
          headerStyle: { backgroundColor: "#000000" },
          headerLargeTitleStyle: { color: "#FFFFFF" },
          headerTintColor: "#FFFFFF",
          headerSearchBarOptions: {
            placeholder: "Search by team, league, or competition...",
            hideWhenScrolling: false,
          },
        }}
      />
    </Stack>
  );
}
