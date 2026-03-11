import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │           PageLayout.jsx - 공통 페이지 레이아웃 래퍼          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Main, Diet, Routine, MyBody 등 모든 내부 페이지가 사용        │
 * │                                                              │
 * │ 구조:                                                         │
 * │   ┌─────────────────────────────────┐                        │
 * │   │ 배경 이미지 (bgImage)           │                        │
 * │   │  ┌───────────────────────────┐  │                        │
 * │   │  │ 어두운 오버레이 (70%)     │  │                        │
 * │   │  └───────────────────────────┘  │                        │
 * │   │  ┌───────────────────────────┐  │                        │
 * │   │  │ 콘텐츠 래퍼 (maxWidth)    │  │                        │
 * │   │  │   [Navbar]                │  │                        │
 * │   │  │   {children}              │  │                        │
 * │   │  │   [Footer]                │  │                        │
 * │   │  └───────────────────────────┘  │                        │
 * │   └─────────────────────────────────┘                        │
 * │                                                              │
 * │ Props:                                                        │
 * │   bgImage    : 배경 이미지 경로 (기본값: '/main.png')         │
 * │   showNavbar : Navbar 표시 여부 (기본값: true)                │
 * │   showFooter : Footer 표시 여부 (기본값: true)                │
 * │   maxWidth   : 콘텐츠 최대 너비 (기본값: '100%')              │
 * │                                                              │
 * │ 모바일(≤430px): 좌우 padding 10px                            │
 * │ 데스크탑: 좌우 padding 20px                                  │
 * └──────────────────────────────────────────────────────────────┘
 */
const PageLayout = ({
  children,
  bgImage = '/main.png',
  showNavbar = true,
  showFooter = true,
  maxWidth = '100%'
}) => {
  return (
    // 전체 화면 배경 (배경 이미지 + fixed 스크롤)
    <div style={{
      backgroundImage: `url("${bgImage}")`,
      minHeight: '100vh',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#fff',
      fontFamily: '"Noto Sans KR", sans-serif',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 어두운 오버레이: 배경 이미지 위에 70% 불투명 검은 레이어 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1
      }} />

      {/* 실제 콘텐츠 래퍼 (z-index 2로 오버레이 위에 위치) */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: maxWidth,
        margin: '0 auto',
        width: '100%',
        padding: window.innerWidth <= 430 ? '0 10px' : '0 20px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {showNavbar && <Navbar />}
        <div style={{ flex: 1 }}>
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

export default PageLayout;
