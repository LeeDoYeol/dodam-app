import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

const PostCard = ({ post }) => {
  return (
    <Card style={styles.card}>
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.image} />
      )}
      <Text style={styles.text}>{post.text}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  text: {
    padding: 10,
  },
});

export default PostCard;
