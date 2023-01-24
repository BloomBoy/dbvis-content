import hasProperty from "./hasProperty";

export default function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return hasProperty(value, 'then') && typeof value.then === 'function';
}