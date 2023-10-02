import express from "express";
import { Queue, Worker, Job } from "bullmq";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
const app = express();
const port = 3000;

const connection = {
  host: "localhost",
  port: 6379,
};

const queue = new Queue("example", { connection });

const worker = new Worker(
  "example",
  async (job) => {
    await sleep(randomNumber(1000, 5000));
    return randomNumber(1, 10);
  },
  {
    concurrency: 50,
  }
);

const addLuckyNumberJob = () => queue.add("lucky-number", null);

const randomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * max + min);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/exemplo", async (req, res) => {
  const job = await addLuckyNumberJob();
  res.send(`Your job ID is ${job.id}`);
});

app.get("/jobs/:id", async (req, res) => {
  const job = await Job.fromId(queue, req.params.id);
  if (!job?.returnvalue) {
    res.send("We're still calculating...");
    return;
  }
  res.send(`Your lucky number is ${job?.returnvalue} ✨`);
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/bullmq");

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
});

app.use("/bullmq", serverAdapter.getRouter());

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
