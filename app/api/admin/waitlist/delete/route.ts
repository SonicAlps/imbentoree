import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          error: "Missing pre-order ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: "Admin password is required.",
        },
        {
          status: 400,
        }
      );
    }

    const deletePassword =
      process.env.WAITLIST_DELETE_PASSWORD;

    if (!deletePassword) {
      console.error(
        "WAITLIST_DELETE_PASSWORD is missing."
      );

      return NextResponse.json(
        {
          error: "Delete password is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (password !== deletePassword) {
      return NextResponse.json(
        {
          error: "Incorrect admin password.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

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
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error(
        "SUPABASE DELETE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error: "No matching pre-order was found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: data[0],
    });

  } catch (error) {
    console.error(
      "DELETE WAITLIST API ERROR:",
      error
    );

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