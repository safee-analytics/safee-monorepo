export class Timer {
  marks: { name: string; time: bigint }[];

  constructor() {
    this.marks = [{ name: "", time: process.hrtime.bigint() }];
  }

  mark(name: string) {
    this.marks.push({ name, time: process.hrtime.bigint() });
  }

  summarize() {
    const summary = [];
    for (let i = 0; i < this.marks.length - 1; ++i) {
      summary.push({
        name: this.marks[i + 1].name,
        durationNs: (this.marks[i + 1].time - this.marks[i].time).toString(),
        durationMs: ((this.marks[i + 1].time - this.marks[i].time) / 1_000_000n).toString(),
      });
    }
    return summary;
  }
}
