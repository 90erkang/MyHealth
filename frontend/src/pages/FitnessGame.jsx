import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import api from '../api';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │           FitnessGame.jsx - 득근 RPG 웨이브 레이드 페이지     │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /fitness-game                                          │
 * │                                                              │
 * │ API:                                                          │
 * │   GET  /api/game/{username}                     - 캐릭터 조회│
 * │   GET  /api/health/{username}                   - 신체 정보  │
 * │   GET  /api/game/daily-summary/{username}?date= - 오늘 요약  │
 * │   POST /api/game/save  - XP/레벨/스테이지 저장              │
 * │                                                              │
 * │ 게임 규칙:                                                    │
 * │   - 매일 06:00 초기화                                        │
 * │   - 에너지 = 360분 - 오늘 운동 시간(분)                      │
 * │   - Stage 1 몬스터 HP = 총 섭취량 - 기초 대사량(BMR)         │
 * │   - 이후 NEXT WAVE 몬스터는 고정 500 HP                      │
 * │   - 피로 상태(에너지 60분 미만): 공격력 50%                  │
 * │   - 에너지 소진: 공격 불가                                    │
 * │   - 스테이지 클리어 → NEXT 버튼 클릭 시 100 XP 획득          │
 * │   - XP 누적에 따라 칭호/캐릭터 이미지 변경                   │
 * │                                                              │
 * │ 몬스터 라인업: 7종을 랜덤 섞어 2주치 순서 생성               │
 * │   localStorage에 오늘 날짜 기준으로 캐시 (하루 단위 유지)    │
 * └──────────────────────────────────────────────────────────────┘
 */
