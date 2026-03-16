import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function formatDateBR(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse existing value back to DateRange
  const parseValue = (): DateRange | undefined => {
    if (!value) return undefined;
    const rangeMatch = value.match(/^(\d{2}\/\d{2}\/\d{4})\s*(?:a|to|-|→)\s*(\d{2}\/\d{2}\/\d{4})$/i);
    if (rangeMatch) {
      const [, s, e] = rangeMatch;
      const [sd, sm, sy] = s.split('/').map(Number);
      const [ed, em, ey] = e.split('/').map(Number);
      return { from: new Date(sy, sm - 1, sd), to: new Date(ey, em - 1, ed) };
    }
    const singleMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (singleMatch) {
      const d = new Date(+singleMatch[3], +singleMatch[2] - 1, +singleMatch[1]);
      return { from: d, to: undefined };
    }
    return undefined;
  };

  const [range, setRange] = useState<DateRange | undefined>(parseValue);

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    if (!newRange?.from) {
      onChange('');
      return;
    }
    if (!newRange.to || newRange.from.getTime() === newRange.to.getTime()) {
      onChange(formatDateBR(newRange.from));
    } else {
      onChange(`${formatDateBR(newRange.from)} a ${formatDateBR(newRange.to)}`);
    }
  };

  const displayLabel = () => {
    if (!range?.from) return 'Selecione a data';
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, "dd 'de' MMMM, yyyy", { locale: ptBR });
    }
    return `${format(range.from, 'dd/MM', { locale: ptBR })} a ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-12 md:h-10 justify-start text-left font-normal text-base md:text-sm',
            !range?.from && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={1}
          locale={ptBR}
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}
