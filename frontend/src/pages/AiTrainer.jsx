import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import PageLayout from '../components/PageLayout';
import '../common.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              AiTrainer.jsx - AI 트레이너 챗봇 페이지          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /ai-trainer                                            │
 * │ API: POST /api/ai/chat                                       │
 * │ Body: { "message": "사용자 입력" }                           │
 * │                                                              │
 * │ 백엔드에서 Gemini 2.5 Flash API 호출 후 응답 반환            │
 * │ 응답 형식: Gemini 원본 JSON 그대로 전달                       │
 * │   response.data.candidates[0].content.parts[0].text         │
 * │                                                              │
 * │ UI 특징:                                                      │
 * │   - 채팅 말풍선 UI (사용자: 오른쪽/주황, 봇: 왼쪽/회색)     │
 * │   - URL 자동 하이퍼링크 변환 (formatMessage)                 │
 * │   - 새 메시지 도착 시 자동 스크롤 (scrollRef)                │
 * │   - Enter키로 전송                                            │
 * └──────────────────────────────────────────────────────────────┘
 */
const AiTrainer = () => {
  // 초기 봇 메시지로 시작
  const [messages, setMessages] = useState([
    { type: 'bot', text: '무엇이든 물어보세요.' }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(); // 메시지 목록 컨테이너 ref (자동 스크롤용)

  // 새 메시지가 추가될 때마다 맨 아래로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /**
   * 텍스트 포맷터: URL → 하이퍼링크, 줄바꿈 → <br>
   * dangerouslySetInnerHTML로 렌더링되므로 XSS 주의
   * (Gemini 응답 텍스트 기반이므로 사용자 입력 직접 삽입 아님)
   */
  const formatMessage = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const textWithLinks = text.replace(urlRegex, (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#4da6ff;text-decoration:underline;font-weight:bold;">[클릭하여 바로보기]</a>`
    );
    return textWithLinks.replace(/\n/g, '<br>');
  };

  /**
   * 메시지 전송 처리
   * 1. 사용자 메시지를 messages 배열에 추가
   * 2. 백엔드 /api/ai/chat 호출
   * 3. Gemini 응답을 파싱해서 봇 메시지로 추가
   * 4. 에러 시 에러 메시지를 봇 말풍선으로 표시
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userText });

      if (response.data && response.data.candidates) {
        // Gemini 응답 구조: candidates[0].content.parts[0].text
        const botReply = response.data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { type: 'bot', text: formatMessage(botReply) }]);
      } else {
        throw new Error('응답 없음');
      }
    } catch (err) {
      console.error('백엔드 통신 에러:', err);
      if (err.response?.data?.error) {
        setMessages(prev => [...prev, { type: 'bot', text: err.response.data.error }]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: '서버 연결에 문제가 있습니다. 백엔드 콘솔을 확인해주세요.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    chatBox:  { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', display: 'flex', flexDirection: 'column', height: '650px', overflow: 'hidden', marginBottom: '20px' },
    message:  { maxWidth: '85%', padding: '12px 18px', borderRadius: '20px', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '15px', wordBreak: 'break-word' },
    userMsg:  { alignSelf: 'flex-end',  background: '#e67e22', color: '#fff', borderRadius: '20px 20px 0 20px' },
    botMsg:   { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', color: '#ddd', border: '1px solid #444', borderRadius: '20px 20px 20px 0' },
    loadingContainer: { alignSelf: 'flex-start', color: '#e67e22', fontSize: '0.9rem', marginBottom: '10px', paddingLeft: '20px' }
  };

  return (
    <PageLayout maxWidth="1200px">
      <Link to="/main" className="back-link" style={{ color: '#ccc', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        <i className="fas fa-arrow-left"></i> 메인으로
      </Link>

      <div style={styles.chatBox}>
        {/* 챗봇 헤더 (AI 트레이너 이름 + 접속 상태) */}
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-robot" style={{ color: '#e67e22', fontSize: '1.8rem' }}></i>
            {/* 초록 점: 온라인 상태 표시 */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#2ecc71', borderRadius: '50%', border: '2px solid #222' }}></div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👨‍💻 AI 트레이너</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>접속 중....</div>
          </div>
        </div>

        {/* 메시지 목록 (자동 스크롤) */}
        <div ref={scrollRef} style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg, idx) => (
            <div key={idx}
              style={{ ...styles.message, ...(msg.type === 'user' ? styles.userMsg : styles.botMsg) }}
              // Gemini 응답의 URL 링크 및 \n → <br> 변환 결과를 HTML로 렌더링
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          ))}
          {/* 로딩 중 표시 */}
          {loading && (
            <div style={styles.loadingContainer}>
              <i className="fas fa-dumbbell fa-spin" style={{ marginRight: '8px' }}></i>
              잠시 기다려 주세요. 💪
            </div>
          )}
        </div>

        {/* 입력창 + 전송 버튼 */}
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="질문을 입력하세요...(엔터)"
            style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', background: '#111', border: '1px solid #333', color: '#fff', outline: 'none' }} />
          <button onClick={handleSend}
            style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e67e22', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default AiTrainer;
