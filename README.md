# Brawl Lookup (estilo Brawlify) — React + Vite + Node/Express

Projeto full-stack pronto para rodar localmente.

## 1) Requisitos
- Node.js 18+
- npm 9+

## 2) Instalação
### Windows (PowerShell)
```powershell
cd .\backend
npm i
cd ..\frontend
npm i
cd ..
```
### Linux/Mac
```bash
cd backend && npm i
cd ../frontend && npm i
cd ..
```

## 3) Configurar Token
Crie `backend/.env` baseado em `backend/.env.example` e cole seu token da API oficial do Brawl Stars.

### Windows (PowerShell)
```powershell
copy backend\.env.example backend\.env
notepad backend\.env
```
### Linux/Mac
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

## 4) Rodar tudo com UM comando
Na raiz do projeto:

### Dev (backend + frontend)
```bash
npm run dev:all
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Produção (build + serve)
```bash
npm run build
cd backend
npm start
```
Abra: http://localhost:4000

## 5) Testar tags
- Jogador: `#P90RJJY0Y` (exemplo) → `/player/P90RJJY0Y`
- Clube: `#XXXXXXX` → `/club/XXXXXXX`

## 6) Modo demo offline (sem token)
Se `BRAWL_TOKEN` estiver ausente, a UI abre normalmente com dados de demonstração, mostra um aviso “Token ausente”, e desabilita buscas reais.

## 7) Estrutura
- `frontend/` React + Vite + Router
- `backend/` Express proxy/cache + tracking (SQLite)

## 8) Endpoints principais
- `GET /api/health`
- `GET /api/player/:tag`
- `GET /api/club/:tag`
- `GET /api/battlelog/:tag`
- `GET /api/rankings/players/:country` (`global` permitido)
- `GET /api/rankings/clubs/:country`
- `GET /api/rankings/brawlers/:country?brawlerId=16000000`
- Tracking:
  - `POST /api/track/start?tag=...`
  - `POST /api/track/stop?tag=...`
  - `GET /api/track/history/:tag`

## 9) Observações sobre histórico
A API oficial fornece apenas as **25 batalhas mais recentes**. Este projeto salva snapshots e battle logs retornados em visitas anteriores para estender o histórico **sem inventar dados**.


## Solução de problemas

### Loop infinito no `npm install`
Se o terminal ficar repetindo `postinstall` em loop, isso era causado por um script `postinstall` chamando `npm install` novamente. Nesta versão o `postinstall` foi removido. Faça uma instalação limpa:

```bash
# na raiz
rm -rf node_modules package-lock.json
npm install
```

No Windows PowerShell:

```powershell
rd /s /q node_modules
del package-lock.json
npm install
```
"# repododiabao"  
