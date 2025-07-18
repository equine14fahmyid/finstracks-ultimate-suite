
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getDateRangePresets } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DateFilter = ({ value, onChange, className }: DateFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const presets = getDateRangePresets();

  const handlePresetClick = (preset: any) => {
    onChange({
      from: new Date(preset.start),
      to: new Date(preset.end)
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  const formatDisplayText = () => {
    if (!value.from) return "Pilih rentang tanggal";
    if (!value.to) return format(value.from, "dd MMM yyyy", { locale: id });
    if (value.from.getTime() === value.to.getTime()) {
      return format(value.from, "dd MMM yyyy", { locale: id });
    }
    return `${format(value.from, "dd MMM", { locale: id })} - ${format(value.to, "dd MMM yyyy", { locale: id })}`;
  };

  const isDateSelected = value.from && value.to;

  return (
    <div className={cn("flex flex-col md:flex-row md:items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal glass-card border-0 hover-lift w-full md:w-auto h-10 md:h-auto",
              !value.from && "text-muted-foreground",
              isDateSelected && "bg-primary/10 text-primary border-primary/20"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatDisplayText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 glass-card border-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="flex flex-col md:flex-row">
            {/* Presets */}
            <div className="border-b md:border-b-0 md:border-r border-border p-3 order-2 md:order-1">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preset Cepat
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
                  {Object.values(presets).map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-primary/10 h-8 md:h-auto"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <span className="truncate">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="p-3 order-1 md:order-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={(range) => onChange(range ? { from: range.from, to: range.to } : { from: undefined, to: undefined })}
                numberOfMonths={1}
                locale={id}
                className="rounded-md"
              />
              
              {/* Manual Input */}
              <div className="mt-4 space-y-2">
                <Label className="text-xs font-medium">Input Manual</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="from-date" className="text-xs">Dari</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => onChange({
                        ...value,
                        from: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-date" className="text-xs">Sampai</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => onChange({
                        ...value,
                        to: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badge */}
      {isDateSelected && (
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 w-fit">
          <Filter className="w-3 h-3 mr-1" />
          Filter Aktif
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-2 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
};

export default DateFilter;
