from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import List

from database import engine, get_db, Base
from models import User, StorageArea, Bookshelf, SensorPoint, Dehumidifier, MovePlan, MoveTask, InspectionRecord
from schemas import (
    Token, UserResponse,
    StorageAreaCreate, StorageAreaResponse,
    BookshelfCreate, BookshelfResponse,
    SensorPointCreate, SensorPointResponse,
    DehumidifierCreate, DehumidifierResponse,
    MovePlanCreate, MovePlanResponse,
    MoveTaskCreate, MoveTaskUpdate, MoveTaskResponse,
    InspectionRecordCreate, InspectionRecordResponse,
    DashboardResponse, DashboardStats, HumidityHeatmapItem,
    MoldRiskItem, MoveProgressItem, DeviceAlertItem,
    RiskInspectionItem
)
from auth import authenticate_user, create_access_token, get_current_active_user, init_default_user, ACCESS_TOKEN_EXPIRE_MINUTES

Base.metadata.create_all(bind=engine)

app = FastAPI(title="地下书库微气候巡检与书架移位协同站", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    init_default_user(db)
    db.close()


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@app.get("/storage-areas", response_model=List[StorageAreaResponse])
def get_storage_areas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(StorageArea).offset(skip).limit(limit).all()


@app.post("/storage-areas", response_model=StorageAreaResponse)
def create_storage_area(area: StorageAreaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_area = db.query(StorageArea).filter(StorageArea.code == area.code).first()
    if db_area:
        raise HTTPException(status_code=400, detail="库区编码已存在")
    db_area = StorageArea(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area


@app.put("/storage-areas/{area_id}", response_model=StorageAreaResponse)
def update_storage_area(area_id: int, area: StorageAreaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_area = db.query(StorageArea).filter(StorageArea.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="库区不存在")
    existing = db.query(StorageArea).filter(StorageArea.code == area.code, StorageArea.id != area_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="库区编码已存在")
    for key, value in area.dict().items():
        setattr(db_area, key, value)
    db.commit()
    db.refresh(db_area)
    return db_area


@app.delete("/storage-areas/{area_id}")
def delete_storage_area(area_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_area = db.query(StorageArea).filter(StorageArea.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="库区不存在")
    db.delete(db_area)
    db.commit()
    return {"message": "删除成功"}


@app.get("/bookshelves", response_model=List[BookshelfResponse])
def get_bookshelves(skip: int = 0, limit: int = 100, storage_area_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(Bookshelf)
    if storage_area_id:
        query = query.filter(Bookshelf.storage_area_id == storage_area_id)
    return query.offset(skip).limit(limit).all()


@app.post("/bookshelves", response_model=BookshelfResponse)
def create_bookshelf(bookshelf: BookshelfCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_bookshelf = db.query(Bookshelf).filter(Bookshelf.code == bookshelf.code).first()
    if db_bookshelf:
        raise HTTPException(status_code=400, detail="书架编码已存在")
    db_bookshelf = Bookshelf(**bookshelf.dict())
    db.add(db_bookshelf)
    db.commit()
    db.refresh(db_bookshelf)
    return db_bookshelf


@app.put("/bookshelves/{bookshelf_id}", response_model=BookshelfResponse)
def update_bookshelf(bookshelf_id: int, bookshelf: BookshelfCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_bookshelf = db.query(Bookshelf).filter(Bookshelf.id == bookshelf_id).first()
    if not db_bookshelf:
        raise HTTPException(status_code=404, detail="书架不存在")
    existing = db.query(Bookshelf).filter(Bookshelf.code == bookshelf.code, Bookshelf.id != bookshelf_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="书架编码已存在")
    for key, value in bookshelf.dict().items():
        setattr(db_bookshelf, key, value)
    db.commit()
    db.refresh(db_bookshelf)
    return db_bookshelf


@app.delete("/bookshelves/{bookshelf_id}")
def delete_bookshelf(bookshelf_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_bookshelf = db.query(Bookshelf).filter(Bookshelf.id == bookshelf_id).first()
    if not db_bookshelf:
        raise HTTPException(status_code=404, detail="书架不存在")
    db.delete(db_bookshelf)
    db.commit()
    return {"message": "删除成功"}


@app.get("/sensor-points", response_model=List[SensorPointResponse])
def get_sensor_points(skip: int = 0, limit: int = 100, storage_area_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(SensorPoint)
    if storage_area_id:
        query = query.filter(SensorPoint.storage_area_id == storage_area_id)
    return query.offset(skip).limit(limit).all()


@app.post("/sensor-points", response_model=SensorPointResponse)
def create_sensor_point(sensor: SensorPointCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_sensor = db.query(SensorPoint).filter(SensorPoint.code == sensor.code).first()
    if db_sensor:
        raise HTTPException(status_code=400, detail="采集点编码已存在")
    db_sensor = SensorPoint(**sensor.dict())
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor


@app.put("/sensor-points/{sensor_id}", response_model=SensorPointResponse)
def update_sensor_point(sensor_id: int, sensor: SensorPointCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_sensor = db.query(SensorPoint).filter(SensorPoint.id == sensor_id).first()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="采集点不存在")
    existing = db.query(SensorPoint).filter(SensorPoint.code == sensor.code, SensorPoint.id != sensor_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="采集点编码已存在")
    for key, value in sensor.dict().items():
        setattr(db_sensor, key, value)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor


@app.delete("/sensor-points/{sensor_id}")
def delete_sensor_point(sensor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_sensor = db.query(SensorPoint).filter(SensorPoint.id == sensor_id).first()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="采集点不存在")
    db.delete(db_sensor)
    db.commit()
    return {"message": "删除成功"}


@app.get("/dehumidifiers", response_model=List[DehumidifierResponse])
def get_dehumidifiers(skip: int = 0, limit: int = 100, storage_area_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(Dehumidifier)
    if storage_area_id:
        query = query.filter(Dehumidifier.storage_area_id == storage_area_id)
    return query.offset(skip).limit(limit).all()


@app.post("/dehumidifiers", response_model=DehumidifierResponse)
def create_dehumidifier(device: DehumidifierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_device = db.query(Dehumidifier).filter(Dehumidifier.code == device.code).first()
    if db_device:
        raise HTTPException(status_code=400, detail="设备编码已存在")
    db_device = Dehumidifier(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


@app.put("/dehumidifiers/{device_id}", response_model=DehumidifierResponse)
def update_dehumidifier(device_id: int, device: DehumidifierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_device = db.query(Dehumidifier).filter(Dehumidifier.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="设备不存在")
    existing = db.query(Dehumidifier).filter(Dehumidifier.code == device.code, Dehumidifier.id != device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="设备编码已存在")
    for key, value in device.dict().items():
        setattr(db_device, key, value)
    db.commit()
    db.refresh(db_device)
    return db_device


@app.delete("/dehumidifiers/{device_id}")
def delete_dehumidifier(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_device = db.query(Dehumidifier).filter(Dehumidifier.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="设备不存在")
    db.delete(db_device)
    db.commit()
    return {"message": "删除成功"}


@app.get("/move-plans", response_model=List[MovePlanResponse])
def get_move_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MovePlan).offset(skip).limit(limit).all()


@app.post("/move-plans", response_model=MovePlanResponse)
def create_move_plan(plan: MovePlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = MovePlan(**plan.dict(), created_by=current_user.id)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.put("/move-plans/{plan_id}", response_model=MovePlanResponse)
def update_move_plan(plan_id: int, plan: MovePlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(MovePlan).filter(MovePlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="移架计划不存在")
    for key, value in plan.dict().items():
        setattr(db_plan, key, value)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.delete("/move-plans/{plan_id}")
def delete_move_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_plan = db.query(MovePlan).filter(MovePlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="移架计划不存在")
    db.delete(db_plan)
    db.commit()
    return {"message": "删除成功"}


@app.get("/move-tasks", response_model=List[MoveTaskResponse])
def get_move_tasks(skip: int = 0, limit: int = 100, bookshelf_id: int = None, status: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(MoveTask)
    if bookshelf_id:
        query = query.filter(MoveTask.bookshelf_id == bookshelf_id)
    if status:
        query = query.filter(MoveTask.status == status)
    return query.offset(skip).limit(limit).all()


@app.post("/move-tasks", response_model=MoveTaskResponse)
def create_move_task(task: MoveTaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    conflicting_tasks = db.query(MoveTask).filter(
        MoveTask.bookshelf_id == task.bookshelf_id,
        MoveTask.status.in_(["pending", "in_progress"]),
        or_(
            and_(
                MoveTask.planned_start_time <= task.planned_end_time,
                MoveTask.planned_end_time >= task.planned_start_time
            )
        )
    ).first()
    if conflicting_tasks:
        raise HTTPException(status_code=400, detail="该书架在此时段已有移位任务")
    db_task = MoveTask(**task.dict(), status="pending")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.put("/move-tasks/{task_id}", response_model=MoveTaskResponse)
def update_move_task(task_id: int, task: MoveTaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_task = db.query(MoveTask).filter(MoveTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="任务不存在")
    update_data = task.dict(exclude_unset=True)
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "in_progress" and not db_task.actual_start_time:
            update_data["actual_start_time"] = datetime.utcnow()
        if new_status == "completed" and not db_task.actual_end_time:
            update_data["actual_end_time"] = datetime.utcnow()
            if not db_task.actual_start_time:
                update_data["actual_start_time"] = db_task.planned_start_time or datetime.utcnow()
    for key, value in update_data.items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.get("/inspection-records", response_model=List[InspectionRecordResponse])
def get_inspection_records(skip: int = 0, limit: int = 100, bookshelf_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = db.query(InspectionRecord)
    if bookshelf_id:
        query = query.filter(InspectionRecord.bookshelf_id == bookshelf_id)
    return query.order_by(InspectionRecord.inspection_time.desc()).offset(skip).limit(limit).all()


@app.post("/inspection-records", response_model=InspectionRecordResponse)
def create_inspection_record(record: InspectionRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_record = InspectionRecord(**record.dict(), inspector_id=current_user.id)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def generate_risk_description(humidity, mold_level, has_odor, has_pest):
    HUMIDITY_THRESHOLD = 60.0
    MOLD_LEVEL_THRESHOLD = 2
    
    risk_reasons = []
    description_parts = []
    
    if humidity >= HUMIDITY_THRESHOLD:
        risk_reasons.append("humidity_high")
        description_parts.append(f"湿度超标（当前{humidity}%，阈值{HUMIDITY_THRESHOLD}%）")
    
    if mold_level >= MOLD_LEVEL_THRESHOLD:
        risk_reasons.append("mold_high")
        description_parts.append(f"霉斑等级较高（{mold_level}级）")
    
    if has_odor:
        risk_reasons.append("has_odor")
        description_parts.append("存在异味")
    
    if has_pest:
        risk_reasons.append("has_pest")
        description_parts.append("发现虫害痕迹")
    
    suggest_move = len(risk_reasons) > 0
    risk_description = "；".join(description_parts) if description_parts else ""
    
    return risk_reasons, risk_description, suggest_move


@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    total_areas = db.query(StorageArea).count()
    total_bookshelves = db.query(Bookshelf).count()
    active_devices = db.query(Dehumidifier).filter(Dehumidifier.status == "running").count()
    pending_tasks = db.query(MoveTask).filter(MoveTask.status.in_(["pending", "in_progress"])).count()

    stats = DashboardStats(
        total_areas=total_areas,
        total_bookshelves=total_bookshelves,
        active_devices=active_devices,
        pending_tasks=pending_tasks
    )

    humidity_subquery = db.query(
        InspectionRecord.bookshelf_id,
        func.max(InspectionRecord.inspection_time).label("max_time")
    ).group_by(InspectionRecord.bookshelf_id).subquery()

    humidity_data = db.query(
        Bookshelf.storage_area_id,
        StorageArea.name,
        func.avg(InspectionRecord.humidity).label("avg_humidity"),
        func.max(InspectionRecord.humidity).label("max_humidity")
    ).join(Bookshelf, InspectionRecord.bookshelf_id == Bookshelf.id)\
     .join(StorageArea, Bookshelf.storage_area_id == StorageArea.id)\
     .join(humidity_subquery, 
           and_(InspectionRecord.bookshelf_id == humidity_subquery.c.bookshelf_id,
                InspectionRecord.inspection_time == humidity_subquery.c.max_time))\
     .group_by(Bookshelf.storage_area_id, StorageArea.name).all()

    humidity_heatmap = [
        HumidityHeatmapItem(
            area_id=item.storage_area_id,
            area_name=item.name,
            avg_humidity=float(item.avg_humidity),
            max_humidity=float(item.max_humidity)
        )
        for item in humidity_data
    ]

    mold_subquery = db.query(
        InspectionRecord.bookshelf_id,
        func.max(InspectionRecord.inspection_time).label("max_time")
    ).group_by(InspectionRecord.bookshelf_id).subquery()

    mold_raw_data = db.query(
        InspectionRecord.bookshelf_id,
        Bookshelf.code,
        StorageArea.name.label("area_name"),
        InspectionRecord.mold_level,
        InspectionRecord.humidity,
        InspectionRecord.has_odor,
        InspectionRecord.has_pest,
        InspectionRecord.inspection_time
    ).join(Bookshelf, InspectionRecord.bookshelf_id == Bookshelf.id)\
     .join(StorageArea, Bookshelf.storage_area_id == StorageArea.id)\
     .join(mold_subquery,
           and_(InspectionRecord.bookshelf_id == mold_subquery.c.bookshelf_id,
                InspectionRecord.inspection_time == mold_subquery.c.max_time))\
     .all()

    mold_risks = []
    for item in mold_raw_data:
        risk_reasons, risk_description, is_risk = generate_risk_description(
            item.humidity, item.mold_level, item.has_odor, item.has_pest
        )
        if is_risk:
            mold_risks.append(MoldRiskItem(
                bookshelf_id=item.bookshelf_id,
                bookshelf_code=item.code,
                area_name=item.area_name,
                mold_level=item.mold_level,
                humidity=float(item.humidity),
                inspection_time=item.inspection_time
            ))
    mold_risks.sort(key=lambda x: (-x.mold_level, -x.humidity))
    mold_risks = mold_risks[:10]

    move_data = db.query(
        MoveTask.id,
        Bookshelf.code,
        MoveTask.responsible_person,
        MoveTask.status,
        MoveTask.actual_start_time,
        MoveTask.actual_end_time,
        MoveTask.planned_start_time,
        MoveTask.planned_end_time
    ).join(Bookshelf, MoveTask.bookshelf_id == Bookshelf.id)\
     .order_by(MoveTask.planned_start_time.desc()).limit(10).all()

    def calculate_progress(status, actual_start, actual_end, planned_start, planned_end):
        if status == "completed":
            return 100
        elif status == "in_progress":
            if actual_start and planned_end and planned_start:
                now = datetime.utcnow()
                planned_duration = (planned_end - planned_start).total_seconds()
                if planned_duration > 0:
                    elapsed = (now - actual_start).total_seconds()
                    progress = int((elapsed / planned_duration) * 100)
                    return min(max(progress, 1), 99)
            return 0
        elif status == "pending":
            return 0
        return 0

    move_progress = [
        MoveProgressItem(
            task_id=item.id,
            bookshelf_code=item.code,
            responsible_person=item.responsible_person,
            status=item.status,
            progress=calculate_progress(item.status, item.actual_start_time, item.actual_end_time, item.planned_start_time, item.planned_end_time)
        )
        for item in move_data
    ]

    device_data = db.query(
        Dehumidifier.id,
        Dehumidifier.code,
        Dehumidifier.name,
        StorageArea.name.label("area_name"),
        Dehumidifier.status,
        Dehumidifier.error_message
    ).join(StorageArea, Dehumidifier.storage_area_id == StorageArea.id)\
     .filter(Dehumidifier.status != "running").all()

    device_alerts = [
        DeviceAlertItem(
            device_id=item.id,
            device_code=item.code,
            device_name=item.name,
            area_name=item.area_name,
            status=item.status,
            error_message=item.error_message
        )
        for item in device_data
    ]

    risk_subquery = db.query(
        InspectionRecord.bookshelf_id,
        func.max(InspectionRecord.inspection_time).label("max_time")
    ).group_by(InspectionRecord.bookshelf_id).subquery()

    risk_data = db.query(
        InspectionRecord.bookshelf_id,
        Bookshelf.code.label("bookshelf_code"),
        Bookshelf.name.label("bookshelf_name"),
        StorageArea.id.label("area_id"),
        StorageArea.name.label("area_name"),
        InspectionRecord.humidity,
        InspectionRecord.temperature,
        InspectionRecord.mold_level,
        InspectionRecord.has_odor,
        InspectionRecord.has_pest,
        InspectionRecord.inspection_time
    ).join(Bookshelf, InspectionRecord.bookshelf_id == Bookshelf.id)\
     .join(StorageArea, Bookshelf.storage_area_id == StorageArea.id)\
     .join(risk_subquery,
           and_(InspectionRecord.bookshelf_id == risk_subquery.c.bookshelf_id,
                InspectionRecord.inspection_time == risk_subquery.c.max_time))\
     .order_by(InspectionRecord.inspection_time.desc()).limit(20).all()

    risk_inspections = []
    for item in risk_data:
        risk_reasons, risk_description, suggest_move = generate_risk_description(
            item.humidity, item.mold_level, item.has_odor, item.has_pest
        )
        risk_inspections.append(RiskInspectionItem(
            bookshelf_id=item.bookshelf_id,
            bookshelf_code=item.bookshelf_code,
            bookshelf_name=item.bookshelf_name,
            area_id=item.area_id,
            area_name=item.area_name,
            humidity=float(item.humidity),
            temperature=float(item.temperature),
            mold_level=item.mold_level,
            has_odor=item.has_odor,
            has_pest=item.has_pest,
            inspection_time=item.inspection_time,
            suggest_move=suggest_move,
            risk_reasons=risk_reasons,
            risk_description=risk_description
        ))

    risk_inspections = [r for r in risk_inspections if r.suggest_move]
    risk_inspections.sort(key=lambda x: (-len(x.risk_reasons), -x.humidity, -x.mold_level))

    return DashboardResponse(
        stats=stats,
        humidity_heatmap=humidity_heatmap,
        mold_risks=mold_risks,
        move_progress=move_progress,
        device_alerts=device_alerts,
        risk_inspections=risk_inspections
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8037)
