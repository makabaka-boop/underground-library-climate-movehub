from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)


class StorageArea(Base):
    __tablename__ = "storage_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    floor = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bookshelves = relationship("Bookshelf", back_populates="storage_area")
    sensor_points = relationship("SensorPoint", back_populates="storage_area")
    devices = relationship("Dehumidifier", back_populates="storage_area")


class Bookshelf(Base):
    __tablename__ = "bookshelves"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    storage_area_id = Column(Integer, ForeignKey("storage_areas.id"))
    row = Column(Integer)
    column = Column(Integer)
    status = Column(String, default="normal")
    description = Column(Text, nullable=True)

    storage_area = relationship("StorageArea", back_populates="bookshelves")
    move_tasks = relationship("MoveTask", back_populates="bookshelf")
    inspection_records = relationship("InspectionRecord", back_populates="bookshelf")


class SensorPoint(Base):
    __tablename__ = "sensor_points"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    storage_area_id = Column(Integer, ForeignKey("storage_areas.id"))
    location = Column(String)
    last_temperature = Column(Float, nullable=True)
    last_humidity = Column(Float, nullable=True)
    last_read_time = Column(DateTime(timezone=True), nullable=True)

    storage_area = relationship("StorageArea", back_populates="sensor_points")


class Dehumidifier(Base):
    __tablename__ = "dehumidifiers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    storage_area_id = Column(Integer, ForeignKey("storage_areas.id"))
    status = Column(String, default="running")
    current_humidity = Column(Float, nullable=True)
    target_humidity = Column(Float, default=50.0)
    last_maintenance = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    storage_area = relationship("StorageArea", back_populates="devices")


class MovePlan(Base):
    __tablename__ = "move_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="planning")


class MoveTask(Base):
    __tablename__ = "move_tasks"

    id = Column(Integer, primary_key=True, index=True)
    move_plan_id = Column(Integer, ForeignKey("move_plans.id"), nullable=True)
    bookshelf_id = Column(Integer, ForeignKey("bookshelves.id"))
    responsible_person = Column(String)
    planned_start_time = Column(DateTime(timezone=True))
    planned_end_time = Column(DateTime(timezone=True))
    actual_start_time = Column(DateTime(timezone=True), nullable=True)
    actual_end_time = Column(DateTime(timezone=True), nullable=True)
    source_location = Column(String)
    target_location = Column(String)
    risk_description = Column(Text, nullable=True)
    status = Column(String, default="pending")
    remarks = Column(Text, nullable=True)

    bookshelf = relationship("Bookshelf", back_populates="move_tasks")


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    bookshelf_id = Column(Integer, ForeignKey("bookshelves.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    inspection_time = Column(DateTime(timezone=True), server_default=func.now())
    temperature = Column(Float)
    humidity = Column(Float)
    has_odor = Column(Boolean, default=False)
    mold_level = Column(Integer, default=0)
    has_pest = Column(Boolean, default=False)
    handling_notes = Column(Text, nullable=True)

    bookshelf = relationship("Bookshelf", back_populates="inspection_records")
