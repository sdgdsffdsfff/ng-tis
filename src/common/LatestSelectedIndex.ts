import {CurrentCollection} from "./basic.form.component";

const maxQueueSize = 8;

export class SelectedIndex {
  public timestamp: number;

  constructor(public name: string) {
    this.timestamp = (new Date()).getTime();
  }
}

export class LatestSelectedIndex {
  private _queue: Array<SelectedIndex> = [];

  public add(i: SelectedIndex): void {

    let find = this._queue.find((r) => r.name === i.name);
    if (find) {
      find.timestamp = i.timestamp;
      this._sort();
      return;
    }

    if (this._queue.length < maxQueueSize) {
      this._queue.push(i);
      this._sort();
      return;
    }

    let min = this._queue[0];
    let minIndex = 0;

    let s: SelectedIndex;
    for (let j = 0; j < this._queue.length; j++) {
      s = this._queue[j];
      // if (s.name === i.name) {
      //   s.count++;
      //   return;
      // }
      if (min.timestamp > s.timestamp) {
        min = s;
        minIndex = j;
      }
    }
    this._queue[minIndex] = i;
    // this._queue.sort((a, b) => (b.timestamp - a.timestamp));
    this._sort();
    // console.log(this._queue);
  }

  public addIfNotContain(idx: CurrentCollection): void {

    let find = this._queue.find((r) => {
      return r.name === idx.name;
    });

    if (find) {
      return;
    }

    this.add(new SelectedIndex(idx.name));
  }

  private _sort(): void {
    this._queue.sort((a, b) => (b.timestamp - a.timestamp));
  }

  public get popularLatestSelected(): string[] {
    return this._queue.map((r) => r.name);
  }

}


