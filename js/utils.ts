export function reverseForEach<T>(arr: T[], cb: (node: T) => boolean | void) {
  arr.findLast(cb);
}

export function swap<T>(arr: T[], idx1: number, idx2: number) {
  [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
}

export function arrLast<T>(arr: T[]): T {
  return arr[arr.length - 1];
}
