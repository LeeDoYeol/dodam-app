// utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

// 푸시 알림 권한 요청 함수
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    //console.log('Permission to send notifications was denied');
    return false;
  }
  //console.log('Permission granted');
  return true;
};

// Expo Push Token을 받아오는 함수
export const getExpoPushToken = async (user_id) => {
  const token = await Notifications.getExpoPushTokenAsync();
  //console.log('Expo Push Token:', token.data);

  // 토큰을 서버로 전송
  await sendTokenToServer(token.data, user_id);  // 서버로 토큰 전송 함수
  return token.data;
};

// Expo Push Token을 서버로 전송하는 함수
const sendTokenToServer = async (expoPushToken, user_id) => {
  try {
    const response = await fetch('http://1.253.46.172:5000/notification/store-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expoPushToken, user_id }),
    });
    
    const data = await response.json();
    if (data.success) {
    } else {
      Alert.alert('알림 수신 설정 실패', '알림 수신 설정을 실패했습니다.\n앱을 다시 시작해주세요.')
      console.error('Failed to send push token to the server');
    }
  } catch (error) {
    console.error('Error sending push token to the server:', error);
  }
};

// Expo 앱 → Node.js 서버로 푸시 알림 요청 함수
export const sendPushNotificationToServer = async (title, message, id, post_id, myid) => {
    try {
      const response = await fetch('http://1.253.46.172:5000/notification/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message, id, post_id, myid }),
      });
  
      const data = await response.json();
      if (data.success) {
        //console.log('Push notification request sent successfully');
      } else {
        Alert.alert('알림 전송 실패', '다른 사용자에게 알림 전송을 실패했습니다.\n(작업은 성공)')
        console.error('Failed to send push notification request');
      }
    } catch (error) {
      console.error('Error sending push notification request:', error);
    }
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // 🔔 알림을 화면에 표시
      shouldPlaySound: true, // 🔊 소리 재생
      shouldSetBadge: false, // 🔴 앱 아이콘 배지 설정 X
    }),
  });

// 앱에서 푸시 알림을 받는 리스너 설정
export const notificationListener = async (navigation) => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {  
      // 알림 내용을 추출하여 UI에 표시
      // 알림 내용을 추출하여 UI에 표시
        const { title, body, data } = notification.request.content;

        // Alert로 사용자에게 알림 표시 
        if (title && body) {
        Alert.alert(
            title, // 알림 제목
            body,  // 알림 내용
            [
            {
                text: "이동", // 확인 버튼
                onPress: () => {
                // 확인 버튼을 누르면 게시물 디테일 화면으로 네비게이션
                if (data && data.post_id) {
                    navigation.navigate('PostDetail', { postId: data.post_id });
                }
                },
            },
            {
                text: "취소", // 취소 버튼
                onPress: () => {
                // 아무 동작도 하지 않음
                //console.log('취소');
                },
            },
            ]
        );
        }
    });
  
    return () => {
      subscription.remove();
    };
  };

// 백그라운드에서 푸시 알림을 처리하는 리스너 설정
export const backgroundNotificationListener = (navigation) => {  
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { postId } = response.notification.request.content.data;
    if (postId) {
        navigation.navigate('PostDetail', { postId });
    }
    });
  
    return () => {
      backgroundSubscription.remove();
    };
  };
