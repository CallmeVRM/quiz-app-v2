import type { FastifyInstance } from "fastify";
import path from "node:path";
import fs from "node:fs/promises";
import { makeErrorReply } from "../utils/errors";

export function registerImageRoutes(app: FastifyInstance, contentDir: string) {
  // Servir les images statiques depuis les sous-catégories
  app.get<{
    Params: { theme: string; category: string; subcategory: string; filename: string };
  }>("/images/:theme/:category/:subcategory/:filename", async (req, reply) => {
    const { theme, category, subcategory, filename } = req.params;

    // Sécurité : empêcher la traversée de répertoire
    if (
      theme.includes("..") ||
      category.includes("..") ||
      subcategory.includes("..") ||
      filename.includes("..")
    ) {
      return reply.status(400).send(makeErrorReply("BAD_REQUEST", "Invalid path"));
    }

    const imagePath = path.join(
      contentDir,
      "themes",
      theme,
      category,
      subcategory,
      filename
    );

    try {
      // Vérifier que le fichier existe
      await fs.access(imagePath);

      // Déterminer le type MIME
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
      };

      const mimeType = mimeTypes[ext] || "application/octet-stream";

      // Lire et envoyer le fichier
      const fileBuffer = await fs.readFile(imagePath);
      reply.type(mimeType).send(fileBuffer);
    } catch (error) {
      return reply.status(404).send(makeErrorReply("NOT_FOUND", "Image not found"));
    }
  });
}
