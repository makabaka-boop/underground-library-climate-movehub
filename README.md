# 地下书库微气候巡检与书架移位协同站

## 项目简介

这是一个完整的地下书库管理系统，包含微气候巡检和书架移位协同管理功能。

## 技术栈

- **前端**: React + Material-UI + Recharts
- **后端**: FastAPI + SQLite + SQLAlchemy
- **认证**: JWT

## 功能特性

### 1. 基础数据管理
- 库区管理：维护书库的库区信息
- 书架管理：管理每个书架的信息
- 温湿度采集点：管理温湿度传感器
- 除湿设备：监控和管理除湿设备

### 2. 巡检管理
- 记录温度、湿度
- 记录异味情况
- 记录霉斑等级
- 记录虫害痕迹
- 记录处理备注

### 3. 移架管理
- 移架计划：创建和管理移架计划
- 移架任务：分配移架任务，记录负责人、计划时间、实际完成时间和风险说明
- 冲突检测：同一书架同一时段不可被多个移位任务占用

### 4. 首页概览
- 库区湿度热力图
- 霉斑风险列表
- 移架任务进度
- 设备运行异常告警

## 项目结构

```
.
├── backend/                 # 后端项目
│   ├── main.py             # 主应用入口
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic模式
│   ├── database.py         # 数据库配置
│   ├── auth.py             # 认证模块
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端项目
│   ├── package.json        # Node.js依赖
│   ├── public/             # 静态资源
│   └── src/                # 源代码
│       ├── App.js          # 主应用组件
│       ├── api.js          # API调用封装
│       ├── context/        # React Context
│       ├── components/     # 通用组件
│       └── pages/          # 页面组件
└── README.md               # 项目说明
```

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境并安装依赖：
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. 启动后端服务（端口8037）：
```bash
python main.py
```

后端服务将在 `http://localhost:8037` 启动

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动前端开发服务器：
```bash
npm start
```

前端将在 `http://localhost:3000` 启动

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

## API文档

启动后端服务后，可以在以下地址查看API文档：
- Swagger UI: `http://localhost:8037/docs`
- ReDoc: `http://localhost:8037/redoc`

## 主要API接口

### 认证
- `POST /token` - 用户登录获取token

### 库区管理
- `GET /storage-areas` - 获取库区列表
- `POST /storage-areas` - 创建库区
- `PUT /storage-areas/{id}` - 更新库区
- `DELETE /storage-areas/{id}` - 删除库区

### 书架管理
- `GET /bookshelves` - 获取书架列表
- `POST /bookshelves` - 创建书架
- `PUT /bookshelves/{id}` - 更新书架
- `DELETE /bookshelves/{id}` - 删除书架

### 移架任务
- `GET /move-tasks` - 获取移架任务列表
- `POST /move-tasks` - 创建移架任务（自动检测时间冲突）
- `PUT /move-tasks/{id}` - 更新任务状态

### 巡检记录
- `GET /inspection-records` - 获取巡检记录
- `POST /inspection-records` - 创建巡检记录

### 仪表盘
- `GET /dashboard` - 获取首页统计数据
