import { DateTime, Str } from "chanfana";
import { z } from "zod";

export const Category = z.object({
    id: z.number(),
    name: Str(),
});

export const Tag = z.object({
    id: z.number(),
    name: Str(),
});

export const Pet = z.object({
    id: z.number(),
    category: Category,
    name: Str(),
    photoUrls: z.array(z.string().url()),
    tags: z.array(Tag),
    status: z.enum(["available", "pending", "sold"]),
});

export const User = z.object({
    id: z.number(),
    username: Str().email(),
    firstName: Str(),
    lastName: Str(),
    email: Str().email(),
    password: Str(),
    phone: Str(),
    userStatus: z.number(),
});
