import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
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

export async function loginUserService(
  input: LoginUserInput
): Promise<ServiceResult<{ data: string }>> {
  try {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    const user = userList[0];
    if (!user) {
      return {
        success: false,
        error: "Email atau password salah",
        statusCode: 400,
      };
    }

    const isPasswordValid = await Bun.password.verify(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Email atau password salah",
        statusCode: 400,
      };
    }

    const token = crypto.randomUUID();

    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return {
      success: true,
      data: { data: token },
      statusCode: 200,
    };
  } catch (error: any) {
    throw error;
  }
}
