import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          navigation.navigate('Home');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://1.253.46.172:5000/auth/login', { email, password });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('authid', String(response.data.id));
        await AsyncStorage.setItem('authusername', response.data.username);
        await AsyncStorage.setItem('authprofile_picture', response.data.profile_picture);
        //Alert.alert('Login successful');
        navigation.navigate('Home');
      } else {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 틀렸습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('로그인 오류', '오류가 발생했습니다.');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {/* 로그인 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      {/* 회원가입 버튼 */}
      <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={handleSignUp}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: '50%', // 로고의 가로 크기 (원하는 크기로 조정)
    height: '50%',  // 로고의 세로 크기 (원하는 크기로 조정)
    resizeMode: 'contain', // 로고 비율 유지
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 5,
    paddingLeft: 10,
    width: '100%',
    borderRadius: 5,
  },
  button: {
    width: '100%',  // 버튼 너비 조정
    padding: 10,
    backgroundColor: '#ff9500',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: 'gray', // 회원가입 버튼 색상 변경
  },
});

export default LoginScreen;
