import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from 'zustand';
import { systemStore } from './src/stores/systemStore';

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL
  ?? (Platform.OS === 'web' ? '' : Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://127.0.0.1:8080');

/** 모바일 시작 화면에서 서버 연결·재시도·초기화를 제공하며 결과를 저장하지 않는다. */
export default function App() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  // 현재 연결 단계만 선택해 구독한다.
  const status = useStore(systemStore, state => state.status);
  // 검증된 응답만 선택해 화면에 표시한다.
  const info = useStore(systemStore, state => state.info);
  // 사용자에게 표시할 연결 오류만 선택한다.
  const error = useStore(systemStore, state => state.error);
  // 연결 액션을 선택하며 구독 과정에서는 요청하지 않는다.
  const checkConnection = useStore(systemStore, state => state.checkConnection);
  // 초기화 액션을 선택하며 구독 과정에서는 상태를 바꾸지 않는다.
  const reset = useStore(systemStore, state => state.reset);

  /** 주소가 달라지면 이전 서버의 연결 결과와 진행 요청을 초기화한다. */
  function changeApiUrl(value: string) {
    reset();
    setApiUrl(value);
  }

  /** 입력된 서버 주소로 연결을 확인하고 중복 요청은 스토어에서 차단한다. */
  function connect() {
    void checkConnection(apiUrl);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>운빨</Text>
            <Text style={styles.edition}>새로운 시작</Text>
          </View>
          <View style={styles.hero}>
            <Text style={styles.title}>오늘의 운을,{"\n"}새롭게 만나다.</Text>
            <Text style={styles.description}>나를 알아가는 운세 서비스를 준비하고 있어요.</Text>
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>앱의 첫 연결</Text>
            <Text style={styles.body}>운세 기능을 시작하기 전에 개발 서버와 연결을 확인해 보세요.</Text>
            <Text style={styles.label}>서버 주소</Text>
            <TextInput accessibilityLabel="서버 주소"
              autoCapitalize="none" autoCorrect={false} keyboardType="url"
              value={apiUrl} onChangeText={changeApiUrl}
              placeholder={Platform.OS === 'web' ? '로컬 개발 서버 프록시 사용' : 'http://서버주소:8080'}
              placeholderTextColor="#666875" style={styles.input}
            />
            <View accessibilityLiveRegion="polite" style={styles.feedback}>
              {status === 'loading' && <ActivityIndicator color="#2846AE" accessibilityLabel="연결 확인 중" />}
              <Text style={[styles.feedbackText, status === 'error' && styles.error]}>
                {status === 'idle' && '아직 연결을 확인하지 않았어요.'}
                {status === 'loading' && '서버에 연결하고 있어요.'}
                {status === 'success' && ('연결됐어요.\n' + info?.service + ' · ' + info?.stage)}
                {status === 'error' && error}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: status === 'loading' }}
              disabled={status === 'loading'} onPress={connect}
              style={[styles.primary, status === 'loading' && styles.disabled]}>
              <Text style={styles.primaryText}>{status === 'error' ? '다시 연결하기' : '연결 확인하기'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={reset} style={styles.secondary}>
              <Text style={styles.secondaryText}>연결 상태 초기화</Text>
            </Pressable>
          </View>
          <Text style={styles.footnote}>개발 중인 앱이에요. 운세 생성 기능은 아직 준비 중입니다.</Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F4FA' },
  page: { flexGrow: 1, padding: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  brand: { color: '#18223F', fontSize: 27, fontWeight: '800' },
  edition: { color: '#555D73', fontSize: 14 },
  hero: { paddingTop: 38, paddingBottom: 32, gap: 18 },
  title: { color: '#18223F', fontSize: 38, lineHeight: 51, fontWeight: '700', letterSpacing: -1.3 },
  description: { color: '#555D73', fontSize: 16, lineHeight: 26 },
  panel: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, gap: 14 },
  panelTitle: { color: '#18223F', fontSize: 22, fontWeight: '700' },
  body: { color: '#555D73', fontSize: 15, lineHeight: 24 },
  label: { color: '#343D55', fontSize: 14, fontWeight: '600', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#A5AEC2', borderRadius: 10, padding: 14, minHeight: 48, color: '#18223F', fontSize: 15 },
  feedback: { minHeight: 72, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackText: { flexShrink: 1, color: '#343D55', fontSize: 15, lineHeight: 24 },
  error: { color: '#A02935' },
  primary: { backgroundColor: '#2846AE', padding: 16, borderRadius: 12, alignItems: 'center', minHeight: 52 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  secondary: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: '#394D88', fontSize: 15, fontWeight: '600' },
  footnote: { color: '#555D73', fontSize: 13, lineHeight: 22, paddingVertical: 24 },
});
