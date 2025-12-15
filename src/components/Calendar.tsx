import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

type CalendarProps = {
  label?: string;
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
};

export default function Calendar(props: CalendarProps) {
  const [internalValue, setInternalValue] = React.useState<Dayjs | null>(dayjs());
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const value = isControlled ? (props.value ?? null) : internalValue;

  const handleChange = (newValue: Dayjs | null) => {
    if (!isControlled) setInternalValue(newValue);
    props.onChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={props.label ?? 'Wybierz datę'}
        value={value}
        onChange={handleChange}
        minDate={props.minDate ?? dayjs()}
        maxDate={props.maxDate ?? dayjs().add(1, 'month')}
        slotProps={{
          textField: {
            required: props.required,
            error: props.error,
            helperText: props.error ? (props.helperText ?? '') : undefined,
            size: 'small'
          }
        }}
      />
    </LocalizationProvider>
  );
}
