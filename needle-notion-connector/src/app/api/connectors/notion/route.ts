import { NextResponse } from "next/server";
import { fetchAccessToken } from "~/app/connectors/notion/actions";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code is required" });
  }

  try {
    const accessToken = await fetchAccessToken(code);
    const appHost = process.env.NEXT_APP_HOST ?? "";
    return NextResponse.redirect(
      appHost + `/connectors/notion?accessToken=${accessToken}`,
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message });
    }
  }
}
