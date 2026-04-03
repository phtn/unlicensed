'use client'

import {
  DateField,
  DateRangePicker,
  FieldError,
  Label,
  RangeCalendar,
} from '@/lib/heroui'
import type {CalendarDate} from '@internationalized/date'
import type {RangeValue} from '@react-types/shared'
import type {ReactNode} from 'react'

interface DateRangeFilterProps {
  ariaLabel?: string
  className?: string
  endName?: string
  errorMessage?: ReactNode
  isInvalid?: boolean
  label?: string
  onChange?: (value: RangeValue<CalendarDate> | null) => void
  startName?: string
  value?: RangeValue<CalendarDate> | null
}

export const DateRangeFilter = ({
  ariaLabel,
  className = 'w-72',
  endName = 'endDate',
  errorMessage,
  isInvalid,
  label,
  onChange,
  startName = 'startDate',
  value,
}: DateRangeFilterProps) => {
  const accessibleLabel = label ?? ariaLabel ?? 'Date range'

  return (
    <DateRangePicker
      aria-label={label ? undefined : accessibleLabel}
      className={className}
      endName={endName}
      isInvalid={isInvalid}
      onChange={onChange}
      shouldCloseOnSelect
      startName={startName}
      value={value}>
      {label ? <Label>{label}</Label> : null}
      <DateField.Group
        fullWidth
        className='h-8 min-h-8 rounded-sm border border-foreground/10 bg-background text-foreground/80 shadow-none'>
        <DateField.InputContainer className='min-w-0 flex-1'>
          <DateField.Input slot='start' className='text-xs font-ios'>
            {(segment) => (
              <DateField.Segment
                segment={segment}
                className='text-xs font-ios data-[placeholder=true]:text-foreground/40'
              />
            )}
          </DateField.Input>
          <DateRangePicker.RangeSeparator className='px-1 text-foreground/40' />
          <DateField.Input slot='end' className='text-xs font-ios'>
            {(segment) => (
              <DateField.Segment
                segment={segment}
                className='text-xs font-ios data-[placeholder=true]:text-foreground/40'
              />
            )}
          </DateField.Input>
        </DateField.InputContainer>
        <DateField.Suffix>
          <DateRangePicker.Trigger className='h-8 w-8 min-w-8 rounded-sm text-foreground/60'>
            <DateRangePicker.TriggerIndicator className='text-current' />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {errorMessage ? (
        <FieldError className='pt-1 text-xs'>{errorMessage}</FieldError>
      ) : null}
      <DateRangePicker.Popover className='p-0'>
        <RangeCalendar aria-label={accessibleLabel} className='bg-background'>
          <RangeCalendar.Header>
            <RangeCalendar.YearPickerTrigger>
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <RangeCalendar.NavButton slot='previous' />
            <RangeCalendar.NavButton slot='next' />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
          <RangeCalendar.YearPickerGrid>
            <RangeCalendar.YearPickerGridBody>
              {({year}) => <RangeCalendar.YearPickerCell year={year} />}
            </RangeCalendar.YearPickerGridBody>
          </RangeCalendar.YearPickerGrid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  )
}
