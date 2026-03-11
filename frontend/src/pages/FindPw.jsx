import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../common.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              FindPw.jsx - 비밀번호 찾기 페이지                │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /find-pw                                               │
 * │ API: POST /api/auth/find-pw                                  │
 * │ Body: { "email": "..." }                                     │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │   1. 이메일 입력 → 서버로 전송                                │
 * │   2. 서버에서 Gmail SMTP로 재설정 링크 발송                   │
 * │   3. 성공 메시지 표시 → 로그인 페이지로 이동                  │
 * │                                                              │
 * │ 재설정 링크 형식: /reset-pw?token={UUID}                     │
 * │ 링크 유효 시간: 30분 (서버 측 만료 처리)                      │
 * └──────────────────────────────────────────────────────────────┘
 */
const FindPw = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  /**
   * 비밀번호 찾기 처리
   * - 성공: "이메일 전송됨" 알림 후 로그인 페이지로 이동
   * - 404: 해당 이메일로 가입된 계정 없음
   * - 기타: 서버 연결 실패
   */
  const handleFindPw = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/find-pw', { email });
      alert('전송되었습니다. 이메일을 확인해주세요.');
      navigate('/');
    } catch (error) {
      if (error.response?.status === 404) {
        alert('해당 이메일로 가입된 정보가 없습니다.');
      } else {
        alert('서버랑 연결이 안 됩니다. 백엔드 상태를 확인하세요.');
      }
    }
  };

  return (
    <div className="auth-bg" style={{ backgroundImage: 'url("/main.png")' }}>
      <div className="auth-overlay" />
      <div className="auth-box">
        <h2 style={{ margin: '0 0 20px' }}>FORGOT PASSWORD</h2>
        <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '30px', lineHeight: 1.5 }}>
          가입하신 이메일을 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.
        </p>
        <form onSubmit={handleFindPw}>
          <input className="auth-input" type="email" placeholder="Email Address"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="auth-btn" type="submit">SEND RESET LINK</button>
        </form>
        <div className="auth-links" style={{ marginTop: '20px' }}>
          <Link to="/">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default FindPw;
