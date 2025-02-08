// PostDetail 화면 예시
import React, { useState, useEffect } from 'react';
import { Alert, StatusBar, View, Button, TextInput, Text, Image, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Card } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { requestNotificationPermission, getExpoPushToken, notificationListener, backgroundNotificationListener, sendPushNotificationToServer } from '../utils/notifications';


import axios from 'axios';  // axios
const SERVER_URL = "http://1.253.46.172:5000";

const PostDetail = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [token, setToken] = useState('');
  const [myid, setMyid] = useState(null);
  const [myusername, setMyusername] = useState('');
  const [myprofile_picture, setMyprofile_picture] = useState('');
  const [resizeModes, setResizeModes] = useState({}); // 각 이미지의 resizeMode 상태 저장

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        setToken(authToken);
        setMyid(await AsyncStorage.getItem('authid'));
        setMyusername(await AsyncStorage.getItem('authusername'));
        setMyprofile_picture(await AsyncStorage.getItem('authprofile_picture'));

        if (!authToken) {
          navigation.navigate('Login');
          return
        }
        // postId를 기반으로 해당 게시물 데이터를 가져옴
        fetchPostById(postId);

        // 5분마다 getPosts() 호출
        const intervalId = setInterval(() => {
            fetchPostById(postId);
        }, 60000); // 5000ms = 5초, 300000ms = 5분

        // 컴포넌트가 언마운트되면 interval을 정리
        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    checkLoginStatus();
  }, [postId]);

  const fetchPostById = async (postId) => {
    try {
        const response = await fetch(`${SERVER_URL}/posts?postId=${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
        });
        if (response.status === 401) {
          await AsyncStorage.removeItem('authToken'); // 저장된 토큰 삭제
          Alert.alert('세션 만료', '로그인이 만료되었습니다. 다시 로그인해주세요.');
          navigation.navigate('Login'); // 로그인 화면으로 이동
          return
        }
        else {
          const data = await response.json();
      
          // comments 필드가 JSON 문자열로 반환될 가능성이 있으므로 JSON 파싱
          const formattedData = data.map(post => ({
            ...post,
            created_at: post.created_at ? new Date(post.created_at).toISOString().slice(0, 19).replace("T", " ") : null,
            comments: typeof post.comments === "string" ? JSON.parse(post.comments) : post.comments
          }));
      
          setPost(formattedData[0]);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
  };

  // 좋아요 기능
const handleLike = async (id) => {
    try {
      const response = await axios.post(
        `${SERVER_URL}/posts/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // JWT를 Authorization 헤더에 포함
          }
        }
      );
  
      if (response.status === 200) {
        if (response.data.message === 'Like added') {
          sendPushNotificationToServer(
            `${myusername}님이 내 게시물을 좋아합니다.`,
            `좋아요를 누른 게시물을 확인해보세요!\n${post.text}`,
            post.user_id,
            post.id,
            myid
          );
        }
  
        setPost({
          ...post,
          likeCount: response.data.message === 'Like added' ? post.likeCount + 1 : post.likeCount - 1,
          isLiked: response.data.message === 'Like added' ? 1 : 0,
        });
      } else {
        Alert.alert('좋아요 실패', response.data.message);
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
      Alert.alert('오류 발생', '좋아요를 수정할 수 없습니다.');
    }
  };
  
  // 댓글 추가 기능
  const handleAddComment = async (id) => {
    if (newComment.trim() === '') {
      alert('댓글을 작성해주세요.');
      return;
    }
  
    try {
      const response = await fetch(`${SERVER_URL}/posts/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 인증 토큰 추가
        },
        body: JSON.stringify({ text: newComment }),
      });
  
      if (!response.ok) {
        throw new Error('댓글 추가에 실패했습니다.');
      }
  
      sendPushNotificationToServer(
        `${myusername}님이 내 게시물에 댓글을 달았습니다.`,
        newComment,
        post.user_id,
        post.id,
        myid
      );
  
      setPost({
        ...post,
        comments: [
          ...(post.comments?.filter(comment => comment.id !== null && comment.text !== null) || []), // null 값 제거
          {
            id: Date.now(),  // 댓글 ID는 고유해야 하므로 임시 ID 생성
            user_id: myid,
            username: myusername,
            profile_picture: myprofile_picture,
            text: newComment,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
        ],
        commentCount: post.commentCount + 1
      });
  
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('댓글 추가 중 오류가 발생했습니다.');
    }
  };
  
  // 삭제 기능
  const handleDelete = async (id) => {
    Alert.alert(
      '삭제 확인',
      '정말로 이 게시물을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${SERVER_URL}/posts/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`, // JWT를 Authorization 헤더에 포함
                  },
                  data: { userId: myid }, // 삭제 요청 시 body에 userId 포함
                }
              );
  
              if (response.status === 200) {
                setPost(null); // 게시물 삭제 후 상태 초기화
                navigation.navigate('Home');
              } else {
                Alert.alert('삭제 실패', response.data.message);
              }
            } catch (error) {
              console.error('삭제 오류:', error);
              Alert.alert('오류 발생', '게시물을 삭제할 수 없습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };  

  const toggleResizeMode = (postId) => {
    setResizeModes((prevModes) => ({
      ...prevModes,
      [postId]: (prevModes[postId] ?? 'cover') === 'cover' ? 'contain' : 'cover',
    }));
  };

  const handleDownload = async (imageUrl) => {
    try {
      // 미디어 라이브러리 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '이미지를 저장하려면 저장소 권한이 필요합니다.');
        return;
      }
  
      // 파일 확장자 추출
      const fileName = imageUrl.split('/').pop(); 
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  
      // 이미지 다운로드
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
  
      // 미디어 라이브러리에 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('도담 다운로드', asset, false);
  
      Alert.alert('다운로드 완료', '이미지가 갤러리에 저장되었습니다.');
    } catch (error) {
      console.error('다운로드 실패:', error);
      Alert.alert('다운로드 실패', '이미지를 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken'); // 저장된 토큰 삭제
    navigation.navigate('Login'); // 로그인 화면으로 이동
  };

  if (!post) return <Text>Loading...</Text>;

  return (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerText}>도담</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
            </TouchableOpacity>
            <Button title="로그아웃" onPress={handleLogout} color="#ff9500" />
        </View>
      <Card key='0' style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', margin: 10 }}>
            <Image source={{ uri: post.profile_picture }} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 10 }} />
            <View>
                <Text style={{ fontWeight: 'bold' }}>{post.username}</Text>
                <Text style={{ color: 'gray', fontSize: 12 }}>{post.created_at}</Text>
            </View>
            </View>
            {post.profile_picture==myprofile_picture && (
            <TouchableOpacity onPress={() => handleDelete(post.id)}>
                <Text style={{ paddingRight: 20 }}>🗑️</Text>
            </TouchableOpacity>
            )}
        </View>

        {post.image_url && (
            <TouchableOpacity onPress={() => toggleResizeMode(post.id)}>
            <Image
                source={{ uri: post.image_url }}
                style={{ width: '100%', height: undefined, aspectRatio: 1 }}
                resizeMode={resizeModes[post.id] || 'cover'} // 기본값은 'cover'
            />
            </TouchableOpacity>
        )}
        <Text style={{ padding: 10 }}>{post.text}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
            {/* 좋아요 버튼 */}
            <TouchableOpacity onPress={() => handleLike(post.id)}>
                <Text style={{ paddingVertical: 10, paddingHorizontal: 15 }}>{post.isLiked === 1 ? '❤️' : '🤍'} {post.likeCount}</Text>
            </TouchableOpacity>
            {/* 댓글 버튼 */}
            <Text style={{ paddingVertical: 10, paddingHorizontal: 15 }}>💬 {post.commentCount}</Text>
            </View>

            {/* 다운로드 버튼 */}
            {post.image_url && (
            <TouchableOpacity onPress={() => handleDownload(post.image_url)}>
                <Text style={{ paddingVertical: 10, paddingHorizontal: 15 }}>⬇️</Text>
            </TouchableOpacity>
            )}
        </View>

        {/* 댓글 리스트 */}
            <View>
            {/* 댓글 리스트 */}
            {post.comments &&
            Array.isArray(post.comments) &&
            post.comments.some(comment => comment.created_at !== null) && ( // created_at이 null이 아닌 댓글이 있을 때만 렌더링
                <View style={{ paddingLeft: 20, marginTop: 10 }}>
                <Text>댓글</Text>
                {post.comments.map((comment, idx) => (
                    comment.created_at !== null && ( // created_at이 null이 아닐 때만 표시
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                        source={{ uri: comment.profile_picture }}
                        style={{ width: 20, height: undefined, aspectRatio: 1, borderRadius: 5 }}
                        />
                        <Text style={{ marginLeft: 5 }}>
                        {comment.username} : {comment.text}
                        </Text>
                    </View>
                    )
                ))}
                </View>
            )}

            {/* 댓글 입력 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }}>
                <TextInput
                style={{ height: 40, borderColor: 'gray', borderBottomWidth: 1, borderLeftWidth: 1, borderTopWidth: 1, flex: 1, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }}
                placeholder="댓글 입력"
                value={newComment}
                onChangeText={setNewComment}
                />
                <TouchableOpacity style={[styles.commentButton, !newComment && styles.disabledButton]} onPress={() => handleAddComment(post.id)}>
                <Text style={styles.commentbuttonText}>등록</Text>
                </TouchableOpacity>
            </View>
            </View>
        </Card>
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
header: {
    width: '100%',
    height: 60,
    backgroundColor: '#ff9500', // 헤더 배경색
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
},
logo: {
    width: 50, // 로고의 가로 크기 (원하는 크기로 조정)
    height: 50,  // 로고의 세로 크기 (원하는 크기로 조정)
    resizeMode: 'contain', // 로고 비율 유지
},
headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white', // 글자 색상
},
floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#ff9500',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
},
floatingButtonText: {
    fontSize: 30,
    color: 'white',
},
modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
},
buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
},
imageButton: {
    width: '100%',  // 버튼 너비 조정
    padding: 5,
    backgroundColor: '#ff9500',
    borderRadius: 5,
    alignItems: 'center',
},
uploadButton: {
    width: '100%',  // 버튼 너비 조정
    padding: 5,
    backgroundColor: '#ff9500',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    alignItems: 'center',
    flex: 1,
},
cancelButton: {
    width: '100%',  // 버튼 너비 조정
    padding: 5,
    backgroundColor: '#ccc',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    flex: 1,
},
buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
},
imagedisabledButton: {
    backgroundColor: 'gray',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
},
disabledButton: {
    backgroundColor: 'gray',
},
commentButton: {
    width: 50,  // 버튼 너비 조정
    paddingVertical: 10,
    backgroundColor: '#ff9500',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    height: 40,
},
commentbuttonText: {
    color: "#fff",
    fontSize: 15,
},
});
  
  

export default PostDetail;
