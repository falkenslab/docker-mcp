// What the person reads when the server asks them (ADR-007), in their language: the app tells it as the locale
// (LC_ALL, LC_MESSAGES, LANG), as agent-kit does for its extensions' servers. What the model reads stays English
// (ADR-002): tool descriptions, results and refusals.
import type { Danger } from "./policy.js";
import { setting } from "./settings.js";
import type { Reclaimable } from "./usage.js";

export const LANGUAGES = ["en", "es"] as const;
export type Language = (typeof LANGUAGES)[number];

/** The person's language from the locale ("es_ES.UTF-8" is es); English when unset, C, POSIX or one we don't have. */
export function languageFrom(env: NodeJS.ProcessEnv = process.env): Language {
  const locale = setting("LC_ALL", env) ?? setting("LC_MESSAGES", env) ?? setting("LANG", env) ?? "";
  const language = locale.split(/[_.@-]/)[0]?.toLowerCase() ?? "";
  return (LANGUAGES as readonly string[]).includes(language) ? (language as Language) : "en";
}

/** A question for the person, and what it means in plain words, one line each. */
export interface Ask {
  question: string;
  details: string[];
}

export type PruneWhat = "containers" | "images" | "networks" | "volumes" | "build-cache" | "everything";

export interface Messages {
  /** The form's yes. */
  field: { title: string; description: string };
  removeContainer(id: string, force: boolean, volumes: boolean): Ask;
  removeImage(id: string, force: boolean): Ask;
  removeVolume(id: string): Ask;
  removeNetwork(id: string): Ask;
  prune(what: PruneWhat, allImages: boolean, volumes: boolean, estimate: Reclaimable[]): Ask;
  composeDownVolumes(folder: string): Ask;
  labDown(lab: string): Ask;
  labReset(lab: string): Ask;
  runDangerous(image: string, dangers: Danger[]): Ask;
}

const LAB_LOSS_EN = "Its containers, networks and volumes are removed, so what was done inside them is lost; the files in its folder stay.";
const LAB_LOSS_ES = "Se borran sus contenedores, redes y volúmenes, así que se pierde lo que se hizo dentro de ellos; los archivos de su carpeta se quedan.";

const en: Messages = {
  field: { title: "Yes, go ahead", description: "Leave it unchecked, or decline, to keep everything as it is" },
  removeContainer: (id, force, volumes) => ({
    question: `Remove the container ${id}?`,
    details: ["Whatever it wrote inside is gone.", ...(force ? ["If it's running, it's stopped first."] : []), ...(volumes ? ["Its anonymous volumes and their data go too."] : [])],
  }),
  removeImage: (id, force) => ({ question: `Remove the image ${id}?`, details: ["To use it again it has to be pulled or built again.", ...(force ? ["Even if a stopped container uses it."] : [])] }),
  removeVolume: (id) => ({ question: `Remove the volume ${id}?`, details: ["Every file in it goes, and it can't be undone."] }),
  removeNetwork: (id) => ({ question: `Remove the network ${id}?`, details: ["Containers can't join it any more until it's created again."] }),
  prune: (what, allImages, volumes, estimate) => {
    const kinds: Record<PruneWhat, string> = {
      everything: `stopped containers, unused networks, ${allImages ? "unused" : "dangling"} images and the build cache${volumes ? ", and unused volumes with their data" : ""}`,
      volumes: "unused volumes and their data",
      images: allImages ? "every unused image" : "dangling images",
      containers: "stopped containers",
      networks: "unused networks",
      "build-cache": "the build cache",
    };
    return { question: `Clean up Docker: remove ${kinds[what]}?`, details: [...estimate.map(({ type, amount }) => `${type}: up to ${amount} could be freed`), "It can't be undone."] };
  },
  composeDownVolumes: (folder) => ({ question: `Stop the Compose project in ${folder} and remove its volumes?`, details: ["Its containers and networks go, and its volumes with all their data; that can't be undone."] }),
  labDown: (lab) => ({ question: `Stop the lab ${lab}?`, details: [LAB_LOSS_EN] }),
  labReset: (lab) => ({ question: `Reset the lab ${lab}?`, details: [LAB_LOSS_EN, "Then it starts again from scratch."] }),
  runDangerous: (image, dangers) => ({
    question: `Run a container from ${image} with these dangerous options?`,
    details: dangers.map(({ kind, value }) =>
      ({
        privileged: "a privileged container (full access to the host)",
        "host-network": "the host's network",
        "host-pid": "the host's processes",
        "host-ipc": "the host's IPC",
        capabilities: `extra capabilities (${value})`,
        devices: `host devices (${value})`,
        "docker-socket": "the Docker socket (control of every container on the host)",
        "host-root": `the host's root folder (${value})`,
        home: `your home folder (${value})`,
      })[kind],
    ),
  }),
};

