import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/tokens';
import { useQuotesStore, type Quote } from '../../src/store/quotesStore';
import { useShelfStore } from '../../src/store/shelfStore';
import { useXpStore } from '../../src/store/xpStore';
import { XP_RULES } from '../../src/utils/xp';

// 개발명세서 감정 태그 (위로·영감·성찰·유머)
const EMOTIONS: Array<{ key: Quote['emotion']; label: string; emoji: string; color: string }> = [
  { key: 'inspiring', label: '영감',  emoji: '✨', color: Colors.primary },
  { key: 'touching',  label: '위로',  emoji: '💙', color: '#4A9EDB' },
  { key: 'wise',      label: '성찰',  emoji: '🤔', color: Colors.purple },
  { key: 'funny',     label: '유머',  emoji: '😄', color: Colors.gold },
];

function getEmotionInfo(key: Quote['emotion']) {
  return EMOTIONS.find((e) => e.key === key) ?? EMOTIONS[0];
}

export default function QuotesScreen() {
  const { quotes, addQuote, removeQuote } = useQuotesStore();
  const shelfItems = useShelfStore((s) => s.items);
  const addXp = useXpStore((s) => s.addXp);

  const [showModal, setShowModal] = useState(false);
  const [filterEmotion, setFilterEmotion] = useState<Quote['emotion'] | null>(null);
  const [searchText, setSearchText] = useState('');

  // 입력 상태
  const [text, setText] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [page, setPage] = useState('');
  const [emotion, setEmotion] = useState<Quote['emotion']>('wise');

  const readBooks = shelfItems.filter((i) => i.status === 'READING' || i.status === 'DONE');

  const handleSave = () => {
    if (!text.trim()) return;
    const book = shelfItems.find((i) => i.id === selectedBookId);
    addQuote({
      text: text.trim(),
      bookTitle: book?.book.title ?? '직접 입력',
      bookAuthor: book?.book.author ?? '',
      page: page ? parseInt(page, 10) : undefined,
      emotion,
    });
    addXp(XP_RULES.SENTENCE_COLLECT, '문장 수집');
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setText('');
    setSelectedBookId(null);
    setPage('');
    setEmotion('wise');
  };

  const handleDelete = (id: string) => {
    Alert.alert('삭제', '이 한줄을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeQuote(id) },
    ]);
  };

  const handleVoiceSearch = () => {
    Alert.alert('음성 검색', '음성 인식 기능은 곧 지원될 예정이에요! 🎙\n(expo-speech / @react-native-voice 연동 예정)', [
      { text: '확인' },
    ]);
  };

  const filtered = quotes
    .filter((q) => !filterEmotion || q.emotion === filterEmotion)
    .filter((q) => !searchText || q.text.includes(searchText) || q.bookTitle.includes(searchText));

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>나만의 한줄</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 + 음성 검색 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="한줄 또는 책 제목 검색"
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.micBtn} onPress={handleVoiceSearch}>
            <Text style={styles.micIcon}>🎙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 감정 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filterEmotion && styles.filterChipActive]}
          onPress={() => setFilterEmotion(null)}
        >
          <Text style={[styles.filterText, !filterEmotion && styles.filterTextActive]}>전체</Text>
        </TouchableOpacity>
        {EMOTIONS.map((e) => (
          <TouchableOpacity
            key={e.key}
            style={[styles.filterChip, filterEmotion === e.key && { backgroundColor: e.color, borderColor: e.color }]}
            onPress={() => setFilterEmotion(filterEmotion === e.key ? null : e.key)}
          >
            <Text style={[styles.filterText, filterEmotion === e.key && { color: '#fff', fontWeight: '700' }]}>
              {e.emoji} {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 문장 목록 */}
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>
              {quotes.length === 0 ? '마음에 닿은 한줄을 모아보세요' : '검색 결과가 없어요'}
            </Text>
          </View>
        ) : (
          filtered.map((q) => <QuoteCard key={q.id} quote={q} onDelete={() => handleDelete(q.id)} />)
        )}
      </ScrollView>

      {/* 문장 추가 모달 */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>한줄 추가</Text>

            <TextInput
              style={styles.textArea}
              placeholder="기억하고 싶은 한줄을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />

            {/* 책 선택 */}
            {readBooks.length > 0 && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>책 선택</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookChips}>
                  {readBooks.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.bookChip, selectedBookId === b.id && styles.bookChipActive]}
                      onPress={() => setSelectedBookId(selectedBookId === b.id ? null : b.id)}
                    >
                      <Text style={[styles.bookChipText, selectedBookId === b.id && styles.bookChipTextActive]}
                        numberOfLines={1}>
                        {b.book.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 페이지 */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>페이지 (선택)</Text>
              <TextInput
                style={styles.pageInput}
                placeholder="ex) 123"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={page}
                onChangeText={setPage}
              />
            </View>

            {/* 감정 태그 — 명세서 한국어 통일 */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>감정 태그</Text>
              <View style={styles.emotionRow}>
                {EMOTIONS.map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[styles.emotionChip, emotion === e.key && { backgroundColor: e.color, borderColor: e.color }]}
                    onPress={() => setEmotion(e.key)}
                  >
                    <Text style={[styles.emotionText, emotion === e.key && { color: '#fff', fontWeight: '700' }]}>
                      {e.emoji} {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowModal(false); }}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !text.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!text.trim()}
              >
                <Text style={styles.saveText}>저장 +5XP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function QuoteCard({ quote, onDelete }: { quote: Quote; onDelete: () => void }) {
  const em = getEmotionInfo(quote.emotion);
  const date = new Date(quote.savedAt);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <Pressable style={styles.quoteCard} onLongPress={onDelete}>
      <View style={[styles.emotionDot, { backgroundColor: em.color }]}>
        <Text style={styles.emotionDotText}>{em.emoji} {em.label}</Text>
      </View>
      <Text style={styles.quoteText}>"{quote.text}"</Text>
      <View style={styles.quoteMeta}>
        <Text style={styles.quoteBook}>{quote.bookTitle}</Text>
        {quote.page ? <Text style={styles.quotePage}>p.{quote.page}</Text> : null}
        <Text style={styles.quoteDate}>{dateStr}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, paddingTop: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },

  searchWrap: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8,
    fontSize: FontSize.sm, color: Colors.text,
  },
  micBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 18 },

  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },

  quoteCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.card,
  },
  emotionDot: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.full },
  emotionDotText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  quoteText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22, fontStyle: 'italic' },
  quoteMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quoteBook: { fontSize: FontSize.xs, color: Colors.textSub, flex: 1 },
  quotePage: { fontSize: FontSize.xs, color: Colors.textMuted },
  quoteDate: { fontSize: FontSize.xs, color: Colors.textMuted },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.xl, gap: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  textArea: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md,
    color: Colors.text, minHeight: 100,
  },
  modalField: { gap: 8 },
  modalLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSub },
  bookChips: { gap: 8 },
  bookChip: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, maxWidth: 160,
  },
  bookChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bookChipText: { fontSize: FontSize.xs, color: Colors.textSub, fontWeight: '500' },
  bookChipTextActive: { color: '#fff', fontWeight: '700' },
  pageInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6,
    fontSize: FontSize.md, color: Colors.text, width: 100,
  },
  emotionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emotionChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  emotionText: { fontSize: FontSize.sm, color: Colors.textSub, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.full,
    alignItems: 'center', backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { color: Colors.textSub, fontWeight: '600', fontSize: FontSize.md },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center', backgroundColor: Colors.primary },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
