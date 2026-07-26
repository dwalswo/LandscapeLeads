import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPhoneVerification, verifyPhoneCode } from "../actions";

const ERROR_MESSAGES = {
  invalid_phone:
    "We couldn't recognize that as a valid US phone number. Update it on your profile and try again.",
  send_failed:
    "Couldn't send a verification code right now. Phone verification may not be set up yet — try again later or skip for now.",
  missing_code: "Please enter the code we sent you.",
  invalid_code: "That code didn't match. Please try again.",
};

export default async function VerifyPhone({ searchParams }) {
  const { step, error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    redirect("/account/login");
  }

  const { data: profile } = await supabase
    .from("client_profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();

  const { data: userData } = await supabase.auth.getUser();
  const isVerified = Boolean(userData?.user?.phone_confirmed_at);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-black">
          Verify Your Phone
        </h1>

        {errorMessage && (
          <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {isVerified ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-800">
              Your phone number is verified.
            </p>
            <Link
              href="/account"
              className="rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : step === "code" ? (
          <>
            <p className="mt-2 text-center text-sm text-black">
              Enter the code we texted to {profile?.phone}.
            </p>
            <form
              action={verifyPhoneCode}
              className="mt-8 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-black"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
              >
                Verify
              </button>
            </form>
            <form action={sendPhoneVerification} className="mt-3 text-center">
              <button
                type="submit"
                className="text-sm font-medium text-green-700 hover:underline"
              >
                Resend code
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-black">
              We&apos;ll text a verification code to {profile?.phone}.
            </p>
            <form
              action={sendPhoneVerification}
              className="mt-8 flex flex-col gap-4"
            >
              <button
                type="submit"
                className="rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
              >
                Send Code
              </button>
            </form>
          </>
        )}

        {!isVerified && (
          <p className="mt-4 text-center text-sm text-black">
            <Link href="/account" className="font-medium text-green-700">
              Skip for now
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
