import React from 'react';

const Support = () => {
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
    contactBox: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      padding: '30px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    infoItem: { marginBottom: '15px', color: '#aaa' },
    label: { color: '#fff', fontWeight: 'bold', marginRight: '10px' },
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
        <h1 style={styles.title}>고객센터</h1>
        <div style={styles.contactBox}>
          <div style={styles.infoItem}>
            <span style={styles.label}>E-mail:</span> 90erkang@naver.com
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>운영시간:</span> 평일 10:00 - 18:00 (주말/공휴일 제외)
          </div>
          <div style={styles.infoItem}>
                      <span style={styles.label}>Tel:</span> 010-7752-9131
          </div>
          <p style={{ ...styles.infoItem, marginTop: '20px' }}>
            서비스 이용 중 발생한 버그 제보나 개선 제안은 언제든 환영합니다.
          </p>
        </div>
      </div>


    </div>
  );
};

export default Support;