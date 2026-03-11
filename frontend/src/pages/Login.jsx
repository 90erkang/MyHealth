import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../common.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    Login.jsx - 로그인 페이지                  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /                                                      │
 * │ API: POST /api/auth/login                                    │
 * │                                                              │
 * │ 로그인 성공 시 localStorage에 저장되는 값:                    │
 * │   'token'    : JWT (24시간 유효, api.js 인터셉터가 자동 첨부) │
 * │   'userId'   : 유저 PK (숫자)                                 │
 * │   'username' : 로그인 아이디                                  │
 * │   'role'     : 'USER' 또는 'ADMIN'                            │
 * └──────────────────────────────────────────────────────────────┘
 */
const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  /**
   * 로그인 처리
   * - 성공: JWT + 유저 정보 localStorage 저장 → /main 이동
   * - 401: 아이디/비밀번호 불일치 알림
   * - 기타: 백엔드 연결 실패 알림
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, id, username: uname, role } = response.data;

      // JWT와 사용자 정보를 localStorage에 저장 (api.js 인터셉터가 token을 자동 사용)
      localStorage.setItem('token', token);
      localStorage.setItem('userId', id);
      localStorage.setItem('username', uname);
      localStorage.setItem('role', role);

      alert(`${uname}님 환영합니다!`);
      navigate('/main');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('아이디나 비밀번호가 틀렸습니다.');
      } else {
        alert('서버 연결 실패. 백엔드 켜져 있습니까?');
      }
    }
  };

  return (
    // 배경 이미지 + 어두운 오버레이 (common.css의 auth-bg 클래스)
    <div className="auth-bg" style={{ backgroundImage: 'url("/main.png")' }}>
      <div className="auth-overlay" />
      <div className="auth-box">
        <h2 style={{ margin: '0 0 30px', letterSpacing: '2px' }}>MEMBER LOGIN</h2>
        <form onSubmit={handleLogin}>
          <input className="auth-input" type="text" placeholder="Username"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="auth-btn" type="submit">LOGIN</button>
        </form>
        <div className="auth-links" style={{ marginTop: '20px' }}>
          <Link to="/find-pw">비밀번호 찾기</Link> | <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
