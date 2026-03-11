/**
 * index.js - React 앱 진입점
 * ReactDOM.createRoot으로 React 18 Concurrent Mode 사용
 * #root 엘리먼트에 App 컴포넌트 마운트
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // (없으면 생략 가능)

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
);