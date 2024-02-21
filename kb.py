from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

exit_menu = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Отмена", callback_data='cancel')]
])

запись = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Записаться", callback_data='sign')]
])

подтверждение = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="❌", callback_data='decline'),
        InlineKeyboardButton(text="✅", callback_data='accept')
    ]

])

отказ = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="Перенести", callback_data='record'),
        InlineKeyboardButton(text="Неактуально", callback_data='redecline')
    ]
])

поддержка = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="❌", callback_data='supdec'),
        InlineKeyboardButton(text="✅", callback_data='supace')
    ]
])