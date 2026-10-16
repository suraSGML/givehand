import QRCode from "qrcode";

/**
 * Generate a high-resolution base64 PNG Data URL for a QR code.
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 320,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || "#0f172a",
        light: options?.color?.light || "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("Failed to generate QR Code data URL:", error);
    return "";
  }
}

/**
 * Create a standardized check-in token payload.
 * Format: GHV-<unique_random_id>
 */
export function generateCheckInToken(applicationId: string): string {
  const shortId = applicationId.replace(/-/g, "").substring(0, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `GHV-${shortId}-${timestamp}`;
}
