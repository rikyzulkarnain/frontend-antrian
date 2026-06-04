@echo off
REM ============================================================
REM  Sistem Antrian - Peluncur Layar Display TV
REM  Membuka halaman /display dalam mode kiosk layar penuh dengan
REM  autoplay aktif, sehingga suara video + pengumuman antrian
REM  langsung jalan TANPA perlu klik/sentuh (cocok untuk PC tanpa mouse).
REM
REM  Cara pakai sekali jalan : klik dobel file ini.
REM  Agar otomatis saat PC nyala:
REM    1. Tekan Win + R, ketik:  shell:startup  lalu Enter
REM    2. Salin (atau buat shortcut) file ini ke folder yang terbuka.
REM
REM  Untuk keluar dari kiosk: tekan  Ctrl + W  atau  Alt + F4.
REM ============================================================

setlocal

REM --- GANTI alamat ini bila frontend tidak di PC ini / beda port ---
set "URL=https://frontend-antrian.vercel.app/display"

REM --- Profil browser khusus agar kiosk bersih (tanpa prompt restore tab) ---
set "PROFILE=%LOCALAPPDATA%\AntrianDisplayProfile"

REM --- Cari lokasi Microsoft Edge (disarankan: ada suara wanita id-ID) ---
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

REM --- Cari lokasi Google Chrome (cadangan) ---
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%" (
  start "" "%EDGE%" --kiosk "%URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --user-data-dir="%PROFILE%"
) else if exist "%CHROME%" (
  start "" "%CHROME%" --kiosk "%URL%" --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --user-data-dir="%PROFILE%"
) else (
  echo Microsoft Edge atau Google Chrome tidak ditemukan.
  echo Silakan edit path EDGE atau CHROME di dalam file ini.
  pause
)

endlocal
