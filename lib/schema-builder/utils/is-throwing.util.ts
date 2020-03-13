export function isThrowing(func: () => unknown) {
  try {
    func();
    return false;
  } catch {
    return true;
  }
}
