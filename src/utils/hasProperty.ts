export default function hasProperty<Key extends string | number | symbol>(value: unknown, property: Key): value is { [key in typeof property]: unknown } {
  return typeof value === 'object' && value !== null && property in value;
}