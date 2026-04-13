from typing import List, Any
from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

class Paginator:
    def __init__(self, items: List[Any], page: int = 1, limit: int = 10, callback_prefix: str = "page"):
        self.items = items
        self.page = max(1, page)
        self.limit = limit
        self.callback_prefix = callback_prefix
        self.total_pages = (len(items) + limit - 1) // limit if items else 1

    def get_page_items(self) -> List[Any]:
        """Возвращает элементы для текущей страницы."""
        start = (self.page - 1) * self.limit
        end = start + self.limit
        return self.items[start:end]

    def add_pagination_buttons(self, builder: InlineKeyboardBuilder):
        """Добавляет кнопки навигации к существующему билдеру."""
        if self.total_pages <= 1:
            return

        nav_buttons = []
        
        # Кнопка "Назад"
        if self.page > 1:
            nav_buttons.append(InlineKeyboardButton(text="◀️ Назад", callback_data=f"{self.callback_prefix}:{self.page - 1}"))
        else:
            nav_buttons.append(InlineKeyboardButton(text=" ", callback_data="ignore"))

        # Центр: Счётчик страниц
        nav_buttons.append(InlineKeyboardButton(text=f"{self.page}/{self.total_pages}", callback_data="ignore"))

        # Кнопка "Вперед"
        if self.page < self.total_pages:
            nav_buttons.append(InlineKeyboardButton(text="Вперёд ▶️", callback_data=f"{self.callback_prefix}:{self.page + 1}"))
        else:
            nav_buttons.append(InlineKeyboardButton(text=" ", callback_data="ignore"))

        builder.row(*nav_buttons)
