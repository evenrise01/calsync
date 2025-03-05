import prisma from "@/app/lib/db";
import { requireUser } from "@/app/lib/hooks";
import { nylas, nylasConfig } from "@/app/lib/nylas";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// GET Route Handler for Nylas OAuth Callback
// Handles the exchange of authorization code for an access token
export async function GET(req: NextRequest) {
  // Ensure user is authenticated before processing
  const session = await requireUser();

  // Parse the incoming request URL to extract authorization code
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Validate the presence of authorization code
  if (!code) {
    return Response.json("No authorization code received from Nylas", {
      status: 400,  // Bad Request status code
    });
  }

  try {
    // Exchange authorization code for an access token using Nylas API
    const response = await nylas.auth.exchangeCodeForToken({
      clientSecret: nylasConfig.apiKey,      // Nylas API secret
      clientId: nylasConfig.clientId,        // Nylas client identifier
      redirectUri: nylasConfig.redirectUri,  // Configured redirect URI
      code: code,                            // Authorization code from Nylas
    });

    // Extract critical authentication information
    const { grantId, email } = response;

    // Update user's Nylas authentication details in the database
    // Associates the Nylas grant with the current user's account
    await prisma.user.update({
      where: {
        id: session.user?.id,  // Find the current user
      },
      data: {
        grantId: grantId,      // Unique identifier for the Nylas grant
        grantEmail: email,     // Email associated with the Nylas account
      },
    });
  } catch (error) {
    // Log any errors during the authentication process
    // Note: In production, use a proper logging mechanism
    console.log("Error, something went wrong", error);
    
    // Consider adding more robust error handling
    // Potential improvements:
    // - Return a specific error response
    // - Handle different types of authentication errors
  }

  // Redirect user to dashboard after successful authentication
  redirect("/dashboard");
}