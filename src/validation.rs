use crate::types::{ColumnHeader, FieldType};
use serde_json;

#[derive(Debug, Clone)]
pub struct ValidationError {
    pub field_name: String,
    pub message: String,
    pub error_type: ValidationErrorType,
}

#[derive(Debug, Clone)]
pub enum ValidationErrorType {
    Required,
    MaxLength,
    MinLength,
    MaxNumber,
    MinNumber,
    InvalidEmail,
    InvalidDate,
    InvalidTime,
    InvalidChoice,
    InvalidBoolean,
    InvalidInteger,
    InvalidDecimal,
    MaxDigits,
    DecimalPlaces,
}

pub struct Validator;

impl Validator {
    /// セルの値を検証する
    pub fn validate_cell_value(
        header: &ColumnHeader,
        value: &str,
    ) -> Result<(), ValidationError> {
        // 必須チェック
        if header.required && value.trim().is_empty() {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!("{}は必須入力項目です", header.display_name),
                error_type: ValidationErrorType::Required,
            });
        }

        // 空の値の場合、必須でなければOK
        if value.trim().is_empty() {
            return Ok(());
        }

        // フィールドタイプ別の検証
        match header.field_type {
            FieldType::CharField => Self::validate_char_field(header, value),
            FieldType::EmailField => Self::validate_email_field(header, value),
            FieldType::TextareaField => Self::validate_textarea_field(header, value),
            FieldType::IntegerField => Self::validate_integer_field(header, value),
            FieldType::DecimalField => Self::validate_decimal_field(header, value),
            FieldType::DecimalWithNullField => Self::validate_decimal_with_null_field(header, value),
            FieldType::DateField => Self::validate_date_field(header, value),
            FieldType::TimeField => Self::validate_time_field(header, value),
            FieldType::CheckField | FieldType::BooleanField => Self::validate_boolean_field(header, value),
            FieldType::MenuField => Self::validate_menu_field(header, value),
            FieldType::ButtonField => Ok(()), // ボタンフィールドは検証不要
        }
    }

    fn validate_char_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        let char_count = value.chars().count();
        if let Some(min_length) = header.min_length {
            if char_count < min_length {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!(
                        "{}は{}文字以上で入力してください（現在: {}文字）",
                        header.display_name, min_length, char_count
                    ),
                    error_type: ValidationErrorType::MinLength,
                });
            }
        }
        if let Some(max_length) = header.max_length {
            if char_count > max_length {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}文字以内で入力してください（現在: {}文字）", 
                        header.display_name, max_length, char_count),
                    error_type: ValidationErrorType::MaxLength,
                });
            }
        }
        Ok(())
    }

    fn validate_email_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        // 文字数チェック
        Self::validate_char_field(header, value)?;

        // メールアドレス形式チェック
        let email_regex = regex::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
        if !email_regex.is_match(value) {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!("{}は正しいメールアドレス形式で入力してください", header.display_name),
                error_type: ValidationErrorType::InvalidEmail,
            });
        }
        Ok(())
    }

    fn validate_textarea_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        Self::validate_char_field(header, value)
    }

    fn validate_integer_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        // 整数形式チェック
        let num = value.parse::<i64>().map_err(|_| ValidationError {
            field_name: header.display_name.clone(),
            message: format!("{}は整数で入力してください", header.display_name),
            error_type: ValidationErrorType::InvalidInteger,
        })?;

        // 最小値チェック
        if let Some(min_number) = header.min_number {
            if num < min_number as i64 {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}以上で入力してください", header.display_name, min_number),
                    error_type: ValidationErrorType::MinNumber,
                });
            }
        }

        // 最大値チェック
        if let Some(max_number) = header.max_number {
            if num > max_number as i64 {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}以下で入力してください", header.display_name, max_number),
                    error_type: ValidationErrorType::MaxNumber,
                });
            }
        }

        Ok(())
    }

    fn validate_decimal_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        // 小数形式チェック
        let num = value.parse::<f64>().map_err(|_| ValidationError {
            field_name: header.display_name.clone(),
            message: format!("{}は数値で入力してください", header.display_name),
            error_type: ValidationErrorType::InvalidDecimal,
        })?;

        // 最小値チェック
        if let Some(min_number) = header.min_number {
            if num < min_number as f64 {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}以上で入力してください", header.display_name, min_number),
                    error_type: ValidationErrorType::MinNumber,
                });
            }
        }

        // 最大値チェック
        if let Some(max_number) = header.max_number {
            if num > max_number as f64 {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}以下で入力してください", header.display_name, max_number),
                    error_type: ValidationErrorType::MaxNumber,
                });
            }
        }

        // 桁数チェック
        if let Some(max_digits) = header.max_digits {
            let integer_part = num.trunc().abs() as u64;
            let digit_count = if integer_part == 0 { 1 } else { integer_part.to_string().len() };
            if digit_count > max_digits {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}桁以内で入力してください", header.display_name, max_digits),
                    error_type: ValidationErrorType::MaxDigits,
                });
            }
        }

        // 小数点桁数チェック
        if let Some(decimal_places) = header.decimal_places {
            if value.contains('.') {
                let parts: Vec<&str> = value.split('.').collect();
                if parts.len() == 2 && parts[1].len() > decimal_places {
                    return Err(ValidationError {
                        field_name: header.display_name.clone(),
                        message: format!("{}は小数点以下{}桁以内で入力してください", header.display_name, decimal_places),
                        error_type: ValidationErrorType::DecimalPlaces,
                    });
                }
            }
        }

        Ok(())
    }

    fn validate_decimal_with_null_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        if value.trim().to_lowercase() == "null" || value.trim().is_empty() {
            return Ok(());
        }
        Self::validate_decimal_field(header, value)
    }

    fn validate_date_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        if Self::parse_calendar_date(value).is_none() {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!(
                    "{}は正しい日付形式で入力してください（例: 2023-12-31）",
                    header.display_name
                ),
                error_type: ValidationErrorType::InvalidDate,
            });
        }
        Ok(())
    }

    /// 日付文字列をパースし、実在する暦日か検証する
    fn parse_calendar_date(value: &str) -> Option<(i32, u32, u32)> {
        let (year, month, day) = if let Some(caps) = regex::Regex::new(r"^(\d{4})[-/.](\d{2})[-/.](\d{2})$")
            .ok()?
            .captures(value)
        {
            (
                caps.get(1)?.as_str().parse().ok()?,
                caps.get(2)?.as_str().parse().ok()?,
                caps.get(3)?.as_str().parse().ok()?,
            )
        } else if let Some(caps) = regex::Regex::new(r"^(\d{2})/(\d{2})/(\d{4})$")
            .ok()?
            .captures(value)
        {
            (
                caps.get(3)?.as_str().parse().ok()?,
                caps.get(1)?.as_str().parse().ok()?,
                caps.get(2)?.as_str().parse().ok()?,
            )
        } else {
            return None;
        };

        if Self::is_valid_calendar_date(year, month, day) {
            Some((year, month, day))
        } else {
            None
        }
    }

    fn is_valid_calendar_date(year: i32, month: u32, day: u32) -> bool {
        if !(1..=12).contains(&month) || day < 1 {
            return false;
        }
        let max_day = match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => {
                let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
                if leap { 29 } else { 28 }
            }
            _ => return false,
        };
        day <= max_day
    }

    fn validate_time_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        // 時刻形式チェック（HH:MM, HH:MM:SS）
        let time_patterns = [
            r"^\d{2}:\d{2}$",                 // HH:MM
            r"^\d{2}:\d{2}:\d{2}$",           // HH:MM:SS
        ];

        let is_valid_format = time_patterns.iter().any(|pattern| {
            regex::Regex::new(pattern).unwrap().is_match(value)
        });

        if !is_valid_format {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!("{}は正しい時刻形式で入力してください（例: 14:30）", header.display_name),
                error_type: ValidationErrorType::InvalidTime,
            });
        }

        Ok(())
    }

    fn validate_boolean_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        let valid_values = ["true", "false", "1", "0", "yes", "no", "はい", "いいえ"];
        if !valid_values.contains(&value.trim().to_lowercase().as_str()) {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!("{}はtrue/false、1/0、yes/no、はい/いいえのいずれかで入力してください", header.display_name),
                error_type: ValidationErrorType::InvalidBoolean,
            });
        }
        Ok(())
    }

    fn validate_menu_field(header: &ColumnHeader, value: &str) -> Result<(), ValidationError> {
        match &header.choices {
            Some(choices) if !choices.is_empty() => {
                if !choices.contains(&value.to_string()) {
                    return Err(ValidationError {
                        field_name: header.display_name.clone(),
                        message: format!(
                            "{}は次の選択肢から選んでください: {}",
                            header.display_name,
                            choices.join(", ")
                        ),
                        error_type: ValidationErrorType::InvalidChoice,
                    });
                }
            }
            _ => {}
        }
        Ok(())
    }

    /// 検証エラーをJSON形式で返す
    pub fn validation_error_to_json(error: &ValidationError) -> String {
        serde_json::json!({
            "field_name": error.field_name,
            "message": error.message,
            "error_type": format!("{:?}", error.error_type)
        }).to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{ColumnHeader, FieldType};

    fn char_header() -> ColumnHeader {
        ColumnHeader {
            name: "name".to_string(),
            display_name: "名前".to_string(),
            max_length: Some(5),
            min_length: None,
            max_digits: None,
            decimal_places: None,
            required: false,
            width: 100.0,
            order: 0,
            is_visible: true,
            field_type: FieldType::CharField,
            choices: None,
            min_number: None,
            max_number: None,
        }
    }

    #[test]
    fn validate_char_field_max_length() {
        let header = char_header();
        assert!(Validator::validate_cell_value(&header, "hello").is_ok());
        assert!(Validator::validate_cell_value(&header, "hello!").is_err());
    }

    #[test]
    fn validate_required_field() {
        let mut header = char_header();
        header.required = true;
        assert!(Validator::validate_cell_value(&header, "").is_err());
        assert!(Validator::validate_cell_value(&header, "ok").is_ok());
    }

    #[test]
    fn validate_menu_field_with_choices() {
        let header = ColumnHeader {
            name: "status".to_string(),
            display_name: "ステータス".to_string(),
            max_length: None,
            min_length: None,
            max_digits: None,
            decimal_places: None,
            required: false,
            width: 100.0,
            order: 0,
            is_visible: true,
            field_type: FieldType::MenuField,
            choices: Some(vec!["open".to_string(), "closed".to_string()]),
            min_number: None,
            max_number: None,
        };
        assert!(Validator::validate_cell_value(&header, "open").is_ok());
        assert!(Validator::validate_cell_value(&header, "invalid").is_err());
    }

    #[test]
    fn validate_email_field() {
        let header = ColumnHeader {
            name: "email".to_string(),
            display_name: "メール".to_string(),
            max_length: None,
            min_length: None,
            max_digits: None,
            decimal_places: None,
            required: false,
            width: 100.0,
            order: 0,
            is_visible: true,
            field_type: FieldType::EmailField,
            choices: None,
            min_number: None,
            max_number: None,
        };
        assert!(Validator::validate_cell_value(&header, "test@example.com").is_ok());
        assert!(Validator::validate_cell_value(&header, "invalid").is_err());
    }

    #[test]
    fn validate_min_length() {
        let mut header = char_header();
        header.min_length = Some(3);
        assert!(Validator::validate_cell_value(&header, "ab").is_err());
        assert!(Validator::validate_cell_value(&header, "abc").is_ok());
    }

    #[test]
    fn validate_date_rejects_invalid_calendar_day() {
        let header = ColumnHeader {
            name: "hire_date".to_string(),
            display_name: "入社日".to_string(),
            max_length: None,
            min_length: None,
            max_digits: None,
            decimal_places: None,
            required: false,
            width: 100.0,
            order: 0,
            is_visible: true,
            field_type: FieldType::DateField,
            choices: None,
            min_number: None,
            max_number: None,
        };
        assert!(Validator::validate_cell_value(&header, "2023-02-30").is_err());
        assert!(Validator::validate_cell_value(&header, "2024-02-29").is_ok());
        assert!(Validator::validate_cell_value(&header, "2023-02-29").is_err());
    }
} 