import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  // 프로필 사진 선택
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  /*
  //회원가입(구구)
  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert('입력 오류', '필수 항목을 입력하세요.');
      return;
    }

    try {
      const response = await axios.post('http://1.253.46.172:5000/auth/register', {
        username,
        email,
        password,
        profilePicture,
        phoneNumber,
        birthday,
      });

      if (response.data.success) {
        Alert.alert('회원가입 성공', '로그인 페이지로 이동합니다.');
        navigation.navigate('Login');
      } else {
        Alert.alert('회원가입 실패', response.data.message || '다시 시도하세요.');
      }
    } catch (error) {
      console.error('SignUp error:', error);
      Alert.alert('회원가입 오류', '네트워크를 확인하세요.');
    }
  };
  */
  // 회원가입
  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert('입력 오류', '필수 항목을 입력하세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('입력 오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    // 비밀번호 길이 검증 (5자리 이상)
    if (password.length < 5) {
      Alert.alert('입력 오류', '비밀번호는 5자리 이상이어야 합니다.');
      return;
    }

    /* // 생일 형식 검증 (8자리, YYYYMMDD)
    if (birthday && !/^\d{8}$/.test(birthday)) {
      Alert.alert('입력 오류', '생일은 YYYYMMDD 형식으로 입력해야 합니다.');
      return;
    }

    // 전화번호 형식 검증 (11자리)
    if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
      Alert.alert('입력 오류', '올바른 전화번호가 아닙니다.');
      return;
    } */
  
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phoneNumber', phoneNumber);
    formData.append('birthday', birthday);
  
    if (profilePicture) {
      const filename = profilePicture.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : 'jpg'; // 확장자 추출 (기본값 jpg)
  
      formData.append('profilePicture', {
        uri: profilePicture,
        name: `profile.${ext}`,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`, // jpg는 MIME 타입이 image/jpeg
      });
    }
  
    try {
      const response = await axios.post('http://1.253.46.172:5000/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.data.success) {
        Alert.alert('회원가입 성공', '로그인 페이지로 이동합니다.');
        navigation.navigate('Login');
      } else {
        Alert.alert('회원가입 실패', response.data.message || '다시 시도하세요.');
      }
    } catch (error) {
      console.error('SignUp error:', error);
      Alert.alert('회원가입 오류', '네트워크를 확인하세요.');
    }
  };  

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="이름(필수)"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="이메일(필수)"
        value={email}
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호(필수)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="전화번호"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="생일 (YYYY-MM-DD)"
        keyboardType="phone-pad"
        value={birthday}
        onChangeText={setBirthday}
      />

      {/* 이미지 업로드 버튼 */}
      <TouchableOpacity
        style={[styles.button, profilePicture && styles.disabledButton]}
        onPress={pickImage}
      >
        <Text style={styles.buttonText}>{profilePicture ? '사진 수정' : '사진 선택'}</Text>
      </TouchableOpacity>

      {/* 회원가입 버튼 */}
      <TouchableOpacity
        style={[styles.button, (!username || !email || !password) && styles.disabledButton]}
        onPress={handleSignUp}
        // disabled={!username || !email || !password}
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
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
  imageText: {
    marginVertical: 10,
    textAlign: 'center',
    color: 'green',
  },
  button: {
    width: '100%',  // 버튼 너비 조정
    padding: 10,
    backgroundColor: '#ff9500',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#ff9500', // 회원가입 버튼 색상 변경
  },
});

export default SignUpScreen;
