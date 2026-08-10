import bcrypt from "bcryptjs";

// Password hashing, isolated in its own file so it's the one place this
// project touches a credential directly.
//
// bcryptjs, not the native `bcrypt` package: the native build compiles a C++
// addon, which is a routine source of "works on my machine, fails on Vercel's
// build image" failures on serverless targets. bcryptjs is pure JS — slower
// per hash, but login/signup are low-frequency enough that the difference is
// unmeasurable, and it never fights the deploy target.

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
