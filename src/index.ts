import { parse } from 'flow-parser';
import { readFile } from 'fs';
import { transform } from './transformers';

readFile(process.argv[2], {}, (err, data) => {
  if (err) {
    throw err;
  }

  const code = data.toString();

  if (process.argv[3] === '--dump') {
    const ast = parse(code);
    process.stdout.write(JSON.stringify(ast) + '\n');
  } else {
    console.log(transform(code));
  }
});
