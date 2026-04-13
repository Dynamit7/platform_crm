import pandas as pd
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def export_to_excel(data: List[Dict[str, Any]], sheet_name: str = "Sheet1") -> io.BytesIO:
    """Конвертирует список словарей в форматированный Excel-файл (в памяти)."""
    if not data:
        return None

    df = pd.DataFrame(data)
    output = io.BytesIO()

    # Используем xlsxwriter или openpyxl для форматирования
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
        
        # Получаем объект листа для форматирования
        workbook = writer.book
        worksheet = writer.sheets[sheet_name]

        # Автоматическая настройка ширины колонок
        for i, col in enumerate(df.columns):
            column_len = max(df[col].astype(str).str.len().max(), len(col)) + 2
            worksheet.column_dimensions[chr(65 + i)].width = column_len

    output.seek(0)
    return output
