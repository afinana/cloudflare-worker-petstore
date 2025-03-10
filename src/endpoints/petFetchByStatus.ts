import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { env } from "process";
import { AppContext, addCORSHeaders } from "../index";


export class PetFetchByStatus extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "Get pets by status",
        request: {
            query: z.object({
                status: Str({ description: "Comma-separated list of pet statuses" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a list of pets matching the statuses",
                content: {
                    "application/json": {
                        schema: z.object({
                            collection: z.array(Pet),
                        }),
                    },
                },
            },
            "404": {
                description: "No pets found for the given statuses",
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
            const { status } = data.query;

            // Pet Fetch by Status log
            console.log("petFetchByStatus status = " + status);

            // Split the status by comma
            const statuses = status.split(',');

            // Fetch pets by statuses
            const pets = [];
            for (const status of statuses) {
                const keys = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `pets:status:${status}` });
                for (const key of keys.keys) {
                    const petId = await ctx.env.KV_BINDING_PETSTORE.get(key.name);
                    if (petId) {
                        const json = await ctx.env.KV_BINDING_PETSTORE.get('pets:document:' + petId);
                        pets.push(JSON.parse(json));
                    }
                }
            }

            if (pets.length === 0) {
                return addCORSHeaders(new Response(
                    JSON.stringify({
                        success: false,
                        error: "No pets found for the given statuses",
                    }),
                    {
                        status: 404,
                        headers: {
                            "Content-Type": "application/json"
                        },
                    },
                ));
            }

            // Return the list of pets
            return addCORSHeaders(new Response(
                JSON.stringify({
                    collection: pets
                }),
                {
                    status: 200,
                    headers: {                       
                        "Content-Type": "application/json",
                    },
                },
            ));

        } catch (err) {
            console.error(`KV returned error: ${err}`);
            return addCORSHeaders(new Response(
                JSON.stringify({ error: err.message }),
                {
                    status: 500,
                    headers: {"Content-Type": "application/json"},
                },
            ));
        }
    }
}
