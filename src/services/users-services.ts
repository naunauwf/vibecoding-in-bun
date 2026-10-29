import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export async function registerUserService(
  input: RegisterUserInput
): Promise<ServiceResult<{ data: string }>> {
  try {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        error: "Email sudah terdaftar",
        statusCode: 400,
      };
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return {
      success: true,
      data: { data: "OK" },
      statusCode: 201,
    };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        error: "Email sudah terdaftar",
        statusCode: 400,
      };
    }
    throw error;
  }
}
