from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class StorageAreaBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    floor: int = 0


class StorageAreaCreate(StorageAreaBase):
    pass


class StorageAreaResponse(StorageAreaBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BookshelfBase(BaseModel):
    code: str
    name: str
    storage_area_id: int
    row: int
    column: int
    status: str = "normal"
    description: Optional[str] = None


class BookshelfCreate(BookshelfBase):
    pass


class BookshelfResponse(BookshelfBase):
    id: int

    class Config:
        from_attributes = True


class SensorPointBase(BaseModel):
    code: str
    name: str
    storage_area_id: int
    location: str


class SensorPointCreate(SensorPointBase):
    pass


class SensorPointResponse(SensorPointBase):
    id: int
    last_temperature: Optional[float] = None
    last_humidity: Optional[float] = None
    last_read_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class DehumidifierBase(BaseModel):
    code: str
    name: str
    storage_area_id: int
    status: str = "running"
    target_humidity: float = 50.0


class DehumidifierCreate(DehumidifierBase):
    pass


class DehumidifierResponse(DehumidifierBase):
    id: int
    current_humidity: Optional[float] = None
    last_maintenance: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class MovePlanBase(BaseModel):
    name: str
    description: Optional[str] = None


class MovePlanCreate(MovePlanBase):
    pass


class MovePlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class MovePlanResponse(MovePlanBase):
    id: int
    created_by: int
    created_at: datetime
    status: str

    class Config:
        from_attributes = True


class MoveTaskBase(BaseModel):
    bookshelf_id: int
    responsible_person: str
    planned_start_time: datetime
    planned_end_time: datetime
    source_location: str
    target_location: str
    risk_description: Optional[str] = None
    move_plan_id: Optional[int] = None


class MoveTaskCreate(MoveTaskBase):
    pass


class MoveTaskUpdate(BaseModel):
    bookshelf_id: Optional[int] = None
    responsible_person: Optional[str] = None
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    source_location: Optional[str] = None
    target_location: Optional[str] = None
    risk_description: Optional[str] = None
    move_plan_id: Optional[int] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class MoveTaskResponse(MoveTaskBase):
    id: int
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class InspectionRecordBase(BaseModel):
    bookshelf_id: int
    temperature: float
    humidity: float
    has_odor: bool = False
    mold_level: int = 0
    has_pest: bool = False
    handling_notes: Optional[str] = None


class InspectionRecordCreate(InspectionRecordBase):
    pass


class InspectionRecordResponse(InspectionRecordBase):
    id: int
    inspector_id: int
    inspection_time: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_areas: int
    total_bookshelves: int
    active_devices: int
    pending_tasks: int


class HumidityHeatmapItem(BaseModel):
    area_id: int
    area_name: str
    avg_humidity: float
    max_humidity: float


class MoldRiskItem(BaseModel):
    bookshelf_id: int
    bookshelf_code: str
    area_name: str
    mold_level: int
    humidity: float
    has_odor: bool
    has_pest: bool
    risk_description: str
    inspection_time: datetime


class RiskInspectionItem(BaseModel):
    bookshelf_id: int
    bookshelf_code: str
    bookshelf_name: str
    area_id: int
    area_name: str
    humidity: float
    temperature: float
    mold_level: int
    has_odor: bool
    has_pest: bool
    inspection_time: datetime
    suggest_move: bool
    risk_reasons: List[str]
    risk_description: str


class MoveProgressItem(BaseModel):
    task_id: int
    bookshelf_code: str
    responsible_person: str
    status: str
    progress: int


class DeviceAlertItem(BaseModel):
    device_id: int
    device_code: str
    device_name: str
    area_name: str
    status: str
    error_message: Optional[str] = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    humidity_heatmap: List[HumidityHeatmapItem]
    mold_risks: List[MoldRiskItem]
    move_progress: List[MoveProgressItem]
    device_alerts: List[DeviceAlertItem]
    risk_inspections: List[RiskInspectionItem]
