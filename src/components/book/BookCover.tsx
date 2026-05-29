import { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface Props {
  coverUrl?: string;
  title: string;
  spineColor?: string;
  width?: number;
  height?: number;
}

export function BookCover({ coverUrl, title, spineColor = Colors.primary, width = 80, height = 112 }: Props) {
  const [imgError, setImgError] = useState(false);

  if (coverUrl && !imgError) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={[styles.cover, { width, height }]}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width, height, backgroundColor: spineColor }]}>
      <Text style={styles.placeholderText} numberOfLines={4}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
  },
  placeholder: {
    borderRadius: Radius.sm,
    padding: 8,
    justifyContent: 'flex-end',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 14,
  },
});
