import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { AppContext, addCORSHeaders } from '../index'; // Import AppContext and addCORSHeaders

export class PetCreate extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "Create a new Pet",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: Pet,
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Returns the created pet",
                content: {
                    "application/json": {
                        schema: z.object({
                            series: z.object({
                                success: Bool(),
                                result: z.object({
                                    pet: Pet,
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
            const petToCreate = data.body;
            const json = JSON.stringify(petToCreate);

            // Pet Create call
            console.log("petCreate call .json=" + json);

            // Implement your own object insertion here
            const key = 'pets:document:' + petToCreate.id;
            let value = await ctx.env.KV_BINDING_PETSTORE.put(key, json);
            if (value === null) {
                return addCORSHeaders(new Response("Error saving json", { status: 500 }));
            }
            value = await ctx.env.KV_BINDING_PETSTORE.put("pets:status:" + petToCreate.status, petToCreate.id.toString());
            if (value === null) {
                return addCORSHeaders(new Response("Error saving json", { status: 500 }));
            }
            // for each tag, add the pet id to the tag list
            for (let tag of petToCreate.tags) {
                const id = petToCreate.id.toString();
                const key = `pets:tag:${tag.name}:${id}`
                console.log("saving tag:" + key + " .value=" + id);

                value = await ctx.env.KV_BINDING_PETSTORE.put(key, id);
                if (value === null) {
                    return addCORSHeaders(new Response("Error saving json", { status: 500 }));
                }
            }

            // return the pet document
            return addCORSHeaders(new Response(json, {
                status: 201,
                headers: { "Content-Type": "application/json" }
            }));

        } catch (err) {
            // In a production application, you could instead choose to retry your KV
            // read or fall back to a default code path.
            console.error(`KV returned error: ${err}`);
            return addCORSHeaders(new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } }));
        }
    }
}
