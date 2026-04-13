from typing import List

DAYS_LIST = [
    (1, "Пн"),
    (2, "Вт"),
    (4, "Ср"),
    (8, "Чт"),
    (16, "Пт"),
    (32, "Сб"),
    (64, "Вс")
]

class ScheduleHelper:
    @staticmethod
    def bitmask_to_days(mask: int) -> List[str]:
        """Переводит число 21 в ['Пн', 'Ср', 'Пт']."""
        days = []
        for val, label in DAYS_LIST:
            if mask & val:
                days.append(label)
        return days

    @staticmethod
    def get_readable_days(mask: int) -> str:
        """Возвращает строку 'Пн, Ср, Пт'."""
        days = ScheduleHelper.bitmask_to_days(mask)
        return ", ".join(days) if days else "Не указано"

    @staticmethod
    def toggle_day(mask: int, day_val: int) -> int:
        """Включает или выключает день в маске."""
        return mask ^ day_val
