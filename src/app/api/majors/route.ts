import { NextResponse } from "next/server";
import { majors } from "@/lib/mock/majors";

export function GET() {
  return NextResponse.json(majors);
}
