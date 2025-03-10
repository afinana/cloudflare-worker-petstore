import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { AppContext, addCORSHeaders } from '../index'; // Import AppContext and addCORSHeaders

export class PetList extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "List Pets",
        request: {
            query: z.object({
                page: Num({
                    description: "Page number",
                    default: 0,
                    required: false
                }),
                isCompleted: Bool({
                    description: "Filter by completed flag",
                    required: false,
                }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a list of pets",
                content: {
                    "application/json": {
                        schema: z.object({
                            collection: z.object({
                                pets: Pet.array(),
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

        // Pet List call
        console.log("petList call .isCompleted=" + isCompleted + ", page= " + JSON.stringify(page));
        const limit = 100; // Define the limit of items per page
        const cursorPage = page ? page * limit : 0;

        try {
            let cursor: string | undefined = undefined;
            const pets = [];
            let totalItems = 0;

            do {
                const result = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `pets:document:`, limit, cursor });
                cursor = result.cursor;  // Continue pagination if cursor exists

                for (const key of result.keys) {
                    if (totalItems >= cursorPage && totalItems < cursorPage + limit) {
                        const pet = await ctx.env.KV_BINDING_PETSTORE.get(key.name);
                        if (pet) {
                            pets.push(JSON.parse(pet));
                        }
                    }
                    totalItems++;
                }
            } while (cursor && totalItems < cursorPage + limit);

            // Return the list of pets
            return addCORSHeaders(Response.json(
                {
                    collection: { pets }
                },
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

