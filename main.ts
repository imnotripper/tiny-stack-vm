import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output', E = new TextEncoder();
for (const id of readdirSync(I).sort()) {
  const p = readFileSync(join(I, id, 'program.bin')), q = readFileSync(join(I, id, 'input.bin'));
  const n = p.length, D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536);
  let sp = 0, cp = 0, ol = 0, ip = 0, pc = 0, st = 0, code = 0;
  run: for (;;) {
    if (st === 1e6) { code = 10; break; }
    if (pc < 0 || pc >= n) { code = 9; break; }
    const op = p[pc];
    if (!(op <= 7 || (op >= 16 && op <= 30) || (op >= 32 && op <= 34) || (op >= 48 && op <= 52) || op === 64 || op === 65 || (op >= 80 && op <= 83))) { code = 5; break; }
    const imm = op === 1 ? 1 : op === 2 ? 4 : op >= 48 && op <= 51 ? 2 : 0;
    if (pc + imm >= n) { code = 9; break; }
    let pops = 0, push = 0;
    if (op === 1 || op === 2 || op === 82) push = 1;
    else if (op === 4) { pops = 1; push = 2; }
    else if (op === 5) { pops = 2; push = 2; }
    else if (op === 6) { pops = 2; push = 3; }
    else if (op === 7) { pops = 3; push = 3; }
    else if ((op >= 16 && op <= 30) || (op >= 32 && op <= 34)) { if (op === 23 || op === 27) { pops = 1; push = 1; } else { pops = 2; push = 1; } }
    else if (op === 64) { pops = 1; push = 1; }
    else if (op === 3 || op === 49 || op === 50 || op === 80 || op === 81 || op === 83) pops = 1;
    else if (op === 65) pops = 2;
    if (sp < pops) { code = 2; break; }
    if (sp - pops + push > 256) { code = 3; break; }
    st++;
    const nx = pc + 1 + imm;
    pc = nx;
    switch (op) {
      case 0: break run;
      case 1: D[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2: D[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp - 1]; sp++; break;
      case 5: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 6: D[sp] = D[sp - 2]; sp++; break;
      case 7: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 23: D[sp - 1] = -D[sp - 1] | 0; break;
      case 27: D[sp - 1] = ~D[sp - 1]; break;
      case 48: case 49: case 50: {
        const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 48) { const v = D[--sp]; take = op === 49 ? v === 0 : v !== 0; }
        if (take) pc = nx + rel;
        break;
      }
      case 51:
        if (cp === 64) { code = 7; break run; }
        C[cp++] = nx; pc = p[nx - 2] | (p[nx - 1] << 8); break;
      case 52:
        if (cp === 0) { code = 8; break run; }
        pc = C[--cp]; break;
      case 64: {
        const a = D[sp - 1];
        if (a < 0 || a >= 256) { code = 6; break run; }
        D[sp - 1] = M[a]; break;
      }
      case 65: {
        const a = D[sp - 1], v = D[sp - 2];
        if (a < 0 || a >= 256) { code = 6; break run; }
        sp -= 2; M[a] = v; break;
      }
      case 80: {
        const b = E.encode(String(D[sp - 1]));
        if (ol + b.length > 65536) { code = 11; break run; }
        sp--; o.set(b, ol); ol += b.length; break;
      }
      case 81:
        if (ol + 1 > 65536) { code = 11; break run; }
        o[ol++] = D[--sp] & 255; break;
      case 82: D[sp++] = ip < q.length ? q[ip++] : -1; break;
      case 83: code = D[--sp] & 255; break run;
      default: {
        const b = D[sp - 1], a = D[sp - 2];
        let r = 0;
        if (op === 16) r = (a + b) | 0;
        else if (op === 17) r = (a - b) | 0;
        else if (op === 18) r = Math.imul(a, b);
        else if (op === 19) { if (!b) { code = 4; break run; } r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (op === 20) { if (!b) { code = 4; break run; } r = b === -1 ? 0 : (a % b) | 0; }
        else if (op === 21) { if (!b) { code = 4; break run; } r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (op === 22) { if (!b) { code = 4; break run; } r = ((a >>> 0) % (b >>> 0)) | 0; }
        else if (op === 24) r = a & b;
        else if (op === 25) r = a | b;
        else if (op === 26) r = a ^ b;
        else if (op === 28) r = a << (b & 31);
        else if (op === 29) r = a >> (b & 31);
        else if (op === 30) r = (a >>> (b & 31)) | 0;
        else if (op === 32) r = a === b ? 1 : 0;
        else if (op === 33) r = a < b ? 1 : 0;
        else if (op === 34) r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2; D[sp++] = r;
      }
    }
  }
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), o.subarray(0, ol));
  writeFileSync(join(O, id, 'exit.txt'), code + '\n');
}
