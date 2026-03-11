import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import '../common.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │             ResetPw.jsx - 비밀번호 재설정 페이지              │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /reset-pw?token={UUID}                                 │
 * │ API: POST /api/auth/reset-pw                                 │
 * │ Body: { "token": "...", "newPassword": "..." }               │
 * │                                                              │
 * │ 진입 방법:                                                    │
 * │   이메일로 받은 링크 클릭 → URL에 token 쿼리 파라미터 포함    │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │   1. URL에서 token 추출 (useSearchParams)                    │
 * │   2. token이 없으면 "잘못된 접근" 화면 표시                   │
 * │   3. 새 비밀번호 입력 및 확인 후 서버 전송                    │
 * │   4. 성공 시 로그인 페이지 이동                               │
 * │   5. 실패 시 서버 에러 메시지 표시 (만료/이미 사용된 토큰 등) │
 * └──────────────────────────────────────────────────────────────┘
 */
const ResetPw = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // URL에서 UUID 토큰 추출

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  /**
   * 비밀번호 재설정 처리
   * - 클라이언트: 새 비밀번호 == 확인 비밀번호 일치 여부 검사
   * - 서버: 토큰 유효성·만료·사용 여부 검증 후 비밀번호 변경
   */
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await api.post('/auth/reset-pw', { token, newPassword });
      alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      navigate('/');
    } catch (error) {
      // 서버에서 내려주는 메시지 표시 (만료된 링크, 이미 사용된 링크 등)
      const msg = error.response?.data?.message || '링크가 유효하지 않거나 만료되었습니다.';
      alert(msg);
    }
  };

  // ── 토큰 없이 직접 접근한 경우 (이메일 링크 없이 URL 직접 입력 등) ──
  if (!token) {
    return (
      <div className="auth-bg" style={{ backgroundImage: 'url("/main.png")' }}>
        <div className="auth-overlay" />
        <div className="auth-box">
          <h2>잘못된 접근입니다</h2>
          <p style={{ color: '#bbb', fontSize: '13px', marginTop: '16px' }}>
            이메일로 받은 링크를 통해 접근해 주세요.
          </p>
          <Link to="/" className="auth-btn" style={{ display: 'block', marginTop: '20px', textAlign: 'center' }}>
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg" style={{ backgroundImage: 'url("/main.png")' }}>
      <div className="auth-overlay" />
      <div className="auth-box">
        <h2 style={{ margin: '0 0 20px' }}>RESET PASSWORD</h2>
        <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '30px', lineHeight: 1.5 }}>
          새로운 비밀번호를 입력해 주세요.
        </p>
        <form onSubmit={handleReset}>
          <input
            className="auth-input"
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6} // 최소 6자 제한
          />
          <input
            className="auth-input"
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit">CHANGE PASSWORD</button>
        </form>
        <div className="auth-links" style={{ marginTop: '20px' }}>
          <Link to="/">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPw;
