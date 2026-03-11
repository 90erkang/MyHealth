#!/bin/bash
echo ">>> 백엔드(Gradle) 배포 시작"
cd ~/backend
sudo fuser -k 8080/tcp || true
./gradlew clean build -x test
# 메모리 제한 400M 걸고 실행
nohup java -Xms256M -Xmx400M -jar build/libs/*.jar > back.log 2>&1 &
echo ">>> 백엔드 실행 중... 로그는 tail -f ~/backend/back.log 로 확인하세요."
