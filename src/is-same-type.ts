export function isSameType(a: unknown, b: unknown): boolean {
  return (a === b) || (getType(a) === getType(b));
}

function getType(value: any): unknown {
  const type = typeof value;
  
  if (type === "object") {
    if (value === null) {
      return null;
    }
    
    return value.constructor;
  }
  
  if (type === "symbol") {
    return value;
  }
  
  return type;
}
