import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Pet } from "../types";
import { type AppContext } from '../index'; // Import AppContext

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

		// Fetch pets by statuses
		const pets = [];
		try {
			const limit = 100; // Define the limit of items per page
			const cursor = page ? page * limit : 0; // Calculate the cursor based on the page number

			const documents = await ctx.env.KV_BINDING_PETSTORE.list({ prefix: `pets:document:`, limit, cursor });
			for (const key of documents.keys) {
				const pet = await ctx.env.KV_BINDING_PETSTORE.get(key.name);
				if (pet) {
					pets.push(JSON.parse(pet));
				}
			}

			// Return the list of pets
			return Response.json(
				{
					collection: { pets }
				},
				{
					status: 200,
					headers: { "Content-Type": "application/json" }
				},
			);


		} catch (err) {
			console.error(`KV returned error: ${err}`);
			return new Response(
				JSON.stringify({ error: err.message }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}
	}
}
