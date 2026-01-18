declare module "dynamic-time-warping" {
  export default class DynamicTimeWarping<T> {
    constructor(
      seq1: T[],
      seq2: T[],
      distanceFunction: (a: T, b: T) => number
    );
    getDistance(): number;
    getPath(): Array<[number, number]>;
  }
}
