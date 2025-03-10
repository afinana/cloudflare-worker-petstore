import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { env } from "process";
import { AppContext, addCORSHeaders } from "../index";

export class PetUpdate extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "Update an existing Pet",
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
            "200": {
                description: "Returns the updated pet",
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
            const petToUpdate = data.body;
            const json = JSON.stringify(petToUpdate);

            // Pet Update call
            console.log("petUpdate call .json = " + json);

            // Implement your own object update here
            const key = 'pets:' + petToUpdate.id;
            let value = await ctx.env.KV_BINDING_PETSTORE.put(key, json);
            if (value === null) {
                return addCORSHeaders(new Response("Error saving json", { status: 500 }));
            }
            value = await ctx.env.KV_BINDING_PETSTORE.put("pets:status:" + petToUpdate.status, petToUpdate.id.toString());
            if (value === null) {
                return addCORSHeaders(new Response("Error saving json", { status: 500 }));
            }
            // for each tag, add the pet id to the tag list
            for (let tag of petToUpdate.tags) {
                value = await ctx.env.KV_BINDING_PETSTORE.put("pets:tag:" + tag, petToUpdate.id.toString());
                if (value === null) {
                    return addCORSHeaders(new Response("Error saving json", { status: 500 }));
                }
            }

            // return the pet document
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
};
