import { Auth } from "../../utils/auth";
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare module 'fastify' {
    interface FastifyRequest {
        user?: { id: number; admin: boolean };
    }
}

export const isAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return reply.status(401).send({ message: 'Authorization token is missing' });
        }

        const { id, admin } = Auth.verifyJwt(token);
        req.user = { id, admin };
    } catch (error) {
        return reply.status(401).send({ message: 'Invalid token' });
    }
};

export const activeAssinature = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!req.user?.id) {
            return reply.status(401).send({ message: 'User not authenticated' });
        }

        // Buscar o usuário e sua assinatura ativa
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                customer: {
                    include: {
                        subscriptions: {
                            where: {
                                status: 'active'
                            }
                        }
                    }
                }
            }
        });

        if (!user?.customer) {
            return reply.status(403).send({ message: 'Customer not found' });
        }

        const hasActiveSubscription = user.customer.subscriptions.length > 0;
        
        if (!hasActiveSubscription) {
            return reply.status(403).send({ message: 'Active subscription required' });
        }

    } catch (error) {
        return reply.status(500).send({ message: 'Error checking subscription status' });
    }
};

export const isAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!req.user?.admin) {
            return reply.status(403).send({ message: 'Admin access required' });
        }
    } catch (error) {
        return reply.status(500).send({ message: 'Error checking admin status' });
    }
};
