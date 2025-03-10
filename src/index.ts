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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Headers': 'authorization,x-worker-key,Content-Type,x-custom-metadata,Content-MD5,x-amz-meta-fileid,x-amz-meta-account_id,x-amz-meta-clientid,x-amz-meta-file_id,x-amz-meta-opportunity_id,x-amz-meta-client_id,x-amz-meta-webhook',
    'Access-Control-Allow-Credentials': 'true',
    'Allow': 'GET, POST, PUT, DELETE, HEAD, OPTIONS'
};

export function addCORSHeaders(response: Response) {
    const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: corsHeaders,
    });
    return newResponse;
}; 

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
    docs_url: "/",
});

// Register the CORS preflight handler
openapi.options('/*', (c: AppContext) => {
    // Add CORS headers

    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    c.header('Access-Control-Max-Age', '86400');
    c.header('Access-Control-Allow-Headers', 'authorization ,x-worker-key,Content-Type,x-custom-metadata,Content-MD5,x-amz-meta-fileid,x-amz-meta-account_id,x-amz-meta-clientid,x-amz-meta-file_id,x-amz-meta-opportunity_id,x-amz-meta-client_id,x-amz-meta-webhook');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Allow', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');

    return c.text('', 204);
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
