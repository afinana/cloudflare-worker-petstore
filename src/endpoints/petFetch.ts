import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { AppContext } from "../index";


export class PetFetch extends OpenAPIRoute {
	schema = {
		tags: ["Pets"],
		summary: "Get a single Pet by id",
		request: {
			params: z.object({
				id: Str({ description: "Pet id" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a pet object if found",
				content: {
					"application/json": {
						schema: Pet
					},
				},
			},
			"404": {
				description: "Pet not found",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								error: Str(),
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

			// Pet Fetch log
			console.log("peFetch call id= " + id);

			// Implement your own object insertion here
			const key = 'pets:document:' + id;
			let json = await ctx.env.KV_BINDING_PETSTORE.get(key);


			// @ts-ignore: check if the object exists
			if (json === false) {
				return Response.json(
					{
						success: false,
						error: "Object not found",
					},
					{
						status: 404,
					},
				);
			}

			// return the pet documentS
			return new Response(json, {
				status: 200,
				headers: {"Content-Type": "application/json"}
			});

		} catch (err) {
			// In a production application, you could instead choose to retry your KV
			// read or fall back to a default code path.
			console.error(`KV returned error: ${err}`);
			return new Response(err, { status: 500 });
		}
	}
} ;


