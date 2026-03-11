import React from 'react';

const Terms = () => {
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
        <h1 style={styles.title}>이용약관</h1>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>제 1 조 (목적)</h2>
          <p style={styles.text}>본 약관은 MY HEALTH가 제공하는 모든 서비스의 이용 조건 및 절차, 이용자와 당사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>제 2 조 (서비스의 제공 및 변경)</h2>
          <p style={styles.text}>본 서비스는 운동 데이터 기록, 캐릭터 성장 시스템 등을 제공하며, 회사의 사정에 따라 서비스의 내용을 변경할 수 있습니다.</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>제 3 조 (이용자의 의무)</h2>
          <p style={styles.text}>이용자는 타인의 정보를 도용하거나 회사가 금지하는 정보를 전송하는 행위를 해서는 안 됩니다.</p>
        </div>
      </div>


    </div>
  );
};

export default Terms;