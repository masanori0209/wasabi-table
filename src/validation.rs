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
        if let Some(max_length) = header.max_length {
            if value.chars().count() > max_length {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は{}文字以内で入力してください（現在: {}文字）", 
                        header.display_name, max_length, value.chars().count()),
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
        // 日付形式チェック（YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY など）
        let date_patterns = [
            r"^\d{4}-\d{2}-\d{2}$",           // YYYY-MM-DD
            r"^\d{4}/\d{2}/\d{2}$",           // YYYY/MM/DD
            r"^\d{2}/\d{2}/\d{4}$",           // MM/DD/YYYY
            r"^\d{4}\.\d{2}\.\d{2}$",         // YYYY.MM.DD
        ];

        let is_valid_format = date_patterns.iter().any(|pattern| {
            regex::Regex::new(pattern).unwrap().is_match(value)
        });

        if !is_valid_format {
            return Err(ValidationError {
                field_name: header.display_name.clone(),
                message: format!("{}は正しい日付形式で入力してください（例: 2023-12-31）", header.display_name),
                error_type: ValidationErrorType::InvalidDate,
            });
        }

        Ok(())
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
        if let Some(choices) = &header.choices {
            if !choices.contains(&value.to_string()) {
                return Err(ValidationError {
                    field_name: header.display_name.clone(),
                    message: format!("{}は次の選択肢から選んでください: {}", 
                        header.display_name, choices.join(", ")),
                    error_type: ValidationErrorType::InvalidChoice,
                });
            }
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