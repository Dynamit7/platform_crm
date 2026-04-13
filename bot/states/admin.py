from aiogram.fsm.state import State, StatesGroup

class AdminUserStates(StatesGroup):
    waiting_for_search_query = State()  # Ожидание ФИО или телефона для поиска

class AdminBroadcastStates(StatesGroup):
    waiting_for_audience = State() # Выбор аудитории
    waiting_for_content = State()  # Ожидание сообщения для рассылки
    confirm_send = State()         # Подтверждение отправки

class AdminGroupCreateStates(StatesGroup):
    waiting_for_course = State()
    waiting_for_name = State()
    waiting_for_teacher = State()
    waiting_for_days = State()
    waiting_for_schedule = State()
    waiting_for_max_students = State()

class AdminCourseCreateStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_description = State()
    waiting_for_price = State()
    waiting_for_duration = State()
    waiting_for_new_price = State()  # Изменение цены существующего курса

class AdminScheduleStates(StatesGroup):
    waiting_for_group = State()
    waiting_for_teacher = State()
    waiting_for_topic = State()
    waiting_for_date = State()
    waiting_for_time = State()

class AdminFinanceStates(StatesGroup):
    waiting_for_user_search = State()
    waiting_for_amount = State()
    waiting_for_method = State()
    waiting_for_purpose = State()
