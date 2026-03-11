import React from 'react';

const Privacy = () => {
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: 'sans-serif',
      lineHeight: '1.6'
    },
    content: {
      flex: 1,
      maxWidth: '800px',
      margin: '0 auto',
      padding: '60px 20px'
    },
    title: { fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold' },
    section: { marginBottom: '25px' },
    sectionTitle: { fontSize: '1.2rem', marginBottom: '10px', color: '#ddd' },
    text: { color: '#aaa', fontSize: '1rem' },
    footer: {
      marginTop: 'auto', padding: '40px 0 20px', textAlign: 'center',
      color: '#777', fontSize: '0.9rem', position: 'relative', zIndex: 10,
      borderTop: '1px solid rgba(255,255,255,0.05)'
    },
    links: {
      display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>개인정보처리방침</h1>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. 수집하는 개인정보 항목</h2>
          <p style={styles.text}>회사는 원활한 서비스 제공을 위해 사용자명, 운동 기록, 구글 연동 데이터(걸음 수, 거리)를 수집합니다.</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. 개인정보의 이용 목적</h2>
          <p style={styles.text}>수집된 정보는 게임 내 캐릭터 경험치 반영, 칼로리 소모량 계산 및 서비스 개선을 위한 통계 자료로 활용됩니다.</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. 정보의 보유 및 파기</h2>
          <p style={styles.text}>회원 탈퇴 시 또는 보유 기간 종료 시 해당 정보를 지체 없이 파기합니다.</p>
        </div>
      </div>


    </div>
  );
};

export default Privacy;