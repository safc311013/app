import { app, connectMongo } from "../server.js";

export default async function handler(req, res) {
  try {
    await connectMongo();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({ message: "Error conectando a la base de datos", error: error.message });
  }
}