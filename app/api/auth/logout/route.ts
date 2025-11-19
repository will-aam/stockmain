import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Apaga o cookie definindo uma data de expiração no passado
  cookies().delete("authToken");

  return NextResponse.json({ success: true });
}
