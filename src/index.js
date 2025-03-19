const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const file = fs.readFileSync(path.resolve(__dirname, "../swagger.yaml"), "utf8");

const swaggerDocument = YAML.parse(file);

mongoose.set('strictQuery', true);

const app = express();
const port = process.env.PORT || 3001;

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(cookieParser());

routes(app);

mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connect Db success!");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
