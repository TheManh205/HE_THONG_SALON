from datetime import datetime, timedelta, time, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import Role, User
from app.models.customer import Customer
from app.models.hairdresser import Hairdresser, Schedule
from app.models.service import Service, AppointmentService
from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice, PaymentMethod, PaymentStatus
from app.models.history import ServiceHistory
from app.models.audit import AuditLog

def seed_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("[SEED] Seeding database...")

        # 1. Seed Roles
        roles_data = [
            {"name": "admin", "description": "Quản lý Salon - Toàn quyền hệ thống"},
            {"name": "receptionist", "description": "Lễ tân - Quản lý lịch hẹn, hóa đơn, khách hàng"},
            {"name": "hairdresser", "description": "Thợ làm tóc - Xem ca làm, lịch hẹn, lịch sử khách"}
        ]
        roles_map = {}
        for r in roles_data:
            existing = db.query(Role).filter(Role.name == r["name"]).first()
            if not existing:
                existing = Role(**r)
                db.add(existing)
                db.flush()
            roles_map[r["name"]] = existing

        # 2. Seed Users
        users_data = [
            {
                "username": "admin",
                "email": "admin@salonluxury.vn",
                "hashed_password": get_password_hash("admin123"),
                "full_name": "Nguyễn Hoàng Minh (Quản lý)",
                "phone": "0901234567",
                "role_id": roles_map["admin"].id,
                "is_active": True
            },
            {
                "username": "letan",
                "email": "receptionist@salonluxury.vn",
                "hashed_password": get_password_hash("letan123"),
                "full_name": "Trần Thu Hà (Lễ tân)",
                "phone": "0912345678",
                "role_id": roles_map["receptionist"].id,
                "is_active": True
            },
            {
                "username": "stylist_nam",
                "email": "nam.stylist@salonluxury.vn",
                "hashed_password": get_password_hash("stylist123"),
                "full_name": "Lê Tuấn Nam (Master Stylist)",
                "phone": "0923456789",
                "role_id": roles_map["hairdresser"].id,
                "is_active": True
            },
            {
                "username": "stylist_linh",
                "email": "linh.stylist@salonluxury.vn",
                "hashed_password": get_password_hash("stylist123"),
                "full_name": "Phạm Mai Linh (Color Expert)",
                "phone": "0934567890",
                "role_id": roles_map["hairdresser"].id,
                "is_active": True
            },
            {
                "username": "stylist_an",
                "email": "an.stylist@salonluxury.vn",
                "hashed_password": get_password_hash("stylist123"),
                "full_name": "Đỗ Hoàng An (Creative Stylist)",
                "phone": "0945678901",
                "role_id": roles_map["hairdresser"].id,
                "is_active": True
            }
        ]
        users_map = {}
        for u in users_data:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if not existing:
                existing = User(**u)
                db.add(existing)
                db.flush()
            users_map[u["username"]] = existing

        # 3. Seed Hairdressers & Weekly Schedules
        hairdressers_data = [
            {
                "user_id": users_map["stylist_nam"].id,
                "full_name": "Lê Tuấn Nam",
                "phone": "0923456789",
                "bio": "Hơn 8 năm kinh nghiệm tạo mẫu tóc Hàn Quốc, chuyên cắt Layer và uốn sóng lơi tự nhiên.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                "rating": 4.9,
                "is_active": True
            },
            {
                "user_id": users_map["stylist_linh"].id,
                "full_name": "Phạm Mai Linh",
                "phone": "0934567890",
                "bio": "Chuyên gia phối màu Balayage và tẩy nhuộm tone pastel thời thượng, phục hồi tóc chuyên sâu.",
                "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
                "rating": 5.0,
                "is_active": True
            },
            {
                "user_id": users_map["stylist_an"].id,
                "full_name": "Đỗ Hoàng An",
                "phone": "0945678901",
                "bio": "Master Barber & Stylist tóc nam - nữ cá tính, uốn phồng chân tóc và uốn Texture hiện đại.",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
                "rating": 4.8,
                "is_active": True
            }
        ]
        hairdressers_map = {}
        for h in hairdressers_data:
            existing = db.query(Hairdresser).filter(Hairdresser.full_name == h["full_name"]).first()
            if not existing:
                existing = Hairdresser(**h)
                db.add(existing)
                db.flush()

                # Add weekly schedule (Mon: Off, Tue-Sun: 8:30 - 20:00)
                for dow in range(7):
                    sched = Schedule(
                        hairdresser_id=existing.id,
                        day_of_week=dow,
                        start_time=time(8, 30),
                        end_time=time(20, 0),
                        is_day_off=(dow == 0) # Day off on Monday
                    )
                    db.add(sched)
            hairdressers_map[h["full_name"]] = existing

        # 4. Seed Services Catalog
        services_data = [
            # Cắt & Tạo kiểu
            {
                "name": "Cắt Tóc Layer Nữ & Sấy Tạo Kiểu Chuẩn Hàn",
                "description": "Tư vấn dáng mặt, cắt tỉa tầng layer bay bổng, gội thảo mộc và sấy tạo kiểu bồng bềnh.",
                "duration_minutes": 45,
                "price": 180000,
                "category": "Cắt & Tạo kiểu",
                "image_url": "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            {
                "name": "Cắt Tóc Nam Barber VIP & Gội Massage",
                "description": "Cắt Fade/Sidepart chuẩn form, cạo viền, gội đầu bấm huyệt thư giãn, sấy vuốt sáp cao cấp.",
                "duration_minutes": 35,
                "price": 120000,
                "category": "Cắt & Tạo kiểu",
                "image_url": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            # Uốn & Duỗi
            {
                "name": "Uốn Sóng Lơi / Sóng Nước Hàn Quốc",
                "description": "Kỹ thuật uốn setting nhiệt độ thấp kết hợp tinh chất dưỡng, lọn xoăn tự nhiên mềm mại.",
                "duration_minutes": 120,
                "price": 650000,
                "category": "Uốn & Duỗi",
                "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            {
                "name": "Uốn Phồng Chân Tóc Không Lộ Nếp",
                "description": "Khắc phục triệt để tóc mỏng xẹp, tạo độ phồng đỉnh đầu tự nhiên bồng bềnh suốt 3 tháng.",
                "duration_minutes": 60,
                "price": 350000,
                "category": "Uốn & Duỗi",
                "image_url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            {
                "name": "Duỗi Phồng Tự Nhiên Organic",
                "description": "Thuốc duỗi hữu cơ cao cấp, ép mượt tóc bung xù mà vẫn giữ được độ cong ôm tự nhiên.",
                "duration_minutes": 90,
                "price": 550000,
                "category": "Uốn & Duỗi",
                "image_url": "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            # Nhuộm màu
            {
                "name": "Nhuộm Tone Thời Trang Loreal / Wella",
                "description": "Lên màu chuẩn sắc, bóng mượt, khóa hạt màu lâu phai với bảng màu thời thượng.",
                "duration_minutes": 90,
                "price": 550000,
                "category": "Nhuộm màu & Tẩy",
                "image_url": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            {
                "name": "Tẩy Nhuộm Nâu Khói / Balayage Highlight",
                "description": "Kỹ thuật gảy light hoặc nhuộm màu pastel khói không làm mủn tóc, phủ bóng ánh sáng.",
                "duration_minutes": 150,
                "price": 1100000,
                "category": "Nhuộm màu & Tẩy",
                "image_url": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            # Phục hồi & Chăm sóc
            {
                "name": "Phục Hồi Đa Tầng Olaplex & Keratin",
                "description": "Hàn gắn liên kết lưu huỳnh bị đứt gãy, phục hồi tóc nát, cháy khô xơ sau hóa chất.",
                "duration_minutes": 60,
                "price": 450000,
                "category": "Chăm sóc & Phục hồi",
                "image_url": "https://images.unsplash.com/photo-1512290900672-1f4f66a87754?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            },
            {
                "name": "Gội Đầu Dưỡng Sinh Thảo Mộc & Massage Cổ Vai Gáy",
                "description": "Gội nước bồ kết nấu tươi, xông tinh dầu, bấm huyệt đã thông kinh lạc 60 phút thư giãn tuyệt đối.",
                "duration_minutes": 60,
                "price": 190000,
                "category": "Chăm sóc & Phục hồi",
                "image_url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80",
                "is_active": True
            }
        ]
        services_map = {}
        for s in services_data:
            existing = db.query(Service).filter(Service.name == s["name"]).first()
            if not existing:
                existing = Service(**s)
                db.add(existing)
                db.flush()
            services_map[s["name"]] = existing

        # 5. Seed Customers
        customers_data = [
            {
                "full_name": "Nguyễn Bích Phương",
                "phone": "0987654321",
                "email": "bichphuong@gmail.com",
                "gender": "Female",
                "notes": "Khách quen, thích tone màu lạnh, da đầu hơi nhạy cảm với chất tẩy mạnh."
            },
            {
                "full_name": "Trần Đức Anh",
                "phone": "0976543210",
                "email": "ducanh.tran@gmail.com",
                "gender": "Male",
                "notes": "Cắt fade sát 2 bên, uốn nhẹ mái texture."
            },
            {
                "full_name": "Vũ Ngọc Ánh",
                "phone": "0965432109",
                "email": "ngocanh.vu@gmail.com",
                "gender": "Female",
                "notes": "Tóc từng tẩy 2 lần, cần chú ý phục hồi chuyên sâu trước khi uốn."
            },
            {
                "full_name": "Lê Quỳnh Trang",
                "phone": "0954321098",
                "email": "quynhtrang@gmail.com",
                "gender": "Female",
                "notes": "Thích phong cách uốn xoăn sóng Hàn Quốc."
            }
        ]
        customers_map = {}
        for c in customers_data:
            existing = db.query(Customer).filter(Customer.phone == c["phone"]).first()
            if not existing:
                existing = Customer(**c)
                db.add(existing)
                db.flush()
            customers_map[c["full_name"]] = existing

        # 6. Seed Past Appointments & Completed Invoices & History
        now = datetime.now(timezone.utc)
        past_app_1 = db.query(Appointment).filter(Appointment.customer_id == customers_map["Nguyễn Bích Phương"].id).first()
        if not past_app_1:
            # Past appointment completed 3 days ago
            app_time_past = now - timedelta(days=3, hours=4)
            app1 = Appointment(
                customer_id=customers_map["Nguyễn Bích Phương"].id,
                hairdresser_id=hairdressers_map["Phạm Mai Linh"].id,
                booking_code="BKG-SEED01",
                appointment_date=app_time_past,
                end_time=app_time_past + timedelta(minutes=135),
                status=AppointmentStatus.COMPLETED,
                total_price=730000,
                notes="Khách uốn sóng và cắt layer"
            )
            db.add(app1)
            db.flush()

            db.add(AppointmentService(appointment_id=app1.id, service_id=services_map["Cắt Tóc Layer Nữ & Sấy Tạo Kiểu Chuẩn Hàn"].id, price_at_booking=180000))
            db.add(AppointmentService(appointment_id=app1.id, service_id=services_map["Uốn Sóng Lơi / Sóng Nước Hàn Quốc"].id, price_at_booking=650000))

            # Invoice
            inv1 = Invoice(
                appointment_id=app1.id,
                customer_id=app1.customer_id,
                total_amount=830000,
                discount_amount=100000,
                final_amount=730000,
                payment_method=PaymentMethod.BANK_TRANSFER,
                payment_status=PaymentStatus.PAID,
                created_at=app_time_past + timedelta(minutes=140)
            )
            db.add(inv1)
            db.flush()

            # Payment
            from app.models.payment import Payment
            pay1 = Payment(
                invoice_id=inv1.id,
                amount=730000,
                payment_method=PaymentMethod.BANK_TRANSFER,
                payment_status=PaymentStatus.PAID,
                transaction_code="TXN-SEED-001",
                created_at=app_time_past + timedelta(minutes=140),
                paid_at=app_time_past + timedelta(minutes=140)
            )
            db.add(pay1)

            # Service history
            hist1 = ServiceHistory(
                customer_id=app1.customer_id,
                hairdresser_id=app1.hairdresser_id,
                appointment_id=app1.id,
                service_names="Cắt Tóc Layer Nữ, Uốn Sóng Lơi Hàn Quốc",
                formula_or_color_code="Trục uốn size 25mm, thuốc uốn Milbon số 1 (20 phút) + dập định hình số 2 (15 phút)",
                notes="Khách rất ưng ý lọn sóng tự nhiên, dặn khách sấy cuộn tay về phía sau.",
                cost=730000,
                completed_at=app_time_past + timedelta(minutes=140)
            )
            db.add(hist1)

        # Upcoming appointment today
        today_app = db.query(Appointment).filter(Appointment.customer_id == customers_map["Trần Đức Anh"].id).first()
        if not today_app:
            # Build timezone-aware datetime for 'today' appointment in UTC
            today_time = datetime(now.year, now.month, now.day, 14, 0, 0, tzinfo=timezone.utc)
            app2 = Appointment(
                customer_id=customers_map["Trần Đức Anh"].id,
                hairdresser_id=hairdressers_map["Đỗ Hoàng An"].id,
                booking_code="BKG-SEED02",
                appointment_date=today_time,
                end_time=today_time + timedelta(minutes=95),
                status=AppointmentStatus.CONFIRMED,
                total_price=470000,
                notes="Khách đặt qua public client, muốn cắt form Ivy League và uốn nhẹ phần mái"
            )
            db.add(app2)
            db.flush()

            db.add(AppointmentService(appointment_id=app2.id, service_id=services_map["Cắt Tóc Nam Barber VIP & Gội Massage"].id, price_at_booking=120000))
            db.add(AppointmentService(appointment_id=app2.id, service_id=services_map["Uốn Phồng Chân Tóc Không Lộ Nếp"].id, price_at_booking=350000))

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
