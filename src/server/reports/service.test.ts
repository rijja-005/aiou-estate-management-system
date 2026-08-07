import { describe,expect,it } from 'vitest';import { csvCell,toCsv } from './service';
describe('report export formatting',()=>{it('escapes spreadsheet-safe CSV fields',()=>{expect(csvCell('A, "quoted"')).toBe('"A, ""quoted"""');expect(toCsv([{name:'Estate, Office',count:2}])).toBe('name,count\n"Estate, Office",2\n');});it('returns an empty export for no rows',()=>expect(toCsv([])).toBe(''));});
