@echo off
echo 正在安装 Electron 二进制文件...
echo 这可能需要几分钟时间，请耐心等待...

set ELECTRON_SKIP_BINARY_DOWNLOAD=0
set ELECTRON_CACHE=.electron-cache

cd /d "%~dp0"

call npm run postinstall

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Electron 安装成功！
    echo.
    echo 现在可以运行以下命令启动应用:
    echo   npm run dev
    echo.
) else (
    echo.
    echo Electron 安装可能未完成，但可以尝试运行:
    echo   npm run dev
    echo.
    echo 如果遇到问题，请手动以管理员身份运行:
    echo   npx electron install
)

pause
