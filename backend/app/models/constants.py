from enum import Enum

class RoleEnum(str, Enum):
    ADMIN = "admin"
    RECEPTIONIST = "receptionist"
    HAIRDRESSER = "hairdresser"