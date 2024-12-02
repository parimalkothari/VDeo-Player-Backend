import dotenv from "dotenv";
dotenv.config();
import { DBConnection } from "./db/db.js";
import app from "./app.js";

DBConnection()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Listening to Server at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed", error);
  });
