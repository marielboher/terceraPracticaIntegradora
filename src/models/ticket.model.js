import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  id: Number,
  code: {
    type: String,
    required: true,
    unique: true,
  },
  purchase_datetime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  purchaser: {
    type: String,
    required: true,
    ref: "user",
  },
});

export const ticketModel = mongoose.model("tickets", ticketSchema);

