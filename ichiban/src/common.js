//
// Functions
//

export function clone (o) {
  return JSON.parse(JSON.stringify(o))
}

export function safeJSONStringify (o) {
  const getCircularReplacer = () => {
    const seen = new WeakSet;
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
  return JSON.stringify(o, getCircularReplacer(), 2);
}