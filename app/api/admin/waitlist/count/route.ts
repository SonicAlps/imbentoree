import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PREORDER_LIMIT = 15;

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          error: "Server configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { count, error } = await supabaseAdmin
      .from("waitlist")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (error) {
      console.error("COUNT ERROR:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const total = count ?? 0;

    return NextResponse.json({
      count: total,
      limit: PREORDER_LIMIT,
      remaining: Math.max(
        PREORDER_LIMIT - total,
        0
      ),
      full: total >= PREORDER_LIMIT,
    });
  } catch (error) {
    console.error("COUNT API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}