import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { env } from "process";
import { AppContext, addCORSHeaders } from "../index";

export class PetDelete extends OpenAPIRoute {
    schema = {
        tags: ["Pets"],
        summary: "Delete a Pet",
        request: {
            params: z.object({
                id: Str({ description: "Pet id" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns if the pet was deleted successfully",
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

            // Retrieve the validated slug
            const { id } = data.params;

            // Pet Delete log
            console.log("petDelete call id= " + id);

            // Implement your own object insertion here
            const key = 'pets:document:' + id;
            let json = await ctx.env.KV_BINDING_PETSTORE.get(key);

            // @ts-ignore: check if the object exists
            if (json === false) {
                return addCORSHeaders(new Response("Object not found", { status: 404 }));
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
            return addCORSHeaders(new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } }));
        }
    }
}
