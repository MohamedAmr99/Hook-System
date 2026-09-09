import { BaseRepository } from "@/lib/firebase/repository";
import { Order } from "../types/order.types";

class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super("orders");
  }
}

export const orderRepository = new OrderRepository();
