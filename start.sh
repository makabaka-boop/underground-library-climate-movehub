#!/bin/bash

echo "======================================"
echo "地下书库管理系统启动脚本"
echo "======================================"
echo ""

# 启动后端
echo "正在启动后端服务..."
cd backend
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "正在启动前端服务..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install -q
fi
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "服务已启动！"
echo "后端地址: http://localhost:8037"
echo "前端地址: http://localhost:3000"
echo "API文档: http://localhost:8037/docs"
echo "默认账号: admin / admin123"
echo "======================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
