import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  requestPermissionsAsync();
}

async function requestPermissionsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goals', {
      name: 'Match Goals',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
}

export async function sendGoalNotification(matchName: string, homeTeam: string, awayTeam: string, homeScore: string, awayScore: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'GOAL! ⚽️',
      body: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
      data: { match: matchName },
    },
    trigger: null, // Send immediately
  });
}
