"""Seed the dev DB with demo data: 2 lecturers, 5 students, 3 courses,
6 assignments, ~15 grades. Idempotent — re-run is safe.

Usage (from apps/lms-api/):
    python -m scripts.seed_demo
"""
from __future__ import annotations

import asyncio
import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.database import AsyncSessionLocal
from app.models.assignment import Assignment, Grade
from app.models.base import AssignmentType, EnrollmentStatus, UserRole
from app.models.course import Course, CourseEnrollment, Lesson, Module
from app.models.user import LecturerProfile, StudentProfile, User

PASSWORD = "DemoPass123!"


async def get_or_create_user(db: AsyncSession, email: str, full_name: str, role: UserRole) -> User:
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        return existing
    user = User(email=email, full_name=full_name, password_hash=hash_password(PASSWORD),
                role=role, is_active=True, is_email_verified=True)
    db.add(user); await db.flush()
    return user


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        lect_a = await get_or_create_user(db, "lect.a@uni.edu", "GS. Nguyen Van A", UserRole.LECTURER)
        lect_b = await get_or_create_user(db, "lect.b@uni.edu", "TS. Tran Thi B", UserRole.LECTURER)
        for u, code, dept in [(lect_a, "GV001", "CNTT"), (lect_b, "GV002", "Toan")]:
            ex = (await db.execute(select(LecturerProfile).where(LecturerProfile.user_id == u.id))).scalar_one_or_none()
            if not ex:
                db.add(LecturerProfile(user_id=u.id, employee_code=code, department=dept, title="Giang vien"))

        students: List[User] = []
        for i in range(1, 6):
            u = await get_or_create_user(db, f"sv{i}@uni.edu", f"Sinh vien {i:02d}", UserRole.STUDENT)
            students.append(u)
            ex = (await db.execute(select(StudentProfile).where(StudentProfile.user_id == u.id))).scalar_one_or_none()
            if not ex:
                db.add(StudentProfile(
                    user_id=u.id, student_code=f"SV{2026000 + i}",
                    major=random.choice(["CNTT", "ATTT", "HTTT"]),
                    year=random.choice([1, 2, 3]),
                    preferences={"language": "vi", "study_style": "visual"},
                ))

        course_specs = [
            (lect_a, "CS101", "Nhap mon Lap trinh", "Hoc Python tu con so 0."),
            (lect_a, "CS201", "Cau truc du lieu", "Linked list, tree, hash."),
            (lect_b, "MATH101", "Giai tich 1", "Dao ham, tich phan."),
        ]
        courses: list[Course] = []
        for lect, code, name, desc in course_specs:
            existing = (await db.execute(select(Course).where(Course.code == code))).scalar_one_or_none()
            if existing:
                courses.append(existing); continue
            c = Course(code=code, name=name, description=desc, lecturer_id=lect.id,
                       semester="2026.1", is_published=True,
                       invite_code=secrets.token_urlsafe(6))
            db.add(c); await db.flush()
            courses.append(c)
            for m_idx in range(2):
                mod = Module(course_id=c.id, title=f"{code} - Module {m_idx+1}",
                             description=f"Hoc phan {m_idx+1}", order_index=m_idx)
                db.add(mod); await db.flush()
                for l_idx in range(3):
                    db.add(Lesson(
                        module_id=mod.id,
                        title=f"Bai {m_idx*3 + l_idx + 1}: Khai niem {l_idx+1}",
                        content_md=f"# Lesson\nContent for {code} m{m_idx+1} l{l_idx+1}.",
                        order_index=l_idx, duration_minutes=45,
                    ))

        for c in courses:
            for s in students:
                ex = (await db.execute(
                    select(CourseEnrollment).where(
                        CourseEnrollment.course_id == c.id,
                        CourseEnrollment.student_id == s.id,
                    )
                )).scalar_one_or_none()
                if not ex:
                    db.add(CourseEnrollment(course_id=c.id, student_id=s.id,
                                            status=EnrollmentStatus.ACTIVE))

        assignments: list[Assignment] = []
        for c in courses:
            for title, atype, weight, days in [
                (f"{c.code} - Bai tap 1", AssignmentType.ESSAY, 0.3, +7),
                (f"{c.code} - Bai tap 2", AssignmentType.FILE, 0.7, +14),
            ]:
                ex = (await db.execute(
                    select(Assignment).where(Assignment.course_id == c.id, Assignment.title == title)
                )).scalar_one_or_none()
                if ex:
                    assignments.append(ex); continue
                a = Assignment(course_id=c.id, title=title, description=f"Mo ta {title}",
                               type=atype, max_score=10.0, weight=weight,
                               due_at=datetime.now(timezone.utc) + timedelta(days=days),
                               is_published=True)
                db.add(a); await db.flush()
                assignments.append(a)

        for a in assignments:
            for s in students:
                if random.random() < 0.6:
                    ex = (await db.execute(
                        select(Grade).where(Grade.assignment_id == a.id, Grade.student_id == s.id)
                    )).scalar_one_or_none()
                    if ex: continue
                    db.add(Grade(student_id=s.id, course_id=a.course_id, assignment_id=a.id,
                                 score=round(random.uniform(5.0, 9.5), 1),
                                 max_score=a.max_score, weight=a.weight))

        await db.commit()

        u_count = len((await db.execute(select(User))).scalars().all())
        c_count = len((await db.execute(select(Course))).scalars().all())
        a_count = len((await db.execute(select(Assignment))).scalars().all())
        g_count = len((await db.execute(select(Grade))).scalars().all())
        print("=" * 50)
        print("Seed complete!")
        print(f"  Users: {u_count}  Courses: {c_count}  Assignments: {a_count}  Grades: {g_count}")
        print(f"  Login: lect.a@uni.edu / {PASSWORD}   |   sv1@uni.edu / {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
