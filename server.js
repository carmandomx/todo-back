import express from "express";
import db from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { fileURLToPath } from "url";
import { dirname } from "path";

const { Schema } = db;
const uri =
  "mongodb+srv://prof-quotes:1234@cluster0.7metr.mongodb.net/test?retryWrites=true&w=majority";
db.connect(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.listen(process.env.PORT || 5000, () => {
  console.log("Mi server funciona");
});

const todoSchema = new Schema({
  task: {
    type: String,
    required: true,
  },
  isCompleted: Boolean,
  student: {
    type: String,
    required: true,
  },
});
const Todo = db.model("todos", todoSchema, "todos");
app.use(cors());
app.use(helmet());
app.use(express.json());
app.set("trust proxy", 1);
app.use(express.static(`${__dirname}public`));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.use("/api/", limiter);

app.get("/api/todos", async (_, res) => {
  Todo.find((err, docs) => {
    if (err) return res.sendStatus(400);

    res.status(200).send({
      count: docs.length,
      todos: docs,
    });
  });
});

try {
  app.post("/api/todo", async (req, res) => {
    const newTodo = new Todo({ ...req.body, isCompleted: false });

    try {
      const doc = await newTodo.save();
      res.status(201).json(doc);
    } catch (err) {
      let errors = Object.values(err.errors).map((el) => el.message);
      let fields = Object.values(err.errors).map((el) => el.path);

      res.status(400).send({
        messages: errors,
        fields,
      });
    }
  });
} catch (error) {
  console.log(error);
}

try {
  app.put("/api/todo/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const doc = await Todo.findByIdAndUpdate(id, req.body, { new: true });
      res.status(200).json(doc);
    } catch (err) {
      let errors = Object.values(err.errors).map((el) => el.message);
      let fields = Object.values(err.errors).map((el) => el.path);

      res.status(400).send({
        messages: errors,
        fields,
      });
    }
  });
} catch (error) {
  console.log(error);
}

try {
  app.delete("/api/todo/:id", async (req, res) => {
    const id = req.params.id;

    try {
      await Todo.findByIdAndDelete(id);
      res.sendStatus(204);
    } catch (err) {
      let errors = Object.values(err.errors).map((el) => el.message);
      let fields = Object.values(err.errors).map((el) => el.path);

      res.status(400).send({
        messages: errors,
        fields,
      });
    }
  });
} catch (error) {
  console.log(error);
}
