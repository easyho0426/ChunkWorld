const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = process.env.PORT || 3000;
const html = path.join(__dirname, 'index.html');
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, {'content-type':'text/plain; charset=utf-8'}); return res.end('ok'); }
  if (req.url === '/' || req.url.startsWith('/?')) {
    fs.readFile(html, (err, data) => { if (err) {res.writeHead(500); return res.end('index.html을 읽을 수 없습니다.');} res.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}); res.end(data); });
  } else { res.writeHead(404); res.end('Not found'); }
});
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });
const clients = new Map();
const rooms = new Map();
const safe = (v, n=40) => String(v ?? '').replace(/[<>\u0000-\u001f]/g, '').slice(0,n);
function send(ws, obj) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function roomPeers(room) { return [...clients.entries()].filter(([id,c]) => c.room === room); }
function broadcast(room, obj, except) { for (const [id,c] of roomPeers(room)) if (id !== except) send(c.ws,obj); }
wss.on('connection', ws => {
  const id = Math.random().toString(36).slice(2,10);
  const client = { id, ws, room: '', name: '플레이어', state: null };
  clients.set(id,client);
  send(ws,{type:'welcome',id,count:1});
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw.toString()); } catch { return; }
    if (!m || typeof m.type !== 'string') return;
    if (m.type === 'join') {
      const next = safe(m.room || m.seed || 'world') || 'world';
      if (client.room && client.room !== next) broadcast(client.room,{type:'leave',id});
      client.room = next; client.name = safe(m.name || '플레이어',16) || '플레이어';
      client.state = {type:'player',id,name:client.name,x:8.5,y:60,z:8.5,yaw:0,pitch:0};
      const peers = roomPeers(next).filter(([pid]) => pid !== id).map(([,c]) => c.state).filter(Boolean);
      send(ws,{type:'players',players:peers});
      send(ws,{type:'room',count:peers.length+1});
      broadcast(next,{type:'player',...client.state},id);
      return;
    }
    if (!client.room) return;
    if (m.type === 'player') {
      const n = v => Number.isFinite(Number(v)) ? Math.max(-100000,Math.min(100000,Number(v))) : 0;
      client.state = {type:'player',id,name:client.name,x:n(m.x),y:n(m.y),z:n(m.z),yaw:n(m.yaw),pitch:n(m.pitch)};
      broadcast(client.room,client.state,id);
    } else if (m.type === 'block') {
      const x=Number(m.x),y=Number(m.y),z=Number(m.z),block=Number(m.block);
      if (![x,y,z,block].every(Number.isInteger) || y<0 || y>63 || Math.abs(x)>100000 || Math.abs(z)>100000 || block<0 || block>255) return;
      broadcast(client.room,{type:'block',id,x,y,z,block},id);
    }
  });
  ws.on('close', () => { if (client.room) broadcast(client.room,{type:'leave',id}); clients.delete(id); });
  ws.on('error', () => {});
});
server.listen(PORT, '0.0.0.0', () => console.log(`청크월드 온라인 서버 실행 중: ${PORT}`));
