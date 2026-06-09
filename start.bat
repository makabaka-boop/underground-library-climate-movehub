@echo off
chcp 65001 >nul
echo ======================================
echo 地下书库管理系统启动脚本
echo ======================================
echo.

echo 正在启动后端服务...
cd backend
if not exist venv (
    echo 创建虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
start /B python main.py
cd ..

timeout /t 3 /nobreak >nul

echo 正在启动前端服务...
cd frontend
if not exist node_modules (
    echo 安装前端依赖...
    npm install -q
)
start /B npm start
cd ..

echo.
echo ======================================
echo 服务已启动！
echo 后端地址: http://localhost:8037
echo 前端地址: http://localhost:3000
echo API文档: http://localhost:8037/docs
echo 默认账号: admin / admin123
echo ======================================
echo.
echo 请手动关闭窗口来停止服务
pause
