import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from '../index'; // Import AppContext

export class UserDelete extends OpenAPIRoute {
	schema = {
		tags: ["Users"],
		summary: "Delete a user",
		request: {
			params: z.object({
				id: Str({ description: "User id" }),
			}),
		},
		responses: {
			"200": {
				description: "User successfully deleted",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
						}),
					},
				},
			},
			"404": {
				description: "User not found",
				content: {
					"application/json": {
						schema: z.object({
							error: z.string(),
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

			// Retrieve the validated request parameters
			const { id } = data.params;

			// User Delete call
			console.log("userDelete call .id=" + id);

			// Check if the user exists
			const userKey = `users:document:${id}`;
			const user = await ctx.env.KV_BINDING_PETSTORE.get(userKey);
			if (!user) {
				return new Response(
					JSON.stringify({ error: "User not found" }),
					{ status: 404, headers: { "Content-Type": "application/json" } }
				);
			}

			// Delete the user
			await ctx.env.KV_BINDING_PETSTORE.delete(userKey);

			// Return success response
			return new Response(
				JSON.stringify({ success: true }),
				{ status: 200, headers: { "Content-Type": "application/json" } }
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
