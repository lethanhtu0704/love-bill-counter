"use server";

export async function validatePin(pin: string): Promise<boolean> {
  return pin === process.env.APP_SECRET_PIN;
}
