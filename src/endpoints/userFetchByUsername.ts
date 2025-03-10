import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { User } from "../types";
import { AppContext, addCORSHeaders } from "../index"; // Import addCORSHeaders

export class UserFetchByUsername extends OpenAPIRoute {
    schema = {
        tags: ["Users"],
        summary: "Get a single User by username",
        request: {
            params: z.object({
                username: Str({ description: "User name" }),
            })
        },
        responses: {
            "200": {
                description: "Returns a user object if found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            result: z.object({
                                user: User,
                            }),
                        }),
                    },
                },
            },
            "404": {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            error: Str(),
                        }),
                    },
                },
            },
        },
    };

    async handle(ctx: AppContext): Promise<Response> {
        try {
            // Get validated data
            const data = await this.getValidatedData<typeof this.schema>();

            // Retrieve the validated query parameter
            const { username } = data.params;

            // User Fetch log
            console.log("userFetchByUsername call username = " + username);

            // Implement your own object retrieval here
            const key = 'users:username:' + username;
            let userId = await ctx.env.KV_BINDING_PETSTORE.get(key);
            let json = null;
            if (userId) {
                json = await ctx.env.KV_BINDING_PETSTORE.get('users:document:' + userId);

            }

            // @ts-ignore: check if the object exists
            if (json === null) {
                return addCORSHeaders(Response.json(
                    {
                        success: false,
                        error: "User not found",
                    },
                    {
                        status: 404,
                    },
                ));
            }

            // return the user        
            return addCORSHeaders(new Response(json, {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));

        } catch (err) {
            // In a production application, you could instead choose to retry your KV
            // read or fall back to a default code path.
            console.error(`KV returned error: ${err}`);
            return addCORSHeaders(new Response(err, { status: 500 }));
        }
    }
}
