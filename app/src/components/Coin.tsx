import { Icon } from './Icon'

export function Coin({ value }: { value: number | string }) {
  return (
    <span className="coin">
      <Icon name="paid" size={14} fill />
      {value}
    </span>
  )
}
