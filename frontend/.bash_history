sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
cd ~/springboot_project
./gradlew clean build -x test
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cd ~/react_project
nano .env
grep -rn "8080" src/
nano src/api.js
npm run build
cd ~/react_project
npm install
npm run build
pkill serve
nohup serve -s build -l 3000 > frontend.log 2>&1 &
sudo lsof -i :8080
npm install serve
nohup npx serve -s build -l 3000 > frontend.log 2>&1 &
sudo lsof -i :3000
cd ~/springboot_project
grep -rn "allowedOrigins" src/
nano src/main/java/com/example/config/CorsConfig.java
nano src/main/java/com/myhealth/config/CorsConfig.java
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
nano ~/react_project/src/api.js
nano ~/springboot_project/src/main/java/com/myhealth/config/CorsConfig.java
grep -rn "3.36.94.22" ~/springboot_project/src/
nano ~/springboot_project/src/main/java/com/myhealth/config/CorsConfig.java
nano ~/react_project/src/api.js
grep -rn "3.36.94.22" ~/springboot_project/src/
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cd ~/react_project
npm run build
pkill serve
nohup npx serve -s build -l 3000 --header "Cross-Origin-Opener-Policy: same-origin-allow-popups" > frontend.log 2>&1 &
sudo lsof -i :8080
cd ~/springboot_project
sudo lsof -i :8080
pkill -f 'java -jar'
./gradlew clean build -x test
nano src/main/java/com/myhealth/config/CorsConfig.java
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
> ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cat ~/springboot_project/src/main/resources/application.yaml
nano ~/springboot_project/src/main/resources/application.yml
nano ~/springboot_project/src/main/resources/application.yaml
./gradlew clean build -x test
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cd ~/react_project
pkill serve
nohup npx serve -s build -l 3000 --header "Cross-Origin-Opener-Policy: same-origin-allow-popups" --header "Cross-Origin-Embedder-Policy: unsafe-none" > frontend.log 2>&1 &
nano ~/springboot_project/src/main/java/com/myhealth/controller/GoogleHealthController.java
cd ~/springboot_project
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
nano ~/react_project/src/pages/Main.jsx
cd ~/react_project
npm run build
pkill serve
nohup npx serve -s build -l 3000 --header "Cross-Origin-Opener-Policy: same-origin-allow-popups" --header "Cross-Origin-Embedder-Policy: unsafe-none" > frontend.log 2>&1 &
nano ~/react_project/src/api.js
nano ~/react_project/public/callback.html
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
nano ~/springboot_project/src/main/java/com/myhealth/controller/DietController.java
cd ~/springboot_project
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
nano ~/springboot_project/src/main/java/com/myhealth/controller/DietController.java
./gradlew clean build -x test
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cat ~/react_project/src/api.js
cd ~/react_project
cat ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
cat ~/springboot_project/src/main/java/com/myhealth/config/CorsConfig.java
tail -n 50 ~/springboot_project/backend.log
grep -C 10 "Forbidden" ~/springboot_project/backend.log
cd ~/react_project
npm run build
rm -rf build
npm run build
pkill serve
nohup npx serve -s build -l 3000   --header "Cross-Origin-Opener-Policy: same-origin-allow-popups"   --header "Cross-Origin-Embedder-Policy: unsafe-none"   > frontend.log 2>&1 &
nano ~/react_project/src/pages/Diet.jsx
cat ~/react_project/src/pages/Diet.jsx
rm -rf build
npm run build
pkill serve
nohup npx serve -s build -l 3000   --header "Cross-Origin-Opener-Policy: same-origin-allow-popups"   --header "Cross-Origin-Embedder-Policy: unsafe-none"   > frontend.log 2>&1 &
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
cd ~/springboot_project
./gradlew clean build -x test
cat ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
[200~nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java~
nano ~/springboot_project/src/main/java/com/myhealth/config/SecurityConfig.java
cd ~/springboot_project && ./gradlew clean build -x test && pkill -f 'java -jar' && nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
[200~pkill -f 'java -jar'~
pkill -f 'java -jar'
nohup java -jar build/libs/*SNAPSHOT.jar > backend.log 2>&1 &
cd ~/react_project && rm -rf build && npm run build
[200~ps -ef | grep java~
ps -ef | grep java
sudo fuser -k 8080/tcp
sleep 2
cd ~/springboot_project
nohup java -jar build/libs/*.jar > backend.log 2>&1 &
tail -f backend.log
rm -rf build/libs/*-plain.jar
nohup java -jar build/libs/*.jar > backend.log 2>&1 &
sleep 5
tail -n 20 backend.log
tail -f backend.log
[200~ssh -i "fitness-key-new.pem" ec2-user@3.36.94.22 "rm -rf ~/frontend/*"~
ssh -i "fitness-key-new.pem" ec2-user@3.36.94.22 "rm -rf ~/frontend/*"
ssh -i "fitness-key-new.pem" ubuntu@3.36.94.22 "rm -rf ~/frontend/*"

rm -rf ~/frontend/*
sudo apt update && sudo apt install unzip -y
rm -rf ~/frontend ~/backend
mkdir ~/frontend ~/backend
unzip project.zip -d ~/
unzip frontend.zip -d ~/
unzip backend.zip -d ~/
ls -F
cd ~/backend
chmod +x mvnw
find ~/ -name "mvnw"
sudo apt update
sudo apt install maven -y
sudo apt install -y openjdk-17-jdk
java -version
sudo apt install -y maven
mvn -version
cd ~/backend
mvn clean package -DskipTests
ls -F
ls -f
..
cd ,,
cd ..
ls -f
rm -rf ~/*
ls -al
rm -rf .git .gradle .idea .m2 .npm .cache .local react_project springboot_project
ls -al
scp -i "fitness-key-new.pem" backend.zip ubuntu@3.36.94.22:~/
exit
sudo killall -9 java
sudo killall -9 node
free -h
rm -rf ~/.vscode-server
exit
cd ~/frontend
./gradlew clean bootRun -x test
cd ..
./gradlew clean bootRun -x test
~/backend
cd ~/backend
./gradlew clean bootRun -x test
sed -i '1s/ppackage/package/' /home/ubuntu/backend/src/main/java/com/myhealth/config/CorsConfig.java
head -n 1 /home/ubuntu/backend/src/main/java/com/myhealth/config/CorsConfig.java
./gradlew clean bootRun -x test
cd ..
sudo mysql -u root -p
cd ~/frontend
npm install
npm start
cd..
sudo fuser -k 3000/tcp
sudo lsof -i :3000
npm start
cd..
cd ..
exit
sudo apt update && sudo apt install -y unzip
mkdir -p ~/backend ~/frontend
ls -al
unzip ~/backend.zip -d ~/backend/
unzip ~/frontend.zip -d ~/frontend/
ls -F
cd ~/backend
chmod +x gradlew
./gradlew bootRun -x test &
sudo lsof -i :8080
sudo fuser -k 8080/tcp
./gradlew bootRun --info
sudo fuser -k 8080/tcp
./gradlew bootRun 2>&1 | grep "Caused by"
sudo apt update
sudo apt install mysql-server -y
sudo systemctl status mysql
sudo mysql
cd ..
cd ~/backend/src/main/resources
nano application.yaml
cd ~/backend
./gradlew clean bootRun -x test
# 8080 포트 쓰고 있는 놈들 다 강제 종료
sudo fuser -k 8080/tcp
./gradlew bootRun --info
sudo fuser -k 8080/tcp
cd ..
sudo fuser -k 8080/tcp
./gradlew bootRun --info
cd backend
./gradlew bootRun --info
sudo mysql
cd ~/backend/src/main/resources
nano application.yaml
cd..
cd ~/backend
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '1234';
sudo mysql
mysql -u root -p
sudo systemctl stop mysql
sudo systemctl daemon-reload
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
sudo mysqld_safe --skip-grant-tables &
mysql -u root
sudo killall -9 mysqld
sudo systemctl start mysql
sudo killall -9 mysqld_safe
sudo killall -9 mysqld
sudo systemctl start mysql
sudo systemctl status mysql
./gradlew clean bootRun -x test
sudo fuser -k 8080/tcp
./gradlew bootRun --info
./gradlew bootRun
./gradlew clean bootRun -x test
ssh -i "fitness-key-new.pem" ubuntu@3.36.94.22
./gradlew bootRun
./gradlew clean bootRun -x test
sudo mysql -u root -p
cd ~/frontend
npm start
npm run
npm start
./gradlew clean bootRun -x test
sudo pkill -9 java
sudo pkill -9 node
free -h
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
cd ~/backend
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/*.jar &
tail -f nohup.out
ls -l build/libs/
sudo fuser -k 8080/tcp
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/frontend
npm start
cd ~/frontend
npm start
nano src/api.js
nohup npm start &
mysql -u root -p
find / -name "SecurityConfig.java" 2>/dev/null
grep java
sudo fuser -k 8080/tcp
./gradlew build -x test
cd ~/backend
./gradlew build -x test
nohup java -Xmx512M -jar build/libs/*.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
java -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar
sudo fuser -k 8080/tcp
java -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar
sudo fuser -k 8080/tcp
./gradlew clean build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/MyHealth-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/frontend
npm start
sudo fuser -k 3000/tcp
nohup npm start &
sudo fuser -k 8080/tcp
npm start
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
cat /proc/sys/fs/inotify/max_user_watches
cd ~/backend
sudo fuser -k 8080/tcp
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
tail -n 50 nohup.out
sudo fuser -k 8080/tcp
./gradlew build -x test
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
cd ~/frontend
npm start
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
cd ~/frontend
npm start
nohup npm start &
pkill -f "npm start"
pkill -f "node"
cd ~/backend
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/frontend
npm install
npm run build
sudo npm install -g serve
nohup serve -s build -l 3000 > /dev/null 2>&1 &
ps aux | grep java
sudo nano /etc/systemd/system/react-app.service
sudo systemctl enable react-app
sudo systemctl start react-app
npm start
npmstart
npm start
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/default
sudo tee /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
    }
    location /api {
        proxy_pass http://localhost:8080;
    }
}
EOF

sudo systemctl restart nginx
pkill -f "serve"
cd ~/backend
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/frontend
nohup serve -s build -l 3000 > /dev/null 2>&1 &
npm run build
nohup serve -s build -l 3000 > /dev/null 2>&1 &
cd ~/backend
sudo fuser -k 8080/tcp
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/backend
sudo fuser -k 8080/tcp
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
cd ~/frontend
npm start
cd ~/frontend
npm start
sudo fuser -k 8080/tcp
./gradlew build -x test
cd ~/backend
./gradlew build -x test
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
nohup java -jar build/libs/example-0.0.1-SNAPSHOT.jar > nohup.out 2>&1 &
cd ~/frontend
nohup npm start > frontend.log 2>&1 &
# 8080(백엔드)과 3000(프론트)이 떠 있는지 확인
netstat -tulpn | grep -E '8080|3000'
cd ..
netstat -tulpn | grep -E '8080|3000'
ss -tulpn | grep -E '8080|3000'
sudo fuser -k 3000/tcp
sudo fuser -k 8080/tcp
grep "REDIRECT_URI" ~/frontend/src/Main.jsx
grep -r "REDIRECT_URI" ~/frontend/src
nano /home/ubuntu/frontend/src/pages/GoogleHealthPage.jsx
sudo fuser -k 3000/tcp
cd ~/frontend
nohup npm start > frontend.log 2>&1 &
sudo nano /etc/nginx/sites-available/default
sudo /etc/nginx/sites-available/default
ss -tulpn | grep -E '8080|3000'
sudo nginx -t
sudo systemctl restart nginx
ss -tulpn | grep -E '8080|3000'
cd ~/backend
nohup java -jar build/libs/*.jar > nohup.out 2>&1 &
disown
cd ~/frontend
nohup npm start > frontend.log 2>&1 &
disown
sudo apt-get install iptables-persistent
sudo netfilter-persistent save
ss -tulpn | grep 8080
cd ~/backend
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
sudo fuser -k 8080/tcp
cd ~/backend
sudo fuser -k 8080/tcp
nohup java -Xms256M -Xmx400M -jar build/libs/example-0.0.1-SNAPSHOT.jar &
tail -f nohup.out
npm start
cd ~
nano start_back.sh
cd ~
nano start_front.sh
chmod +x start_back.sh start_front.sh
ps -ef | grep java
ps -ef | grep node
sudo netstat -ntlp | grep -E '8080|3000'
sudo ss -antlp | grep -E '8080|3000'
tail -n 50 ~/frontend/front.log
cd ~/frontend
npm install
npm start
cd ~
./start_front.sh
