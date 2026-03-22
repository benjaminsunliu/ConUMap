import { PriorityQueue } from "@/utils/priorityQueue";

describe("PriorityQueue", () => {
  describe("Basic Functionality (Max-Heap behavior)", () => {
    let pq: PriorityQueue<number>;

    beforeEach(() => {
      // Comparator returns true if a > b (standard Max-Heap)
      pq = new PriorityQueue<number>((a, b) => a > b);
    });

    test("should start empty", () => {
      expect(pq.isEmpty()).toBe(true);
      expect(pq.size()).toBe(0);
    });

    test("should push items and update size", () => {
      pq.push(10);
      pq.push(20);
      expect(pq.size()).toBe(2);
      expect(pq.isEmpty()).toBe(false);
    });

    test("peek should return the highest priority item without removing it", () => {
      pq.push(10, 30, 20);
      expect(pq.peek()).toBe(30);
      expect(pq.size()).toBe(3);
    });

    test("pop should return items in descending order (Max-Heap)", () => {
      pq.push(10, 50, 20, 40, 30);

      expect(pq.pop()).toBe(50);
      expect(pq.pop()).toBe(40);
      expect(pq.pop()).toBe(30);
      expect(pq.pop()).toBe(20);
      expect(pq.pop()).toBe(10);
      expect(pq.isEmpty()).toBe(true);
    });
  });

  describe("Min-Heap behavior", () => {
    test("should return items in ascending order with a min-heap comparator", () => {
      // Comparator returns true if a < b (Min-Heap)
      const pq = new PriorityQueue<number>((a, b) => a < b);
      pq.push(5, 1, 10, 3);

      expect(pq.pop()).toBe(1);
      expect(pq.pop()).toBe(3);
      expect(pq.pop()).toBe(5);
      expect(pq.pop()).toBe(10);
    });
  });

  describe("Object-based Priority", () => {
    interface Task {
      priority: number;
      name: string;
    }

    test("should handle objects based on a property", () => {
      const pq = new PriorityQueue<Task>((a, b) => a.priority > b.priority);
      pq.push({ priority: 1, name: "Low" });
      pq.push({ priority: 10, name: "Critical" });
      pq.push({ priority: 5, name: "Medium" });

      expect(pq.pop()?.name).toBe("Critical");
      expect(pq.pop()?.name).toBe("Medium");
      expect(pq.pop()?.name).toBe("Low");
    });
  });

  describe("Edge Cases", () => {
    test("should return undefined when peeking/popping an empty queue", () => {
      const pq = new PriorityQueue<number>((a, b) => a > b);
      expect(pq.peek()).toBeUndefined();
      expect(pq.pop()).toBeUndefined();
    });

    test("should handle large batches of interleaved push and pop", () => {
      const pq = new PriorityQueue<number>((a, b) => a > b);
      const values = [1, 8, 3, 9, 2, 7];

      values.forEach((v) => pq.push(v));
      expect(pq.pop()).toBe(9);

      pq.push(100);
      expect(pq.peek()).toBe(100);
      expect(pq.pop()).toBe(100);
      expect(pq.pop()).toBe(8);
    });
  });
});
