
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormErrors {
  [key: string]: string;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateField = useCallback((field: string, value: any): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'Field ini wajib diisi';
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Minimal ${rule.minLength} karakter`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Maksimal ${rule.maxLength} karakter`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Format tidak valid';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Nilai minimal ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Nilai maksimal ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: { [key: string]: any }): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules, validateField]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Format email tidak valid';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'Password minimal 6 karakter';
      }
      return null;
    }
  },
  phone: {
    pattern: /^(\+62|62|0)[0-9]{8,11}$/,
    custom: (value: string) => {
      if (value && !/^(\+62|62|0)[0-9]{8,11}$/.test(value)) {
        return 'Format nomor telepon tidak valid';
      }
      return null;
    }
  },
  currency: {
    min: 0,
    custom: (value: number) => {
      if (value !== undefined && value < 0) {
        return 'Nilai tidak boleh negatif';
      }
      return null;
    }
  },
  quantity: {
    required: true,
    min: 1,
    custom: (value: number) => {
      if (!value || value < 1) {
        return 'Quantity minimal 1';
      }
      return null;
    }
  }
};
