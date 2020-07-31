import {LevelUp} from "levelup";
import {Data} from "@ganache/utils";
import Tag from "../things/tags";
const NOTFOUND = 404;

export type Instantiable<T> = {new (...args: any[]): T};

export default class Manager<T> {
  #Type: Instantiable<T>;
  #options: {};
  protected base: LevelUp;
  constructor(base: LevelUp, type: Instantiable<T>, options?: {}) {
    this.#Type = type;
    this.#options = options;
    this.base = base;
  }
  getRaw(key: string | Buffer | Tag): Promise<Buffer> {
    if (typeof key === "string") {
      key = Data.from(key).toBuffer();
    }

    return this.base.get(key).catch(e => {
      if (e.status === NOTFOUND) return null;
      throw e;
    }) as Promise<Buffer>;
  }
  async get(key: string | Buffer) {
    const raw = await this.getRaw(key);
    if (!raw) return null;
    return new this.#Type(raw, this.#options);
  }
  set(key: Buffer, value: Buffer): Promise<void> {
    return this.base.put(key, value);
  }
  del(key: Buffer) {
    return this.base.del(key);
  }
}
