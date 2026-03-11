#!/bin/bash
echo ">>> 프론트엔드(React) 배포 시작"
cd ~/frontend
sudo fuser -k 3000/tcp || true
# npm install은 필요할 때만 수동으로 하는 게 빠르지만, 안전을 위해 추가
npm install
nohup npm start > front.log 2>&1 &
echo ">>> 프론트엔드 실행 중... 로그는 tail -f ~/frontend/front.log 로 확인하세요."
