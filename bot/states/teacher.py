from aiogram.fsm.state import State, StatesGroup

class TeacherGradingStates(StatesGroup):
    waiting_for_grade = State()
    waiting_for_comment = State()

class TeacherLessonStates(StatesGroup):
    waiting_for_homework_text = State()
    waiting_for_material_file = State()
