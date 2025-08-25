import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { formatCurrency, parseFormattedNumber } from '@/utils/format';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField = ({ label, error, required, className, children }: FormFieldProps) => {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-foreground mb-2 block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-destructive text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "0", disabled, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Remove all non-digit characters except decimal point
      const numericValue = inputValue.replace(/[^\d]/g, '');
      onChange(numericValue);
    };

    const displayValue = value ? formatCurrency(Number(value)) : '';

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ value, onChange, min = 0, max, step = 1, disabled, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value) || 0;
      if (max && newValue > max) return;
      if (newValue < min) return;
      onChange(newValue);
    };

    return (
      <Input
        ref={ref}
        type="number"
        value={value || ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={className}
        {...props}
      />
    );
  }
);

QuantityInput.displayName = 'QuantityInput';

interface ValidatedSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ValidatedSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Pilih...", 
  disabled, 
  children, 
  className 
}: ValidatedSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
};

interface FormTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ value, onChange, placeholder, disabled, rows = 3, maxLength, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength && newValue.length > maxLength) return;
      onChange(newValue);
    };

    return (
      <div className="space-y-1">
        <Textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={className}
          {...props}
        />
        {maxLength && (
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
