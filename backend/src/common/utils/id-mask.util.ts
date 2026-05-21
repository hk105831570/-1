/**
 * 身份证号打码: 保留前4位和后4位，中间用*替代
 * 例如: 3201**********1234
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 8) {
    return idNumber;
  }
  const prefix = idNumber.substring(0, 4);
  const suffix = idNumber.substring(idNumber.length - 4);
  const maskLength = idNumber.length - 8;
  return prefix + '*'.repeat(maskLength) + suffix;
}
