from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime


# ──────────────────────────────────────
# Auth Schemas
# ──────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    # role намеренно убрано — при регистрации всегда student

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserPublic"

class UserPublic(BaseModel):
    id: int
    telegram_id: Optional[int] = None
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    registration_source: str = "web"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    role: str = "student"

class UserUpdate(BaseModel):
    telegram_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None

class UserSummary(BaseModel):
    id: int
    telegram_id: Optional[int] = None
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    registration_source: str = "web"
    created_at: Optional[datetime] = None
    latest_payment_status: Optional[str] = "none"
    groups: List[str] = []

    class Config:
        from_attributes = True

Token.model_rebuild()

class BotUserSync(BaseModel):
    telegram_id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    course_interest: Optional[str] = None
    trial_time: Optional[str] = None

class BotPaymentSync(BaseModel):
    telegram_id: int
    amount: float
    currency: str = "UZS"
    method: str = "bot"
    description: Optional[str] = None
    course_id: Optional[int] = None

class BotHomeworkSync(BaseModel):
    telegram_id: int
    course_id: Optional[int] = None
    group_id: Optional[int] = None
    title: str = "ДЗ из бота"
    content: str

class BotReviewSync(BaseModel):
    telegram_id: int
    rating: int
    text: str


# ──────────────────────────────────────
# Course Schemas
# ──────────────────────────────────────
class CourseBase(BaseModel):
    title: str
    description: str
    duration: str
    price: float
    image_url: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Teacher Schemas
# ──────────────────────────────────────
class TeacherBase(BaseModel):
    name: str
    bio: str
    photo_url: Optional[str] = None
    subjects: str

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Group Schemas
# ──────────────────────────────────────
class GroupCreate(BaseModel):
    name: str
    course_id: int
    teacher_id: Optional[int] = None
    max_students: int = 8
    schedule_json: Optional[Any] = None

class Group(GroupCreate):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    course: Optional[Course] = None
    teacher: Optional[Teacher] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Lesson Schemas
# ──────────────────────────────────────
class LessonCreate(BaseModel):
    group_id: int
    topic: str
    description: Optional[str] = None
    scheduled_at: datetime
    zoom_link: Optional[str] = None

class Lesson(LessonCreate):
    id: int
    is_recorded: bool = False
    recording_url: Optional[str] = None
    is_completed: bool = False

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Enrollment Schemas
# ──────────────────────────────────────
class Enrollment(BaseModel):
    id: int
    student_id: int
    course_id: int
    group_id: Optional[int] = None
    progress: int = 0
    xp: int = 0
    course: Optional[Course] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Homework Schemas
# ──────────────────────────────────────
class HomeworkCreate(BaseModel):
    course_id: int
    group_id: Optional[int] = None
    title: str
    description: str
    due_date: datetime

class Homework(HomeworkCreate):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HomeworkSubmissionBase(BaseModel):
    homework_id: int
    student_id: int
    content: str
    grade: Optional[str] = None
    status: str = "submitted"

class HomeworkGrade(BaseModel):
    submission_id: int
    grade: str
    feedback: Optional[str] = None

class HomeworkSubmission(HomeworkSubmissionBase):
    id: int
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Payment Schemas
# ──────────────────────────────────────
class PaymentCreate(BaseModel):
    student_id: int
    course_id: Optional[int] = None
    amount: float
    currency: str = "UZS"
    method: str = "cash"
    description: Optional[str] = None
    period_month: Optional[int] = None
    period_year: Optional[int] = None

class Payment(PaymentCreate):
    id: int
    status: str = "paid"
    created_at: Optional[datetime] = None
    student: Optional[UserPublic] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Notification Schemas
# ──────────────────────────────────────
class Notification(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str = "info"
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Lead Schemas
# ──────────────────────────────────────
class LeadBase(BaseModel):
    name: str
    phone: str
    course_id: Optional[int] = None
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class Lead(LeadBase):
    id: int
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    course: Optional[Course] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Review Schemas
# ──────────────────────────────────────
class ReviewBase(BaseModel):
    student_name: str
    text: str
    rating: int

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int

    class Config:
        from_attributes = True


# ──────────────────────────────────────
# Dashboard Schemas
# ──────────────────────────────────────
class DashboardData(BaseModel):
    user: UserPublic
    stats: Dict[str, Any]
    enrollments: List[Any] = []
    upcoming_lesson: Optional[Dict[str, Any]] = None
    homeworks: List[Dict[str, Any]] = []
    vocabulary: List[Dict[str, Any]] = []
    schedule: List[Dict[str, Any]] = []
    notifications_count: int = 0


# ──────────────────────────────────────
# Admin Schemas
# ──────────────────────────────────────
class AdminStats(BaseModel):
    total_students: int
    total_teachers: int
    total_courses: int
    total_groups: int
    new_leads_today: int
    total_leads: int
    monthly_revenue: float
    total_revenue: float
    pending_homeworks: int
    active_enrollments: int

class BulkAction(BaseModel):
    ids: List[int]
