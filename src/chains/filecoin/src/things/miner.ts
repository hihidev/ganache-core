import { SerializableLiteral } from "./serializableliteral";

interface MinerConfig {
  type: string;
}

class Miner extends SerializableLiteral<MinerConfig>  {
  get config() {
    return {
      defaultValue: (literal) => {
        return literal || "t01000";
      }
    }
  };
}

export default Miner;