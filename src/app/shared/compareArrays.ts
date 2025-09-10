export function haveSameElements<T>(a: T[], b: T[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);

  if (setA.size !== setB.size) return false;

  for (const val of setA) {
    if (!setB.has(val)) return false;
  }
  return true;
}

export default haveSameElements;
