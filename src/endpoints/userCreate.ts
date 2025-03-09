import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { User } from "../types";
import { env } from "process";
import { AppContext } from "../index";

export class UserCreate extends OpenAPIRoute {
    schema = {
        tags: ["Users"],
        summary: "Create a new User",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: User,
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Returns the created user",
                content: {
                    "application/json": {
                        schema: z.object({
                            series: z.object({
                                success: Bool(),
                                result: z.object({
                                    user: User,
                                }),
                            }),
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

            // Retrieve the validated request body
            const userToCreate = data.body;
            const json = JSON.stringify(userToCreate);

            // User Create call
            console.log("userCreate call json = " + json);

            // Implement your own object insertion here
            const key = 'users:document:' + userToCreate.id.toString();
            let value = await ctx.env.KV_BINDING_PETSTORE.put(key, json);
            if (value === null) {
                return new Response("Error saving json", { status: 500 });
            }

            const keyUsername = 'users:username:' + userToCreate.username;
            value = await ctx.env.KV_BINDING_PETSTORE.put(keyUsername, userToCreate.id.toString());
            if (value === null) {
                return new Response("Error saving username index", { status: 500 });
            }
            // return the user document
            return new Response(json, {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            // In a production application, you could instead choose to retry your KV
            // read or fall back to a default code path.
            console.error(`KV returned error: ${err}`);
            return new Response(err, { status: 500 });
        }
    }
} ;