const FitnessGame = () => {
  const username  = localStorage.getItem('username') || 'boss';
  const WAVE_SIZE      = 1000; // 사용 안 함 (하위 호환용)
  const NEXT_WAVE_HP   = 500;  // 2스테이지 이후 몬스터 고정 HP

  // ── 몬스터 데이터 (이름 + 이미지) ──────────────────────────
  const monsterData = [
    { name: '치즈 패닉 피자',   img: '/images/game/game2_1.png' },
    { name: '따봉 프라이드',    img: '/images/game/game2_2.png' },
    { name: '벌크업 치즈버거',  img: '/images/game/game2_3.png' },
    { name: '분노의 근육라면',  img: '/images/game/game2_4.png' },
    { name: '유혹의 초코조각',  img: '/images/game/game2_5.png' },
    { name: '트리플 아이스 군단',img: '/images/game/game2_6.png' },
    { name: '식곤증 짜장괴물',  img: '/images/game/game2_7.png' },
  ];

  /**
   * 레벨 → 칭호 + 캐릭터 이미지 매핑
   * 구간: 1-10(헬린이), 11-20(근육꿈나무), 21-30(헬스장망령),
   *       31-40(강철골격), 41-50(인간병기), 51+(고인물관장)
   */
  const getTitleInfo = (level) => {
    if (level >= 51) return { title: '고인물 관장',  img: '/images/game/game1_6.png' };
    if (level >= 41) return { title: '인간 병기',    img: '/images/game/game1_5.png' };
    if (level >= 31) return { title: '강철 골격',    img: '/images/game/game1_4.png' };
    if (level >= 21) return { title: '헬스장 망령',  img: '/images/game/game1_3.png' };
    if (level >= 11) return { title: '근육 꿈나무',  img: '/images/game/game1_2.png' };
    return            { title: '헬린이',            img: '/images/game/game1_1.png' };
  };

  // ── 게임 상태 ───────────────────────────────────────────────
  const [gameState, setGameState] = useState({
    loading:        true,
    character:      { level: 1, xp: 0 },
    daily:          { eaten: 0, burned: 0, bmi: 22, bmr: 0, isExpGainedToday: false },
    monsterQueue:   [],    // 스테이지별 몬스터 HP 배열
    monsterSpecies: [],    // 스테이지별 몬스터 종류 인덱스 배열
    currentHp:      100,  // 남은 에너지 (분 단위, 최대 360)
    burnedMinutes:  0,     // 오늘 운동한 총 분
  });
  const [currentTargetIdx, setCurrentTargetIdx] = useState(0);  // 현재 스테이지 인덱스
  const [battleLog,        setBattleLog]         = useState('데이터 정산 중...');
  const [isBattleOver,     setIsBattleOver]       = useState(false);
  const [showRules,        setShowRules]          = useState(false);

  // ── 데이터 로딩 (캐릭터 + 신체 + 오늘 요약) ─────────────────
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // 오늘 06:00 기준 날짜 계산 (자정이 아닌 06:00가 일일 리셋 기준)
        const now = new Date();
        const startOfCycle = new Date();
        startOfCycle.setHours(6, 0, 0, 0);
        if (now < startOfCycle) startOfCycle.setDate(startOfCycle.getDate() - 1);
        const year  = startOfCycle.getFullYear();
        const month = String(startOfCycle.getMonth() + 1).padStart(2, '0');
        const day   = String(startOfCycle.getDate()).padStart(2, '0');
        const dateId = `${year}-${month}-${day}`;

        // 병렬 API 요청 (캐릭터, 신체 정보, 오늘 식단+운동 요약)
        const [charRes, healthRes, summaryRes] = await Promise.all([
          api.get(`/game/${username}`),
          api.get(`/health/${username}`),
          api.get(`/game/daily-summary/${username}`, { params: { date: dateId } })
        ]);

        const char = charRes.data;
        // 신체 정보: 마지막 기록 기준, 없으면 기본값
        const latestBody     = healthRes.data[healthRes.data.length - 1] || { height: 175, weight: 70 };
        const bmi            = parseFloat((latestBody.weight / ((latestBody.height / 100) ** 2)).toFixed(1));
        // 해리스-베네딕트 공식 (남성 기준, 나이 35 고정)
        const calculatedBmr  = Math.floor((10 * latestBody.weight) + (6.25 * latestBody.height) - (5 * 35) + 5);
        const { eaten = 0, burned = 0, burnedMinutes = 0 } = summaryRes.data || {};

        // 에너지 = 최대 360분 - 오늘 운동 시간
        const staminaMinutes = Math.max(0, 360 - burnedMinutes);

        // ── 몬스터 라인업 캐시 (하루 단위, localStorage에 저장) ──
        const storageKey = `monster_lineup_${username}`;
        const savedData  = JSON.parse(localStorage.getItem(storageKey));
        let species = [];
        let savedStage = char.stage || 0;

        if (savedData && savedData.dateId === dateId) {
          // 오늘 이미 만들어둔 순서 재사용
          species = savedData.species;
        } else {
          // 새 날짜: 7종 × 2 = 14개를 랜덤 섞어서 새 라인업 생성
          const shuffle = () => Array.from({ length: 7 }, (_, i) => i).sort(() => Math.random() - 0.5);
          species = shuffle().concat(shuffle());
          localStorage.setItem(storageKey, JSON.stringify({ dateId, species }));
        }

        // ── 몬스터 HP 큐 구성 ──────────────────────────────────
        // Stage 1: 초과 섭취 칼로리 (섭취 - BMR)
        // Stage 2+: 고정 NEXT_WAVE_HP(500)
        let queue = [];
        let excessCalories = Math.max(0, eaten - calculatedBmr);
        queue.push(excessCalories);
        for (let i = 0; i < savedStage; i++) {
          queue.push(NEXT_WAVE_HP);
        }

        setCurrentTargetIdx(savedStage);
        setGameState({
          loading: false,
          character: char,
          daily: { eaten, burned, bmi, bmr: calculatedBmr },
          monsterQueue: queue,
          monsterSpecies: species,
          currentHp: staminaMinutes,
          burnedMinutes
        });

        // 섭취량이 BMR 이상이면 배틀 시작
        if (eaten >= calculatedBmr) {
          setBattleLog('🔥 레이드 시작! 운동 에너지를 폭발시킵니다!');
          setTimeout(() => setIsBattleOver(true), 1000);
        } else {
          setBattleLog(`⏳ 에너지 충전 중... ${calculatedBmr}kcal를 섭취하면 웨이브가 시작됩니다.`);
        }
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      }
    };
    loadAllData();
  }, [username]);

  /**
   * NEXT WAVE 버튼 클릭 처리
   * 1. 100 XP 적립 + 레벨업 체크 (levelTable 기준)
   * 2. 서버에 캐릭터 + 스테이지 저장
   * 3. 다음 웨이브(500 HP) 큐에 추가 + 스테이지 인덱스 증가
   */
  const handleNextWave = async () => {
    const rewardXp = 100;
    // 레벨별 누적 XP 임계값 테이블
    const levelTable = [0,200,400,600,800,1000,1200,1400,1600,1800,2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,19000,21000,23000,25000,27000,29000,31000,33000,35000,37000,41000,45000,49000,53000,57000,61000,65000,69000,73000,77000,85000];
    let newXp    = gameState.character.xp + rewardXp;
    let newLevel = gameState.character.level;
    let levelUp  = false;

    if (newXp >= (levelTable[newLevel] || 9999999)) {
      newLevel++;
      levelUp = true;
    }

    const updatedChar = { ...gameState.character, level: newLevel, xp: newXp };

    try {
      const nextStage = currentTargetIdx + 1;
      await api.post('/game/save', { ...updatedChar, username, stage: nextStage });
      if (levelUp) alert(`🎉 LEVEL UP! [${getTitleInfo(newLevel).title}] 등급 달성!`);

      setGameState(prev => ({
        ...prev,
        character:    updatedChar,
        monsterQueue: [...prev.monsterQueue, NEXT_WAVE_HP], // 다음 웨이브 추가
      }));
      setCurrentTargetIdx(nextStage);
    } catch (err) {
      console.error('XP 적립 실패', err);
    }
  };

  const styles = {
    glass:       { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '30px', marginBottom: '25px' },
    hpBarWrap:   { width: '160px', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden', margin: '8px auto 0' },
    hpFill:      (val, color) => ({ width: `${Math.min(100, val)}%`, height: '100%', background: color, transition: 'width 0.5s ease-out' }),
    statBadge:   (color = '#e67e22') => ({ display: 'inline-block', background: color, padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }),
    xpBarWrap:   { width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' },
    characterImg:{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '8px' },
    ruleBtn:     { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' },
    nextBtn:     { background: '#e67e22', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginTop: '10px', boxShadow: '0 4px 15px rgba(230,126,34,0.3)' },
    modalOverlay:{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent:{ background: '#1a1a1a', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '90%', border: '1px solid #333', color: '#eee', lineHeight: '1.8' },
  };

  if (gameState.loading) return <PageLayout><div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>데이터 동기화 중...</div></PageLayout>;

  // ── 파생 계산값 ────────────────────────────────────────────
  const currentTitle = getTitleInfo(gameState.character.level);
  const nextLevelXp  = [0, 100, 300, 700, 1500, 3000][gameState.character.level] || 9999;
  const xpPercent    = Math.min(100, (gameState.character.xp / nextLevelXp) * 100);
  const stamina      = gameState.currentHp;
  const isBurnout    = stamina <= 0;          // 에너지 소진 → 공격 불가
  const isFatigued   = stamina > 0 && stamina < 60; // 피로 상태 → 공격력 50%
  const rawDamage    = gameState.daily.burned;
  const burnedMinutes = gameState.burnedMinutes;
  const FATIGUE_START = 300; // 이 분 이후부터 피로 계산

  /**
   * 실제 적용 데미지 계산
   * - 소진: 0
   * - 정상: rawDamage 그대로
   * - 피로: 정상 구간 데미지 + 피로 구간 데미지 × 50%
   */
  const totalDamage = (() => {
    if (isBurnout)  return 0;
    if (!isFatigued) return rawDamage;
    const normalDamage  = rawDamage * (FATIGUE_START / burnedMinutes);
    const fatigueDamage = rawDamage * ((burnedMinutes - FATIGUE_START) / burnedMinutes) * 0.5;
    return Math.floor(normalDamage + fatigueDamage);
  })();

  // 이전 스테이지들의 HP 합산 (현재 스테이지에 들어오는 데미지 계산용)
  let previousWavesHpSum = 0;
  for (let i = 0; i < currentTargetIdx; i++) {
    previousWavesHpSum += gameState.monsterQueue[i];
  }

  const currentMonsterMax      = gameState.monsterQueue[currentTargetIdx];
  const damageForThisMonster   = Math.max(0, totalDamage - previousWavesHpSum);
  const displayMonsterHp       = Math.max(0, currentMonsterMax - (isBattleOver ? damageForThisMonster : 0));
  const isCleared              = isBattleOver && damageForThisMonster >= currentMonsterMax;
  const currentMonsterData     = monsterData[gameState.monsterSpecies[currentTargetIdx]] || monsterData[0];
  const isReady                = gameState.daily.eaten >= gameState.daily.bmr; // 배틀 시작 조건

  return (
    <PageLayout maxWidth="1200px">
      {/* ── 게임 규칙 모달 ── */}
      {showRules && (
        <div style={styles.modalOverlay} onClick={() => setShowRules(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#ffcc00', marginTop: 0, textAlign: 'center' }}>🛡️ 득근 RPG : 웨이브 레이드 규칙</h2>
            <ul style={{ paddingLeft: '20px', fontSize: '0.95rem' }}>
              <li><strong>초기화 기준:</strong> 매일 <b>아침 06:00</b>에 모든 활동 데이터와 레이드 스테이지가 초기화됩니다.</li>
              <li><strong>에너지 제한:</strong> 하루 6시간의 에너지를 루틴 시간만큼 소모하며, 1시간 미만 시 공격력 50%, 소진 시 공격이 불가합니다.</li>
              <li><strong>몬스터 HP (Stage 1):</strong> 첫 번째 몬스터의 체력은 <b>[총 섭취량 - 기초 대사량]</b>으로 산정됩니다.</li>
              <li><strong>무한 스테이지:</strong> 첫 몬스터를 물리치면 <b>NEXT WAVE</b>에 도전할 수 있습니다. 이후 등장하는 보너스 몬스터는 <b>500kcal</b>의 고정 HP를 가집니다.</li>
              <li><strong>나의 공격력:</strong> 오늘 수행한 추가 운동 소모량이 가용 데미지가 되며, 몬스터 HP보다 높아야 처치 가능합니다.</li>
              <li><strong>경험치(XP) 보상:</strong> 스테이지 클리어 후 NEXT 버튼을 누를 때마다 <b>즉시 100 XP</b>가 적립됩니다.</li>
              <li><strong>캐릭터 성장:</strong> 획득한 경험치에 따라 <b>캐릭터 등급(칭호)</b>이 상승하며 외형이 변화합니다.</li>
            </ul>
            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(230,126,34,0.1)', borderRadius: '10px', fontSize: '0.85rem', color: '#ffcc00', textAlign: 'center' }}>
              "더 많이 움직일수록 더 많은 스테이지를 격파하고 빠르게 레벨업할 수 있습니다!"
            </div>
            <button style={{ ...styles.ruleBtn, width: '100%', marginTop: '15px', background: '#e67e22', height: '45px' }}
              onClick={() => setShowRules(false)}>이해했습니다. 레이드 시작!</button>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/main" style={{ color: '#ccc', textDecoration: 'none' }}>← 메인으로</Link>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>🔥 득근 RPG : 웨이브 레이드</h1>
        <button style={styles.ruleBtn} onClick={() => setShowRules(true)}>게임 규칙 ⓘ</button>
      </div>

      {/* ── 캐릭터 정보 카드 ── */}
      <div style={styles.glass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={styles.statBadge()}>LV. {gameState.character.level}</span>
            <h2 style={{ margin: '10px 0 4px', color: '#fff' }}>
              {username} <small style={{ color: '#aaa', fontSize: '0.9rem' }}>[{currentTitle.title}]</small>
            </h2>
            <div style={{ display: 'flex', gap: '15px', color: '#ccc', fontSize: '0.9rem' }}>
              <span>BMI: <strong>{gameState.daily.bmi}</strong></span>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: '180px' }}>
            <div style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '1.2rem' }}>⚔️ 가용 데미지: {totalDamage}</div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px' }}>XP: {gameState.character.xp} / {nextLevelXp}</div>
            <div style={styles.xpBarWrap}>
              <div style={{ width: `${xpPercent}%`, height: '100%', background: '#e67e22', transition: 'width 1s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 배틀 화면 ── */}
      {!isReady ? (
        // 섭취량이 BMR 미달: 에너지 충전 중 화면
        <div style={{ ...styles.glass, textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/images/game/game4.png" alt="charging" style={{ width: '180px', marginBottom: '20px' }} />
          <h3 style={{ color: '#fff' }}>에너지 충전 중...</h3>
          <p style={{ color: '#aaa' }}>{gameState.daily.eaten} / {gameState.daily.bmr} kcal</p>
        </div>
      ) : (
        // 배틀 화면: 캐릭터 VS 몬스터
        <div style={{ ...styles.glass, display: 'flex', justifyContent: 'space-around', alignItems: 'center', minHeight: '380px', background: 'rgba(0,0,0,0.4)', border: '1px dashed rgba(255,255,255,0.15)' }}>
          {/* 캐릭터 */}
          <div style={{ textAlign: 'center' }}>
            <img
              src={isBurnout ? '/images/game/game4.png' : currentTitle.img}
              alt={currentTitle.title}
              style={{ ...styles.characterImg, filter: isBurnout ? 'grayscale(80%) brightness(0.6)' : isFatigued ? 'sepia(40%) brightness(0.85)' : 'none' }}
            />
            <div style={{ fontWeight: 'bold', color: isBurnout ? '#e74c3c' : isFatigued ? '#f39c12' : '#fff' }}>{currentTitle.title}</div>
            {/* 에너지 게이지 */}
            <div style={styles.hpBarWrap}>
              <div style={styles.hpFill((stamina / 360) * 100, isBurnout ? '#e74c3c' : isFatigued ? '#f39c12' : '#3498db')} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>
              Energy {`${String(Math.floor(stamina / 60)).padStart(2,'0')}h ${String(stamina % 60).padStart(2,'0')}m / 06h 00m`}
            </div>
            {isBurnout  && <div style={{ fontSize: '0.7rem', color: '#e74c3c', marginTop: '4px', fontWeight: 'bold' }}>⚠️ 에너지 소진! 내일 06:00 회복</div>}
            {isFatigued && <div style={{ fontSize: '0.7rem', color: '#f39c12', marginTop: '4px', fontWeight: 'bold' }}>😓 피로 상태: 공격력 50%</div>}
          </div>

          {/* VS + NEXT WAVE 버튼 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>STAGE {currentTargetIdx + 1}</div>
            <div style={{ fontSize: '2rem', color: '#fff', opacity: 0.2 }}>VS</div>
            {isCleared && <button style={styles.nextBtn} onClick={handleNextWave}>NEXT WAVE ▶</button>}
          </div>

          {/* 몬스터 */}
          <div style={{ textAlign: 'center' }}>
            <img src={isCleared ? '/images/game/game3.png' : currentMonsterData.img} alt="monster" style={styles.characterImg} />
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{isCleared ? '소탕 완료' : currentMonsterData.name}</div>
            <div style={styles.hpBarWrap}>
              <div style={styles.hpFill((displayMonsterHp / currentMonsterMax) * 100, '#e74c3c')} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>HP {displayMonsterHp} / {currentMonsterMax} kcal</div>
          </div>
        </div>
      )}

      {/* ── 오늘의 데이터 요약 ── */}
      <div style={{ ...styles.glass, background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{ color: '#ffcc00', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '14px' }}>
          {isBurnout  ? '🚫 에너지가 바닥났습니다! 내일 아침 06:00에 체력이 회복될 때까지 휴식하세요.'
          : isCleared ? '🎊 현재 웨이브 돌파! 다음 스테이지에서 추가 XP를 획득하세요!'
          :              battleLog}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '35px', flexWrap: 'wrap' }}>
          <div><div style={{ color: '#888', fontSize: '0.78rem' }}>총 섭취</div><div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState.daily.eaten} kcal</div></div>
          <div><div style={{ color: '#888', fontSize: '0.78rem' }}>나의 BMR</div><div style={{ color: '#3498db', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState.daily.bmr} kcal</div></div>
          <div><div style={{ color: '#888', fontSize: '0.78rem' }}>누적 운동량</div><div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalDamage} kcal</div></div>
          <div><div style={{ color: '#888', fontSize: '0.78rem' }}>추가 운동량</div><div style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '1.2rem' }}>{Math.max(0, totalDamage - previousWavesHpSum)} kcal</div></div>
        </div>
      </div>
    </PageLayout>
  );
};

export default FitnessGame;
