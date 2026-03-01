import {describe, expect, test} from 'bun:test'
import {act} from 'react'
import {render, screen} from './test-utils'
import {Stepper} from '@/app/lobby/(store)/deals/components/stepper'

describe('Stepper', () => {
  test('renders current value', () => {
    render(
      <Stepper
        value={3}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('has accessible decrement button', () => {
    const onDecrement = () => {}
    render(
      <Stepper
        value={1}
        max={5}
        onIncrement={() => {}}
        onDecrement={onDecrement}
        isComplete={false}
      />,
    )
    const decBtn = screen.getByRole('button', {name: /decrease quantity/i})
    expect(decBtn).toBeInTheDocument()
  })

  test('has accessible increment button', () => {
    render(
      <Stepper
        value={0}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    const incBtn = screen.getByRole('button', {name: /increase quantity/i})
    expect(incBtn).toBeInTheDocument()
  })

  test('calls onIncrement when increment pressed', () => {
    let called = false
    const onIncrement = () => {
      called = true
    }
    render(
      <Stepper
        value={0}
        max={5}
        onIncrement={onIncrement}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    const incBtn = screen.getByRole('button', {name: /increase quantity/i})
    act(() => {
      incBtn.click()
    })
    expect(called).toBe(true)
  })

  test('calls onDecrement when decrement pressed', async () => {
    const calls: number[] = []
    const onDecrement = () => calls.push(1)
    render(
      <Stepper
        value={2}
        max={5}
        onIncrement={() => {}}
        onDecrement={onDecrement}
        isComplete={false}
      />,
    )
    const decBtn = screen.getByRole('button', {name: /decrease quantity/i})
    act(() => {
      decBtn.click()
    })
    expect(calls).toHaveLength(1)
  })

  test('decrement disabled when value at min', () => {
    render(
      <Stepper
        value={0}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    const decBtn = screen.getByRole('button', {name: /decrease quantity/i})
    expect(decBtn).toBeDisabled()
  })

  test('increment disabled when value at max', () => {
    render(
      <Stepper
        value={5}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    const incBtn = screen.getByRole('button', {name: /increase quantity/i})
    expect(incBtn).toBeDisabled()
  })

  test('increment disabled when isComplete', () => {
    render(
      <Stepper
        value={3}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={true}
      />,
    )
    const incBtn = screen.getByRole('button', {name: /increase quantity/i})
    expect(incBtn).toBeDisabled()
  })

  test('respects custom min', () => {
    render(
      <Stepper
        value={1}
        min={1}
        max={5}
        onIncrement={() => {}}
        onDecrement={() => {}}
        isComplete={false}
      />,
    )
    const decBtn = screen.getByRole('button', {name: /decrease quantity/i})
    expect(decBtn).toBeDisabled()
  })
})
