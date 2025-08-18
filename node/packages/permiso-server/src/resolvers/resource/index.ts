export { getResourceResolver } from "./get-resource.js";
export { getResourcesResolver } from "./get-resources.js";
export { resourcesByIdPrefixResolver } from "./get-resources-by-id-prefix.js";
export { createResourceResolver } from "./create-resource.js";
export { updateResourceResolver } from "./update-resource.js";
export { deleteResourceResolver } from "./delete-resource.js";
export { deleteResourcesByIdPrefixResolver } from "./delete-resources-by-id-prefix.js";

// Re-export domain functions for use by other resolvers
export { getResource } from "../../domain/resource/get-resource.js";
export { getResources } from "../../domain/resource/get-resources.js";
export { getResourcesByIdPrefix } from "../../domain/resource/get-resources-by-id-prefix.js";
export { createResource } from "../../domain/resource/create-resource.js";
export { updateResource } from "../../domain/resource/update-resource.js";
export { deleteResource } from "../../domain/resource/delete-resource.js";
export { deleteResourcesByIdPrefix } from "../../domain/resource/delete-resources-by-id-prefix.js";
export { resourceFieldResolvers } from "./resource-field-resolvers.js";
