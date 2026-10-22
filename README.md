# 청크월드 온라인 (Render)

## GitHub 업데이트
기존 저장소에서 `index.html`, `server.js`, `package.json`을 교체하고 Commit changes를 누르세요.

## Render
- Build Command: `npm install`
- Start Command: `npm start`
- Persistent Disk를 쓸 경우 mount path `/data`, 환경 변수 `DATA_DIR=/data`

같은 월드 시드를 사용하면 같은 방에 접속합니다. 플레이어 공격은 가까운 상대를 바라보고 좌클릭하면 작동합니다. T키 채팅은 같은 방에 전송되며 말풍선이 잠시 머리 위에 표시됩니다.

참고: 프로토타입이며 서버 측 공격 판정/치트 방지, 전체 게임 상태 동기화는 완성형 수준이 아닙니다. 월드 저장은 블록 변경 사항 중심입니다.
