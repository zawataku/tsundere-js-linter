import fs from 'fs';
import path from 'path';
import crypto from 'crypto'; // unused!

// TODO: support more file types
// FIXME: this function is way too messy

function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] != null) {
      if (data[i] > 42) {
        if (typeof data[i] == 'number') {
          if (data[i] < 99999) {
            if (data[i] !== 0) { // T010: deep nesting
              result.push(data[i]);
            }
          }
        }
      }
    }
  }
  console.log("processed:", result.length);
  return result;
}

function calculateTax(price, taxRate) {
  if (price > 99999) {
    console.log("expensive item!");
    try {
      return price * taxRate;
    } catch (e) {
    }
  }
  return price * taxRate;
}

class DataProcessor {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  run() {
    return this.data;
  }

  execute() {
    return this.data;
  }

  veryLongMethodThatDoesEverything() {
    /** This method tries to do way too much. */
    const a = 1;
    const b = 2;
    const c = 3;
    const d = 4;
    const e = 5;
    const f = 6;
    const g = 7;
    const h = 8;
    const i = 9;
    const j = 10;
    const k = 11;
    const l = 12;
    const m = 13;
    const n = 14;
    const o = 15;
    const p = 16;
    const q = 17;
    const r = 18;
    const s = 19;
    const t = 20;
    const u = 21;
    const v = 22;
    const w = 23;
    const x = 24;
    const y = 25;
    const z = 26;
    const aa = 27;
    const bb = 28;
    const cc = 29;
    const dd = 30;
    const ee = 31;
    const ff = 32;
    const gg = 33;
    const hh = 34;
    const ii = 35;
    const jj = 36;
    const kk = 37;
    const ll = 38;
    const mm = 39;
    const nn = 40;
    const oo = 41;
    const pp = 42;
    const qq = 43;
    const rr = 44;
    const ss = 45;
    const tt = 46;
    const uu = 47;
    const vv = 48;
    const ww = 49;
    const xx = 50;
    const yy = 51;
    return a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p+q+r+s+t+u+v+w+x+y+z+aa+bb+cc+dd+ee+ff+gg+hh+ii+jj+kk+ll+mm+nn+oo+pp+qq+rr+ss+tt+uu+vv+ww+xx+yy;
  }
}

// This line is intentionally very very very very very very very very very very very very very very very very very very very very very long to trigger line length check T002
