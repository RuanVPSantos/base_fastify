import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
}

export class Auth {
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, SALT_ROUNDS);
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    static generateToken(id: number, role: string = 'user'): string {
        return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '48h' });
    }

    static verifyJwt(token: string): { id: number, role: string } {
        return jwt.verify(token, JWT_SECRET) as { id: number, role: string };
    }
}
