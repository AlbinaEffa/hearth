import { Icon } from './Icon'

// Two currencies: 'adult' (взрослые) and 'child' (детские). Same gold coin,
// distinguished by a small letter tag (в / д).
export function Coin({ value, cur }: { value: number | string; cur?: 'child' | 'adult' }) {
  return (
    <span className="coin" title={cur === 'child' ? 'детские монеты' : cur === 'adult' ? 'взрослые монеты' : 'монеты'}>
      <Icon name="paid" size={14} fill />
      {value}
      {cur && <small style={{ fontSize: 9, opacity: 0.7, marginLeft: 1 }}>{cur === 'child' ? 'д' : 'в'}</small>}
    </span>
  )
}
