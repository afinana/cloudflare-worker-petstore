import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { User } from "../types";
import { AppContext, addCORSHeaders } from "../index";

export class UserList extends OpenAPIRoute {
    schema = {
        tags: ["Users"],
        summary: "List Users",
        request: {
            query: z.object({
                page: Num({
                    description: "Page number",
                    default: 0,
                    required: false
                }),
                isCompleted: Bool({
                    description: "Filter by isCompleted flag ",
                    required: false,
                }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a list of users",
                content: {
                    "application/json": {
                        schema: z.object({
                            series: z.object({
                                collection: z.object({
                                    users: User.array(),
                                }),
                            }),
                        }),
                    },
                },
            },
        },
    };

    async handle(ctx: AppContext): Promise<Response> {
        // Get validated data
        const data = await this.getValidatedData<typeof this.schema>();

        // Retrieve the validated parameters
        const { page, isCompleted } = data.query;

        // User List call
        console.log("userList call .isCompleted=" + isCompleted + ", page= " + JSON.stringify(page));

        const limit = 100; // Define the limit of items per page
        const cursorPage = page ? page * limit : 0;

        try {
            let cursor: string | undefined = undefined;
            const users = [];
            let totalItems = 0;

            do {
                const result = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `users:document:`, limit, cursor });
                cursor = result.cursor;  // Continue pagination if cursor exists

                for (const key of result.keys) {
                    if (totalItems >= cursorPage && totalItems < cursorPage + limit) {
                        const user = await ctx.env.KV_BINDING_PETSTORE.get(key.name);
                        if (user) {
                            users.push(JSON.parse(user));
                        }
                    }
                    totalItems++;
                }
            } while (cursor && totalItems < cursorPage + limit);

            // Return the list of users
            return addCORSHeaders(new Response(
                JSON.stringify({
                    collection: users
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                },
            ));

        } catch (err) {
            console.error(`KV returned error: ${err}`);
            return addCORSHeaders(new Response(
                JSON.stringify({ error: err.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            ));
        }
    }
}
