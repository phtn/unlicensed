'use client'

import {DateField, DateRangePicker, RangeCalendar} from '@heroui/react'
import {parseDate} from '@internationalized/date'

interface DateRangePickerProps {
  endName?: string
  startName?: string
  label?: string
  startDate?: string
  endDate?: string
  onStartDateChange?: (date: string) => void
  onEndDateChange?: (date: string) => void
}

export const DateRangePickerComponent = ({
  endName,
  startName,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) => {
  const value =
    startDate && endDate
      ? {start: parseDate(startDate), end: parseDate(endDate)}
      : null

  const handleChange = (
    range: {start: {toString(): string}; end: {toString(): string}} | null,
  ) => {
    onStartDateChange?.(range ? range.start.toString() : '')
    onEndDateChange?.(range ? range.end.toString() : '')
  }

  return (
    <DateRangePicker
      className='h-12 rounded-xs'
      endName={endName ?? 'endDate'}
      startName={startName ?? 'startDate'}
      value={value}
      onChange={handleChange}>
      <DateField.Group fullWidth className='h-12 rounded-xs'>
        <DateField.Input slot='start'>
          {(segment) => (
            <DateField.Segment
              segment={segment}
              className='text-foreground/50'
            />
          )}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot='end'>
          {(segment) => (
            <DateField.Segment
              segment={segment}
              className='text-foreground/50'
            />
          )}
        </DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger>
            <DateRangePicker.TriggerIndicator className='text-foreground/50' />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label='Trip dates' className='text-foreground'>
          <RangeCalendar.Header>
            <RangeCalendar.YearPickerTrigger>
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <RangeCalendar.NavButton
              slot='previous'
              className='text-foreground/50'
            />
            <RangeCalendar.NavButton
              slot='next'
              className='text-foreground/50'
            />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell className='text-foreground/60'>
                  {day}
                </RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => (
                <RangeCalendar.Cell
                  date={date}
                  className='text-foreground/50'
                />
              )}
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
