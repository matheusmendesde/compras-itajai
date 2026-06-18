@echo off
rem ============================================================
rem  Compras Itajai - publicar (gera o banco + git push)
rem  Use: duplo clique neste arquivo
rem       ou no terminal:  scripts\deploy.bat "mensagem do commit"
rem ============================================================
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

echo === Compras Itajai: gerar banco + publicar ===
echo.

node scripts\build-skus.mjs
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao gerar o banco. Deploy cancelado.
  pause
  exit /b 1
)

echo.
git add -A

set "MSG=%~1"
if "%MSG%"=="" set "MSG=Atualiza banco/skus"

git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo [info] Nada novo para publicar ^(ou commit vazio^). Tentando push mesmo assim...
)

git push
if errorlevel 1 (
  echo.
  echo [ERRO] Falha no git push. Verifique sua conexao/login do GitHub.
  pause
  exit /b 1
)

echo.
echo === Pronto! O site atualiza em ~1-2 min. Da um F5 (Ctrl+F5). ===
pause
