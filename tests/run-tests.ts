import './sourceRowParser.test';
import { run } from './testing';

run().catch((error) => {
  console.error('Unexpected error while running tests.');
  console.error(error);
  process.exitCode = 1;
});
