import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

const parseNumber = (value: string): number => {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};

export interface InputCurrencyProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

const InputCurrency = React.forwardRef<HTMLInputElement, InputCurrencyProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsedValue = parseNumber(event.target.value);
      onValueChange(parsedValue);
    };

    return (
      <Input
        ref={ref}
        type="text" // Gunakan tipe text untuk menampilkan format
        className={cn("text-right", className)} // Rata kanan untuk angka
        value={formatNumber(value)}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
InputCurrency.displayName = "InputCurrency"
export { Input }
