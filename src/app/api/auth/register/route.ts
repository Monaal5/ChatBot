import { supabase } from "@/lib/db/supabase";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // 1. Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Only proceed if the error is 'no rows found' (i.e., user doesn't exist)
    if (selectError && selectError.code !== "PGRST116") {
      return NextResponse.json(
        { error: selectError.message },
        { status: 500 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert new user
    const { data, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          role,
          password_hash: hashedPassword, // ✅ Correct field
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[REGISTRATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}