const TYPES_ES: Record<string, string> = { Containers: "Contenedores", Images: "Imágenes", "Local Volumes": "Volúmenes", "Build Cache": "Caché de construcción" };

const es: Messages = {
  field: { title: "Sí, adelante", description: "Déjalo sin marcar, o rechaza, para que todo siga como está" },
  removeContainer: (id, force, volumes) => ({
    question: `¿Borrar el contenedor ${id}?`,
    details: ["Se pierde todo lo que escribió dentro.", ...(force ? ["Si está en marcha, se para antes."] : []), ...(volumes ? ["También se borran sus volúmenes anónimos y sus datos."] : [])],
  }),
  removeImage: (id, force) => ({ question: `¿Borrar la imagen ${id}?`, details: ["Para volver a usarla habrá que descargarla o construirla de nuevo.", ...(force ? ["Aunque la use un contenedor parado."] : [])] }),
  removeVolume: (id) => ({ question: `¿Borrar el volumen ${id}?`, details: ["Se pierden todos sus archivos, y no se puede deshacer."] }),
  removeNetwork: (id) => ({ question: `¿Borrar la red ${id}?`, details: ["Ningún contenedor podrá unirse a ella hasta que se vuelva a crear."] }),
  prune: (what, allImages, volumes, estimate) => {
    const kinds: Record<PruneWhat, string> = {
      everything: `los contenedores parados, las redes sin usar, las imágenes ${allImages ? "sin usar" : "huérfanas"} y la caché de construcción${volumes ? ", y los volúmenes sin usar con sus datos" : ""}`,
      volumes: "los volúmenes sin usar y sus datos",
      images: allImages ? "todas las imágenes sin usar" : "las imágenes huérfanas",
      containers: "los contenedores parados",
      networks: "las redes sin usar",
      "build-cache": "la caché de construcción",
    };
    return { question: `Limpiar Docker: ¿borrar ${kinds[what]}?`, details: [...estimate.map(({ type, amount }) => `${TYPES_ES[type] ?? type}: se liberarían hasta ${amount}`), "No se puede deshacer."] };
  },
  composeDownVolumes: (folder) => ({ question: `¿Parar el proyecto de Compose de ${folder} y borrar sus volúmenes?`, details: ["Se borran sus contenedores y redes, y sus volúmenes con todos sus datos; no se puede deshacer."] }),
  labDown: (lab) => ({ question: `¿Parar el laboratorio ${lab}?`, details: [LAB_LOSS_ES] }),
  labReset: (lab) => ({ question: `¿Reiniciar el laboratorio ${lab}?`, details: [LAB_LOSS_ES, "Después vuelve a arrancar desde cero."] }),
  runDangerous: (image, dangers) => ({
    question: `¿Ejecutar un contenedor de ${image} con estas opciones peligrosas?`,
    details: dangers.map(({ kind, value }) =>
      ({
        privileged: "un contenedor privilegiado (acceso total al equipo)",
        "host-network": "la red del equipo",
        "host-pid": "los procesos del equipo",
        "host-ipc": "el IPC del equipo",
        capabilities: `capacidades extra (${value})`,
        devices: `dispositivos del equipo (${value})`,
        "docker-socket": "el socket de Docker (control de todos los contenedores del equipo)",
        "host-root": `la carpeta raíz del equipo (${value})`,
        home: `tu carpeta personal (${value})`,
      })[kind],
    ),
  }),
};

export const MESSAGES: Record<Language, Messages> = { en, es };
