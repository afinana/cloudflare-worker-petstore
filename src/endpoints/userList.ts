import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { User } from "../types";
import { env } from "process";
import { AppContext } from "../index";

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

        // Fetch users by statuses
        const users = [];
        try {
            const limit = 100; // Define the limit of items per page
            const cursor = page ? page * limit : 0; // Calculate the cursor based on the page number

            const documents = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `users:document:`, limit, cursor });
            for (const key of documents.keys) {
                const user = await ctx.env.KV_BINDING_PETSTORE.get(key.name);
                if (user) {
                    users.push(JSON.parse(user));
                }
            }

            // Return the list of users
            return Response.json(
                {
                    result: users
                },
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                },
            );

        } catch (err) {
            console.error(`KV returned error: ${err}`);
            return new Response(
                JSON.stringify({ error: err.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    }
}

