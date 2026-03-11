import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../common.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                  Signup.jsx - 회원가입 페이지                 │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /signup                                                │
 * │ API: POST /api/auth/signup                                   │
 * │                                                              │
 * │ 클라이언트 유효성 검사:                                       │
 * │   - 비밀번호 == 비밀번호 확인 일치 여부                       │
 * │ 서버 유효성 검사 (AuthController):                            │
 * │   - username 중복 체크                                        │
 * │   - email 중복 체크                                           │
 * └──────────────────────────────────────────────────────────────┘
 */
const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /**
   * 회원가입 처리
   * - 비밀번호 일치 여부 클라이언트에서 먼저 확인
   * - API 호출 후 성공 시 로그인 페이지(/) 이동
   * - 실패 시 서버 에러 메시지 표시 (중복 아이디/이메일 등)
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await api.post('/auth/signup', { username, email, password });
      alert('회원가입이 완료되었습니다!');
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || '이미 존재하는 아이디나 이메일일 수 있습니다.';
      alert(`회원가입 실패: ${msg}`);
    }
  };

  return (
    <div className="auth-bg" style={{ backgroundImage: 'url("/main.png")' }}>
      <div className="auth-overlay" />
      <div className="auth-box">
        <h2 style={{ margin: '0 0 30px' }}>MEMBER JOIN</h2>
        <form onSubmit={handleSignup}>
          <input className="auth-input" type="text" placeholder="Username (ID)"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="auth-input" type="email" placeholder="Email Address"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          {/* 비밀번호 확인 - 서버 전송 X, 클라이언트에서만 비교 */}
          <input className="auth-input" type="password" placeholder="Confirm Password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <button className="auth-btn" type="submit">SIGN UP NOW</button>
        </form>
        <div className="auth-links" style={{ marginTop: '20px', color: '#fff' }}>
          이미 회원이신가요? <Link to="/">로그인하기</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
