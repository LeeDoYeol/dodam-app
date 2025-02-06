import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import * as Notifications from "expo-notifications";
import { requestNotificationPermission, getExpoPushToken, notificationListener, backgroundNotificationListener } from './utils/notifications';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await getExpoPushToken();  // Expo Push Token을 서버로 보내는 함수 호출
      }
    };

    setupNotifications();

    const unsubscribe = notificationListener();
    const backgroundUnsubscribe = backgroundNotificationListener();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (typeof backgroundUnsubscribe === 'function') backgroundUnsubscribe();
    };
  }, []);
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}  
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}  
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}  
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
