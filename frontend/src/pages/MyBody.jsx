/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │               MyBody.jsx - 신체 데이터 관리 페이지            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /my-body                                               │
 * │                                                              │
 * │ API:                                                          │
 * │   GET    /api/health/{username}       - 전체 기록 조회        │
 * │   POST   /api/health/{username}       - 기록 저장(Upsert)    │
 * │   DELETE /api/health/{username}/{date}- 특정 날짜 기록 삭제  │
 * │                                                              │
 * │ 주요 기능:                                                    │
 * │   - 달력 UI: 날짜 클릭 → 신체 정보 입력/조회 모달            │
 * │   - 입력 항목: 키, 몸무게, 수축기 혈압, 이완기 혈압, 혈당     │
 * │   - BMI 자동 계산 + 상태 분류 (저체중/정상/과체중/비만)      │
 * │   - 목표 체중 계산 (BMI 22 기준)                             │
 * │   - Chart.js 월별 선 그래프 (몸무게/BMI/혈압/혈당)           │
 * │   - 사용 가이드 모달 (파란색 테마)                           │
 * │                                                              │
 * │ BMI 기준:                                                     │
 * │   < 18.5: 저체중 (파랑)                                      │
 * │   18.5~23: 정상 (초록)                                       │
 * │   23~25: 과체중 (노랑)                                       │
 * │   ≥ 25: 비만 (빨강)                                          │
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import PageLayout from '../components/PageLayout';
import '../common.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MyBody = () => {
  const savedUser = localStorage.getItem('username');
  const USERNAME = savedUser || 'boss';

  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoverId, setHoverId] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const [modal, setModal] = useState({ isOpen: false, date: null });
  const [showGuide, setShowGuide] = useState(false);
  const [inputForm, setInputForm] = useState({
    height: 175, weight: '', systolicBp: '', diastolicBp: '', bloodSugar: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // ✅ api.js 사용 (하드코딩 localhost:8080 제거)
      const res = await api.get(`/health/${USERNAME}`);
      const dataMap = {};
      res.data.forEach(record => { dataMap[record.date] = record; });
      setHealthData(dataMap);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const deleteData = async () => {
    if (!window.confirm('이 기록을 삭제하시겠습니까 형님?')) return;
    try {
      // ✅ api.js 사용
      await api.delete(`/health/${USERNAME}/${modal.date}`);
      alert('삭제 완료!');
      setModal({ isOpen: false, date: null });
      fetchData();
    } catch (err) {
      alert('삭제 실패!');
    }
  };

  const changeMonth = (val) =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + val, 1));

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const bodyAnalysis = useMemo(() => {
    const dates = Object.keys(healthData).sort();
    if (dates.length === 0) return { weight: 0, status: '데이터 없음', diff: 0, color: '#aaa', bmi: 0 };
    const latest = healthData[dates[dates.length - 1]];
    const hM = latest.height / 100;
    const bmi = (latest.weight / (hM * hM)).toFixed(1);
    const targetW = (22 * (hM * hM)).toFixed(1);
    const diff = (targetW - latest.weight).toFixed(1);
    let status = '정상'; let color = '#2ecc71';
    if (bmi >= 25) { status = '비만'; color = '#e74c3c'; }
    else if (bmi >= 23) { status = '과체중'; color = '#f1c40f'; }
    else if (bmi < 18.5) { status = '저체중'; color = '#3498db'; }
    return { weight: latest.weight, status, diff, color, bmi };
  }, [healthData]);

  const chartData = useMemo(() => {
    const labels = [];
    const weightList = [], bmiList = [], bpHList = [], sugarList = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      labels.push(`${i}일`);
      const d = healthData[dateStr];
      if (d) {
        weightList.push(d.weight);
        bmiList.push((d.weight / ((d.height / 100) ** 2)).toFixed(1));
        bpHList.push(d.systolicBp);
        sugarList.push(d.bloodSugar);
      } else {
        weightList.push(null); bmiList.push(null); bpHList.push(null); sugarList.push(null);
      }
    }
    return {
      labels,
      datasets: [
        { label: '몸무게(kg)', data: weightList, borderColor: '#2ecc71', backgroundColor: '#2ecc71', yAxisID: 'y_main', tension: 0.3, borderWidth: 3 },
        { label: 'BMI', data: bmiList, borderColor: '#f1c40f', backgroundColor: '#f1c40f', yAxisID: 'y_bmi', tension: 0.3 },
        { label: '혈압(수축)', data: bpHList, borderColor: '#e74c3c', backgroundColor: '#e74c3c', yAxisID: 'y_main', tension: 0.3 },
        { label: '혈당', data: sugarList, borderColor: '#3498db', backgroundColor: '#3498db', yAxisID: 'y_main', tension: 0.3 }
      ]
    };
  }, [healthData, year, month, daysInMonth]);

  const openModal = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const prev = healthData[dateStr] || {};
    setInputForm({
      height: prev.height || 175, weight: prev.weight || '',
      systolicBp: prev.systolicBp || '', diastolicBp: prev.diastolicBp || '', bloodSugar: prev.bloodSugar || ''
    });
    setModal({ isOpen: true, date: dateStr });
  };

  const saveData = async () => {
    const { height, weight, systolicBp, diastolicBp, bloodSugar } = inputForm;
    if (!weight || !height) { alert('키와 몸무게는 필수입니다!'); return; }
    try {
      // ✅ api.js 사용
      await api.post('/health/save', {
        username: USERNAME, date: modal.date, weight, height, systolicBp, diastolicBp, bloodSugar
      });
      setModal({ isOpen: false, date: null });
      fetchData();
    } catch (err) {
      alert('저장 실패!');
    }
  };

  const styles = {
    glass: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px', marginBottom: '25px' },
    day: (isToday, isHover) => ({
      background: isHover ? 'rgba(255,255,255,0.1)' : (isToday ? 'rgba(230,126,34,0.1)' : 'rgba(0,0,0,0.3)'),
      borderRadius: '10px', minHeight: '110px', padding: '10px', cursor: 'pointer', transition: '0.3s',
      border: isHover || isToday ? '1px solid #e67e22' : '1px solid transparent', position: 'relative'
    }),
    input: { width: '100%', padding: '12px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '5px', boxSizing: 'border-box' },
    navBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' },
    guideBtn: { background: 'rgba(52,152,219,0.2)', border: '1px solid rgba(52,152,219,0.5)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' },
  };

  return (
    <PageLayout maxWidth="1200px">

      {/* ══ 사용 가이드 팝업 ══ */}
      {showGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
          onClick={() => setShowGuide(false)}>
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '20px', maxWidth: '520px', width: '90%', border: '1px solid rgba(52,152,219,0.4)', color: '#eee', lineHeight: '1.8', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3498db', marginTop: 0, textAlign: 'center' }}>🏃 내 몸 관리 사용 가이드</h2>
            <ul style={{ paddingLeft: '20px', fontSize: '0.93rem' }}>
              <li><strong>달력 클릭:</strong> 날짜를 클릭하면 해당 날의 신체 기록 창이 열립니다. 키·몸무게·혈압·혈당을 입력할 수 있습니다.</li>
              <li><strong>BMI 자동 분석:</strong> 몸무게와 키를 저장하면 <b>BMI가 자동 계산</b>되어 저체중·정상·과체중·비만 상태를 색상으로 표시합니다.</li>
              <li><strong>목표 체중:</strong> <b>BMI 22</b>를 이상 체중 기준으로 계산하여 목표까지 남은 <b>감량/증량 kg</b>을 상단에 표시합니다.</li>
              <li><strong>📈 월간 추이 그래프:</strong> 하단에서 이번 달 몸무게·BMI·혈압·혈당의 <b>추이를 그래프</b>로 확인할 수 있습니다.</li>
            </ul>
            <div style={{ marginTop: '18px', padding: '10px 14px', background: 'rgba(52,152,219,0.1)', borderRadius: '10px', fontSize: '0.85rem', color: '#ffcc00', textAlign: 'center' }}>
              나는 9초를 달리기 위해 4년을 훈련했다. 그런데 사람들은 두 달 해보고 결과가 나오지 않는다고 포기한다. - 우사인 볼트 -
            </div>
            <button style={{ width: '100%', marginTop: '15px', height: '45px', background: '#3498db', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              onClick={() => setShowGuide(false)}>확인했습니다!</button>
          </div>
        </div>
      )}

      {/* ══ 헤더: [← 메인] [타이틀 + 달 네비] [가이드 버튼] ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div>
          <Link to="/main" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' }}>← 메인으로</Link>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <button style={styles.navBtn} onClick={() => changeMonth(-1)}>◀</button>
            <span style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '1rem', minWidth: '110px', textAlign: 'center' }}>{year}년 {month}월</span>
            <button style={styles.navBtn} onClick={() => changeMonth(1)}>▶</button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={styles.guideBtn} onClick={() => setShowGuide(true)}>건강 가이드 ⓘ</button>
        </div>
      </div>

      <div style={styles.glass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>💪 건강 요약</h2>
            <p style={{ margin: '5px 0 0', color: '#ccc' }}>현재 상태: <strong style={{ color: bodyAnalysis.color }}>{bodyAnalysis.status}</strong> (BMI: {bodyAnalysis.bmi})</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>{bodyAnalysis.weight}kg</div>
            <div style={{ fontSize: '0.9rem', color: Number(bodyAnalysis.diff) > 0 ? '#e74c3c' : '#3498db', fontWeight: 'bold' }}>
              목표까지 {Number(bodyAnalysis.diff) > 0 ? `${bodyAnalysis.diff}kg 감량` : `${Math.abs(bodyAnalysis.diff)}kg 증량`}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.glass}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} style={{ fontWeight: 'bold', color: '#e67e22', paddingBottom: '10px' }}>{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = healthData[dateStr];
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
            return (
              <div key={day} onClick={() => openModal(day)}
                onMouseEnter={() => setHoverId(day)} onMouseLeave={() => setHoverId(null)}
                style={styles.day(isToday, hoverId === day)}>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{day}</span>
                {data ? (
                  <div style={{ fontSize: '0.7rem', textAlign: 'left', marginTop: '5px', lineHeight: '1.3' }}>
                    <strong style={{ color: '#f1c40f' }}>{data.weight}kg</strong><br />
                    <span>BP: {data.systolicBp}/{data.diastolicBp}</span>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', opacity: hoverId === day ? 1 : 0.1 }}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.glass}>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>📈 월간 데이터 추이</h2>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
          <Line data={chartData} options={{ responsive: true, scales: { y_bmi: { position: 'right', suggestedMin: 18, suggestedMax: 30, ticks: { color: '#f1c40f' } }, y_main: { ticks: { color: '#ccc' } } } }} />
        </div>
      </div>

      {modal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#222', width: '450px', padding: '35px', borderRadius: '20px', border: '1px solid #e67e22' }}>
            <h2 style={{ color: '#e67e22', marginTop: 0 }}>{modal.date} 기록</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div><label style={{ color: '#ccc', fontSize: '0.9rem' }}>키 (cm)</label><input type="number" style={styles.input} value={inputForm.height} onChange={e => setInputForm({ ...inputForm, height: e.target.value })} /></div>
              <div><label style={{ color: '#ccc', fontSize: '0.9rem' }}>몸무게 (kg)</label><input type="number" style={styles.input} value={inputForm.weight} onChange={e => setInputForm({ ...inputForm, weight: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ color: '#ccc', fontSize: '0.9rem' }}>혈압 (수축/이완)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="number" placeholder="120" style={styles.input} value={inputForm.systolicBp} onChange={e => setInputForm({ ...inputForm, systolicBp: e.target.value })} />
                  <input type="number" placeholder="80" style={styles.input} value={inputForm.diastolicBp} onChange={e => setInputForm({ ...inputForm, diastolicBp: e.target.value })} />
                </div>
              </div>
              <div><label style={{ color: '#ccc', fontSize: '0.9rem' }}>혈당</label><input type="number" placeholder="95" style={styles.input} value={inputForm.bloodSugar} onChange={e => setInputForm({ ...inputForm, bloodSugar: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={saveData} style={{ padding: '15px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
              {healthData[modal.date] && <button onClick={deleteData} style={{ padding: '12px', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>삭제</button>}
              <button onClick={() => setModal({ isOpen: false, date: null })} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
};

export default MyBody;