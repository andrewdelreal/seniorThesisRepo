import ApiError from "../errors/ApiError";
import jwt from 'jsonwebtoken';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';

const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;
const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);
const APP_JWT_SECRET: string = process.env.APP_JWT_SECRET!;

export async function verifyLogin(
    token: string
) {
    const payload: TokenPayload | undefined = await verifyGoogleToken(token); // Google verigies credentials
    if (!payload) {
        throw new ApiError(
            401,
            "AUTH_INVALID_TOKEN",
            "Invalid token"
        );
    }
    
    const sub: string = payload.sub; // Google’s unique user ID
    if (!sub) {
        throw new ApiError(
            400,
            "AUTH_MISSING_USER_ID",
            "Missing user ID"
        );
    }

    const appToken: string = jwt.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: '7d' });  // create token valid for 7 days

    // Send user token that is valid for 7days
    return({ appToken });
}

async function verifyGoogleToken(token: string) {
  const ticket: LoginTicket = await client.verifyIdToken({ // verify credentials with Google
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}
