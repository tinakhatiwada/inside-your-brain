import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
var __dirname = dirname(fileURLToPath(import.meta.url));
var CONTENT = join(__dirname, '..', 'src', 'content');
var errors = 0;
function validate(dir, requiredFields) {
  var files = readdirSync(join(CONTENT, dir)).filter(function(f) { return f.endsWith('.json'); });
  for (var file of files) {
    var data = JSON.parse(readFileSync(join(CONTENT, dir, file), 'utf8'));
    for (var field of requiredFields) {
      if (!data[field]) { console.error('  x ' + dir + '/' + file + ': missing "' + field + '"'); errors++; }
    }
    console.log('  ok ' + dir + '/' + file);
  }
}
console.log('Validating content...');
validate('regions', ['id', 'name', 'color', 'summary', 'functions', 'sources']);
validate('stages', ['id', 'order', 'name', 'summary', 'regionIds', 'description']);
validate('topics', ['id', 'name', 'summary', 'sections', 'sources']);
if (errors > 0) { console.error(errors + ' error(s).'); process.exit(1); }
else { console.log('All content valid.'); }
