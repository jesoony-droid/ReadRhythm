import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Image, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../src/constants/tokens';
import { searchBooks } from '../src/api/books';
import { useShelfStore } from '../src/store/shelfStore';
import type { Book, ReadingStatus } from '../src/types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const addBook = useShelfStore((s) => s.addBook);
  const shelfItems = useShelfStore((s) => s.items);

  const { data, isFetching } = useQuery({
    queryKey: ['bookSearch', submitted],
    queryFn: () => searchBooks(submitted),
    enabled: submitted.length > 0,
  });

  const handleSearch = useCallback(() => {
    if (query.trim()) setSubmitted(query.trim());
  }, [query]);

  const handleAdd = useCallback((book: Book, status: ReadingStatus) => {
    addBook(book, status);
    router.back();
  }, [addBook, router]);

  const inShelf = (isbn: string) => shelfItems.some((i) => i.book.isbn === isbn);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>도서 검색</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="책 제목 또는 저자 검색"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      {isFetching && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {!isFetching && data && (
        <FlatList
          data={data.books}
          keyExtractor={(item) => item.isbn}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SearchResultCard
              book={item}
              alreadyAdded={inShelf(item.isbn)}
              onAdd={handleAdd}
              onDetail={() => router.push(`/book-preview/${encodeURIComponent(item.isbn)}?title=${encodeURIComponent(item.title)}&author=${encodeURIComponent(item.author)}&cover=${encodeURIComponent(item.coverUrl ?? '')}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
            </View>
          }
        />
      )}

      {!isFetching && !data && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>읽고 싶은 책을 검색해보세요 📖</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function SearchResultCard({
  book, alreadyAdded, onAdd, onDetail,
}: {
  book: Book;
  alreadyAdded: boolean;
  onAdd: (book: Book, status: ReadingStatus) => void;
  onDetail: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Pressable style={styles.card} onPress={onDetail}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbIcon}>📖</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.cardAuthor} numberOfLines={1}>{book.author}</Text>
        {book.publisher && <Text style={styles.cardPublisher}>{book.publisher}</Text>}

        {alreadyAdded ? (
          <View style={styles.addedBadge}>
            <Text style={styles.addedText}>✓ 서재에 있어요</Text>
          </View>
        ) : showPicker ? (
          <View style={styles.pickerRow}>
            {(['READING', 'WANT'] as ReadingStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pickerBtn, s === 'READING' && styles.pickerBtnPrimary]}
                onPress={() => onAdd(book, s)}
              >
                <Text style={[styles.pickerBtnText, s === 'READING' && styles.pickerBtnTextPrimary]}>
                  {s === 'READING' ? '읽는 중' : '읽고 싶어요'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={(e) => { e.stopPropagation?.(); setShowPicker(true); }}
          >
            <Text style={styles.addBtnText}>+ 서재에 담기</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  backBtn: { padding: 4 },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  screenTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: FontSize.md, color: Colors.textMuted },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.card,
  },
  thumb: { width: 60, height: 84, borderRadius: Radius.sm, backgroundColor: Colors.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: 24 },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  cardAuthor: { fontSize: FontSize.sm, color: Colors.textSub },
  cardPublisher: { fontSize: FontSize.xs, color: Colors.textMuted },
  addBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  addBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  addedBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  addedText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.green },
  pickerRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  pickerBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pickerBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pickerBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSub },
  pickerBtnTextPrimary: { color: '#fff' },
});
