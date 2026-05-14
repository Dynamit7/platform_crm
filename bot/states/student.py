from aiogram.fsm.state import StatesGroup, State

class RegistrationStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_phone = State()
    waiting_for_course = State()
    waiting_for_course_selection = State()
    waiting_for_trial_time = State()

class ProfileEditStates(StatesGroup):
    waiting_for_new_name = State()
    waiting_for_new_phone = State()
    waiting_for_verification_code = State()
