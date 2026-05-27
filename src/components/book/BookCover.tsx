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
  if (coverUrl) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={[styles.cover, { width, height }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width, height, backgroundColor: spineColor }]}>
      <Text style={styles.placeholderText} numberOfLines={3}>
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
    padding: 6,
    justifyContent: 'flex-end',
  },
  placeholderText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 13,
  },
});
