// Registries, for pushing: which one an image goes to, and whether Docker's answer means the person must log in.
// Logging in is the person's own step (`docker login`): their credentials never pass through the model.

/** The registry an image's name points to: its first part when it looks like a host, Docker Hub otherwise. */
export function registryOf(image: string): string {
  const [first, ...rest] = image.split("/");
  return rest.length && first && (first.includes(".") || first.includes(":") || first === "localhost") ? first : "docker.io";
}

/** Whether a failed push was refused for want of a login (or of the right to push there). */
export function needsLogin(stderr: string): boolean {
  return /unauthorized|authentication required|no basic auth credentials|requested access to the resource is denied|denied:|not logged in/i.test(stderr);
}

/** The command the person runs in their own terminal: `docker login` for Docker Hub, with the host otherwise. */
export const loginCommand = (registry: string) => (registry === "docker.io" ? "docker login" : `docker login ${registry}`);
