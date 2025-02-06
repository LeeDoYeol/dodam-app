// utils/notifications.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// 푸시 알림 권한 요청 함수
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission to send notifications was denied');
    return false;
  }
  console.log('Permission granted');
  return true;
};

// Expo Push Token을 받아오는 함수
export const getExpoPushToken = async () => {
  if (Constants.isDevice) {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Expo Push Token:', token.data);

    // 토큰을 서버로 전송
    await sendTokenToServer(token.data);  // 서버로 토큰 전송 함수
    return token.data;
  } else {
    console.log('Push notifications only work on physical devices');
    return null;
  }
};

// Expo Push Token을 서버로 전송하는 함수
const sendTokenToServer = async (expoPushToken) => {
  try {
    const response = await fetch('http://1.253.46.172:5000/notification/store-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expoPushToken }),
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Push token successfully sent to the server');
    } else {
      console.error('Failed to send push token to the server');
    }
  } catch (error) {
    console.error('Error sending push token to the server:', error);
  }
};

// 앱에서 푸시 알림을 받는 리스너 설정
export const notificationListener = () => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  return () => {
    subscription.remove();
  };
};

// 백그라운드에서 푸시 알림을 처리하는 리스너 설정
export const backgroundNotificationListener = () => {
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification received in background:', response);
  });

  return () => {
    backgroundSubscription.remove();
  };
};
