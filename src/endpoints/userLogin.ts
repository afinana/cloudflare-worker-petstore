import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { User } from "../types";
import { env } from "process";
import { AppContext, addCORSHeaders } from "../index";

export class UserLogin extends OpenAPIRoute {
    schema = {
        tags: ["Users"],
        summary: "Login a user",
        request: {
            query: z.object({
                username: Str({ description: "Username of the user" }),
                password: Str({ description: "Password of the user" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a success message if login is successful",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            message: Str(),
                        }),
                    },
                },
            },
            "401": {
                description: "Invalid username or password",
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

            // Retrieve the validated query parameters
            const { username, password } = data.query;

            // User Login log
            console.log("userLogin call username= " + username);

            // Implement your own object retrieval here
            const key = 'users:username:' + username;
            let json = await ctx.env.KV_BINDING_PETSTORE.get(key);

            // @ts-ignore: check if the object exists
            if (json === false) {
                return addCORSHeaders(Response.json(
                    {
                        success: false,
                        error: "Invalid username or password",
                    },
                    {
                        status: 401,
                    },
                ));
            }

            const user = JSON.parse(json);

            // Check if the password matches
            if (user.password !== password) {
                return addCORSHeaders(Response.json(
                    {
                        success: false,
                        error: "Invalid username or password",
                    },
                    {
                        status: 401,
                    },
                ));
            }

            // return success message
            return addCORSHeaders(Response.json(
                {
                    success: true,
                    message: "Login successful",
                },
                {
                    status: 200,
                },
            ));

        } catch (err) {
            // In a production application, you could instead choose to retry your KV
            // read or fall back to a default code path.
            console.error(`KV returned error: ${err}`);
            return addCORSHeaders(new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } }));
        }
    }
};
