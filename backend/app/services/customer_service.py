from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException
from app.models.customer import Customer
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.history import ServiceHistory
from app.models.user import RoleEnum

class CustomerService:
    def __init__(self, db: Session):
        self.db = db

    def _check_duplicate_phone(self, phone: str, exclude_id: int = None):
        """Logic dùng chung để kiểm tra trùng số điện thoại"""
        query = self.db.query(Customer).filter(Customer.phone == phone)
        if exclude_id:
            query = query.filter(Customer.id != exclude_id)
        if query.first():
            raise HTTPException(status_code=400, detail="Số điện thoại này đã được đăng ký.")

    def get_customers(self, search: str = None, skip: int = 0, limit: int = 100):
        """
        Khắc phục N+1 Query: Gom toàn bộ việc đếm lịch hẹn và tính tổng tiền vào 1 câu truy vấn duy nhất 
        bằng OUTER JOIN và GROUP BY.
        """
        query = self.db.query(
            Customer,
            func.count(Appointment.id.distinct()).label('appointment_count'),
            func.sum(Invoice.final_amount).label('total_spent')
        ).outerjoin(Appointment, Appointment.customer_id == Customer.id)\
         .outerjoin(Invoice, (Invoice.customer_id == Customer.id) & (Invoice.payment_status == 'PAID'))\
         .group_by(Customer.id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.full_name.ilike(search_term),
                    Customer.phone.ilike(search_term),
                    Customer.email.ilike(search_term)
                )
            )

        results = query.offset(skip).limit(limit).all()
        
        # Map kết quả SQL ra dict chuẩn bị cho Pydantic Schema
        formatted_results = []
        for customer, app_count, spent in results:
            customer_data = {c.name: getattr(customer, c.name) for c in customer.__table__.columns}
            customer_data["appointment_count"] = app_count or 0
            customer_data["total_spent"] = spent or 0.0
            formatted_results.append(customer_data)
            
        return formatted_results

    def create_customer(self, customer_in):
        self._check_duplicate_phone(customer_in.phone)
        
        new_customer = Customer(**customer_in.model_dump())
        self.db.add(new_customer)
        self.db.commit()
        self.db.refresh(new_customer)
        return new_customer

    def update_customer(self, customer_id: int, customer_in):
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng.")

        # Chỉ check trùng nếu có thay đổi số điện thoại
        update_data = customer_in.model_dump(exclude_unset=True)
        if 'phone' in update_data and update_data['phone'] != customer.phone:
            self._check_duplicate_phone(update_data['phone'], exclude_id=customer_id)

        for key, value in update_data.items():
            setattr(customer, key, value)

        self.db.commit()
        self.db.refresh(customer)
        return customer


    def get_customer_by_id(self, customer_id: int):
        query = self.db.query(
            Customer,
            func.count(Appointment.id.distinct()).label('appointment_count'),
            func.sum(Invoice.final_amount).label('total_spent')
        ).outerjoin(Appointment, Appointment.customer_id == Customer.id)\
         .outerjoin(Invoice, (Invoice.customer_id == Customer.id) & (Invoice.payment_status == 'PAID'))\
         .filter(Customer.id == customer_id)\
         .group_by(Customer.id)
         
        result = query.first()
        if not result:
            return None
            
        customer, app_count, spent = result
        customer_data = {c.name: getattr(customer, c.name) for c in customer.__table__.columns}
        customer_data["appointment_count"] = app_count or 0
        customer_data["total_spent"] = spent or 0.0
        return customer_data

    def delete_customer(self, customer_id: int):
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return False
        self.db.delete(customer)
        self.db.commit()
        return True

    def get_service_history(self, customer_id: int, current_user):
        """
        Kiểm soát quyền truy cập dữ liệu (Data-level Scoping).
        Thợ làm tóc chỉ xem được lịch sử do chính mình thực hiện.
        """
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng.")

        query = self.db.query(ServiceHistory).filter(ServiceHistory.customer_id == customer_id)
        
        # Nếu là thợ, ép buộc chỉ được xem lịch sử của mình
        if getattr(current_user.role, 'name', '') == RoleEnum.HAIRDRESSER.value:
            if not getattr(current_user, 'hairdresser', None):
                raise HTTPException(status_code=403, detail="Tài khoản thợ chưa được thiết lập.")
            query = query.filter(ServiceHistory.hairdresser_id == current_user.hairdresser.id)

        return query.order_by(ServiceHistory.completed_at.desc()).all()