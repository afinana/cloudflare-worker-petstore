import { fromHono } from "chanfana";
import { Hono, type Context } from "hono";
import { PetCreate } from "./endpoints/petCreate";
import { PetDelete } from "./endpoints/petDelete";
import { PetFetch } from "./endpoints/petFetch";
import { PetList } from "./endpoints/petList";
import { PetFetchByTag } from "./endpoints/petFetchByTag";
import { PetFetchByStatus } from "./endpoints/petFetchByStatus";
import { PetUpdate } from "./endpoints/petUpdate";
import { UserCreate } from "./endpoints/userCreate";
import { UserFetch } from "./endpoints/userFetch";
import { UserFetchByUsername } from "./endpoints/userFetchByUsername";
import { UserLogin } from "./endpoints/userLogin"; // Import the new endpoint
import { UserList } from "./endpoints/userList";

// Ensure KVNamespace is imported
import type { KVNamespace } from '@cloudflare/workers-types';

export type Env = {
    // example binding to a KV namespace
    KV_BINDING_PETSTORE: KVNamespace;
}

export type AppContext = Context<{ Bindings: Env }>;

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
    docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/v2/pet", PetList);
openapi.post("/v2/pet", PetCreate);
openapi.get("/v2/pet/findByTags", PetFetchByTag);
openapi.get("/v2/pet/findByStatus", PetFetchByStatus);

openapi.get("/v2/pet/:id", PetFetch);
openapi.delete("/v2/pet/:id", PetDelete);
openapi.put("/v2/pet/:id", PetUpdate);

// Register the user endpoints
openapi.post("/v2/user", UserCreate);
openapi.get("/v2/user/findByName/:username", UserFetchByUsername);
openapi.get("/v2/user/:id", UserFetch);
openapi.get("/v2/user", UserList);

openapi.post("/v2/user/login", UserLogin);

// Export the Hono app
export default app;

