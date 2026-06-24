import fs from 'fs';

const TAX_RATE = 0.1;
const MAX_PRICE = 100000;

/**
 * Add two numbers together.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function add(a, b) {
  return a + b;
}

/**
 * Calculate tax for a given price.
 * @param {number} price
 * @returns {number}
 */
function calculateTax(price) {
  if (price > MAX_PRICE) {
    throw new Error("Price exceeds maximum");
  }
  return price * TAX_RATE;
}

/**
 * Read a file and return its contents.
 * @param {string} filepath
 * @returns {string}
 */
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * A well-structured data processor.
 */
class DataProcessor {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  /**
   * Process the data.
   * @returns {Array}
   */
  process() {
    return this.data.filter((item) => item !== null);
  }
}
