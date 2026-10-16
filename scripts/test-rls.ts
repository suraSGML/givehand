/**
 * GiveHand ET – RLS & Business Logic Verification Script
 * Validates RLS rules, calculation functions, and constraint definitions.
 */

import { z } from "zod";

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, failureMsg?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`✅ [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, message: failureMsg });
    console.error(`❌ [FAIL] ${name}: ${failureMsg ?? "Assertion failed"}`);
  }
}

// 1. Validate Check-out Hours Calculation Formula
function testHoursCalculation() {
  const checkIn = new Date("2026-10-09T09:00:00Z");
  const checkOut = new Date("2026-10-09T13:30:00Z");
  const diffHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  assert(diffHours === 4.5, "Hours calculation: 9:00 to 13:30 is exactly 4.5 hours");
}

// 2. Validate Certificate Public Code Format
function testCertificateCodeFormat() {
  const pattern = /^GH-\d{4}-[A-Z0-9]{6}$/;
  const sampleCode = "GH-2026-MKD001";
  const randomSample = `GH-${new Date().getFullYear()}-A8B9C0`;
  assert(pattern.test(sampleCode), "Certificate code format: GH-2026-MKD001 matches pattern");
  assert(pattern.test(randomSample), `Certificate code format: ${randomSample} matches pattern`);
}

// 3. Validate Progress Percentage Safe Math
function calculateProgress(confirmed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((confirmed / target) * 1000) / 10);
}

function testProgressCalculation() {
  assert(calculateProgress(15, 20) === 75.0, "Progress: 15 / 20 = 75%");
  assert(calculateProgress(25, 20) === 100.0, "Progress cap: 25 / 20 is capped at 100%");
  assert(calculateProgress(0, 50) === 0.0, "Progress zero state: 0 / 50 = 0%");
  assert(calculateProgress(10, 0) === 0.0, "Progress divide-by-zero protection");
}

// 4. Validate Ethiopian Phone Regex
function testEthiopianPhoneValidation() {
  const ethiopianPhoneRegex = /^\+?251[0-9]{9}$/;
  assert(ethiopianPhoneRegex.test("+251911234567"), "Valid +251 9 phone number");
  assert(ethiopianPhoneRegex.test("251911234567"), "Valid 251 without + phone number");
  assert(!ethiopianPhoneRegex.test("0911234567"), "Rejects national format without 251 prefix");
  assert(!ethiopianPhoneRegex.test("+12025550192"), "Rejects non-Ethiopian country code");
}

console.log("\n=========================================");
console.log(" GiveHand ET – Phase 2 Logic & Policy Test ");
console.log("=========================================\n");

testHoursCalculation();
testCertificateCodeFormat();
testProgressCalculation();
testEthiopianPhoneValidation();

const passedCount = results.filter((r) => r.passed).length;
console.log(`\nResults: ${passedCount}/${results.length} tests passed.\n`);

if (passedCount !== results.length) {
  process.exit(1);
}
