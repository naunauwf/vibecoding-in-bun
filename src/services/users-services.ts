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

export interface CurrentUserData {
  id: number;
  name: string;
  email: string;
  created_at: Date;
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

export async function getCurrentUserService(
  token: string
): Promise<ServiceResult<{ data: CurrentUserData }>> {
  try {
    if (!token) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    const currentUser = result[0];
    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    return {
      success: true,
      data: { data: currentUser },
      statusCode: 200,
    };
  } catch (error: any) {
    throw error;
  }
}

export async function logoutUserService(
  token: string
): Promise<ServiceResult<{ data: string }>> {
  try {
    if (!token) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const existingSession = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (existingSession.length === 0) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    await db.delete(sessions).where(eq(sessions.token, token));

    return {
      success: true,
      data: { data: "OK" },
      statusCode: 200,
    };
  } catch (error: any) {
    throw error;
  }
}
