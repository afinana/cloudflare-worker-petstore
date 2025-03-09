import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { AppContext } from "../index<";

export class PetFetchByTag extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "Get pets by tags",
        request: {
            query: z.object({
                tags: Str({ description: "Comma-separated list of pet tags" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns a list of pets matching the tags",
                content: {
                    "application/json": {
                        schema: z.object({                           
                            collection: z.array(Pet),
                        }),
                    },
                },
            },
            "404": {
                description: "No pets found for the given tags",
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
            const data = await this.getValidatedData < typeof this.schema > ();

            // Retrieve the validated query parameter
            const { tags } = data.query;

            // Pet Fetch by Status log
            console.log("petFetchByTags tags = " + tags);

            // Split the tags by comma
            const tagList = tags.split(',');

            // Fetch pets by tags
            const pets = [];
            for (const tag of tagList) {
                let searchPrefix = `pets:tag:${tag}`;
                const keys = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `${searchPrefix}` });
                for (const key of keys.keys) {
                    console.log(`get json of ${key.name}`);
                    const petId = await ctx.env.KV_BINDING_PETSTORE.get(`${key.name}`);
                    if (petId) {
                        const json = await ctx.env.KV_BINDING_PETSTORE.get(`pets:document:${petId}`);
                        pets.push(JSON.parse(json));
                    }
                }
            }

            if (pets.length === 0) {
                return Response.json(
                    {
                        success: false,
                        error: "No pets found for the given tags",
                    },
                    {
                        status: 404,
                    },
                );
            }

            // Return the list of pets
            return Response.json(
                {                  
                    collection: pets,
                },
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                },
            );


        } catch (err) {
            console.error(`KV returned error: ${err}`);
            return new Response(err, { status: 500 });
        }
    }
} ;

