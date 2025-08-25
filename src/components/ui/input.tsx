
import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCurrency, parseFormattedNumber } from "@/utils/format"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export interface InputCurrencyProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

const InputCurrency = React.forwardRef<HTMLInputElement, InputCurrencyProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatCurrency(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove all non-digit characters
      const numericValue = inputValue.replace(/[^\d]/g, '');
      
      if (numericValue === '') {
        setDisplayValue('');
        onValueChange(0);
      } else {
        const numValue = parseInt(numericValue, 10);
        setDisplayValue(formatCurrency(numValue));
        onValueChange(numValue);
      }
    };

    return (
      <Input
        type="text"
        className={cn("text-right", className)}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
InputCurrency.displayName = "InputCurrency"

export { Input, InputCurrency }
