import React from 'react';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │               Footer.jsx - 공통 푸터 컴포넌트                │
 * ├──────────────────────────────────────────────────────────────┤
 * │ PageLayout에 포함되어 모든 내부 페이지 하단에 렌더링          │
 * │                                                              │
 * │ 기능:                                                         │
 * │   - 이용약관 / 개인정보처리방침 / 고객센터 링크               │
 * │   - 각 링크 클릭 시 500×600 팝업 창으로 열림                 │
 * │   - 팝업은 화면 중앙에 위치 (left, top 자동 계산)            │
 * │                                                              │
 * │ 팝업 대상 경로:                                               │
 * │   /terms   → Terms.jsx                                       │
 * │   /privacy → Privacy.jsx                                     │
 * │   /support → Support.jsx                                     │
 * └──────────────────────────────────────────────────────────────┘
 */
const Footer = () => {
  const styles = {
    footer: {
      marginTop: 'auto', padding: '40px 0 20px', textAlign: 'center',
      color: '#777', fontSize: '0.9rem', position: 'relative', zIndex: 10,
      borderTop: '1px solid rgba(255,255,255,0.05)'
    },
    links: {
      display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px'
    }
  };

  /**
   * 팝업 창 열기
   * @param {string} path - 팝업으로 열 경로 (/terms, /privacy, /support)
   */
  const openPopup = (path) => {
    const width = 500;
    const height = 600;

    // 화면 중앙 좌표 계산
    const left = (window.screen.width / 2) - (width / 2);
    const top  = (window.screen.height / 2) - (height / 2);

    window.open(
      path,
      '_blank',
      `width=${width}, height=${height}, top=${top}, left=${left}, scrollbars=yes, resizable=no`
    );
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.links}>
        <span style={{ cursor: 'pointer' }} onClick={() => openPopup('/terms')}>이용약관</span>
        <span style={{ cursor: 'pointer', color: '#aaa' }} onClick={() => openPopup('/privacy')}>개인정보처리방침</span>
        <span style={{ cursor: 'pointer' }} onClick={() => openPopup('/support')}>고객센터</span>
      </div>
      <p>&copy; 2026 MY HEALTH. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
