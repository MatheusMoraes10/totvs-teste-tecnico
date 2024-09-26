import express from "express";
import environmentRoutes from "./environmentRoutes.js";
import userRoutes from "./userRoutes.js";

const routes = (app) => {
  app.route("/").get((req, res) => res.status(200).send("Teste Técnico TOTVS - API Rest com Node.js"));

  app.use(express.json(), userRoutes, environmentRoutes);
};

export default routes;