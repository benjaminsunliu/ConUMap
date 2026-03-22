/**
 * compares the values of two items
 * Returns true if a is greater than b
 */
type ComparatorFunction<T> = (a: T, b: T) => boolean;

// From: https://stackoverflow.com/questions/42919469/efficient-way-to-implement-priority-queue-in-javascript
export class PriorityQueue<T> {
  private heap: T[] = [];
  private comparator: ComparatorFunction<T>;
  private topIndex = 0;

  public constructor(comparator: ComparatorFunction<T>) {
    this.comparator = comparator;
  }

  public size() {
    return this.heap.length;
  }

  public isEmpty() {
    return this.size() == 0;
  }

  /**
   * Looks at the item at the front of the queue without removing it
   * @returns the item at the front of the queue
   */
  public peek() {
    return this.heap[this.topIndex];
  }

  /**
   * Adds items to the queue
   * @param values the items to add
   * @returns the new size of the queue
   */
  public push(...values: T[]) {
    values.forEach((value) => {
      this.heap.push(value);
      this.siftUp();
    });
    return this.size();
  }

  /**
   * Removes an item from the front of the queue
   * @returns the value at the front of the queue
   */
  public pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > this.topIndex) {
      this.swap(this.topIndex, bottom);
    }
    this.heap.pop();
    this.siftDown();
    return poppedValue;
  }

  private greatherThan(i: number, j: number) {
    return this.comparator(this.heap[i], this.heap[j]);
  }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp() {
    let node = this.size() - 1;
    while (node > this.topIndex && this.greatherThan(node, this.parent(node))) {
      this.swap(node, this.parent(node));
      node = this.parent(node);
    }
  }

  private siftDown() {
    let node = this.topIndex;
    while (
      (this.left(node) < this.size() && this.greatherThan(this.left(node), node)) ||
      (this.right(node) < this.size() && this.greatherThan(this.right(node), node))
    ) {
      let maxChild =
        this.right(node) < this.size() &&
        this.greatherThan(this.right(node), this.left(node))
          ? this.right(node)
          : this.left(node);
      this.swap(node, maxChild);
      node = maxChild;
    }
  }

  private parent = (i: number) => ((i + 1) >>> 1) - 1;
  private left = (i: number) => (i << 1) + 1;
  private right = (i: number) => (i + 1) << 1;
}
