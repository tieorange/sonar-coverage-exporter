interface RegisteredTest {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: RegisteredTest[] = [];

export function test(name: string, fn: () => void | Promise<void>): void {
  tests.push({ name, fn });
}

export async function run(): Promise<void> {
  let failures = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${name}`);
      if (error instanceof Error) {
        console.error(error.message);
        if (error.stack) {
          console.error(error.stack.split('\n').slice(1).join('\n'));
        }
      } else {
        console.error(String(error));
      }
    }
  }

  if (!tests.length) {
    console.warn('No tests were registered.');
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

export function expect<T>(actual: T) {
  return {
    toEqual(expected: T) {
      if (!deepEqual(actual, expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBe(value: T) {
      if (actual !== value) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(value)}`);
      }
    },
    toBeGreaterThan(value: number) {
      if (typeof (actual as unknown) !== 'number' || (actual as unknown as number) <= value) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be greater than ${value}`);
      }
    },
    toSatisfy(predicate: (value: T) => boolean, message?: string) {
      if (!predicate(actual)) {
        throw new Error(message ?? 'Expectation not satisfied.');
      }
    },
  };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => deepEqual(value, b[index]));
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}
