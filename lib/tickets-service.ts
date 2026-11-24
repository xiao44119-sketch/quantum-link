import {
  TicketRecord,
  createVaultTicket,
  listVaultTickets,
  updateVaultTicket,
} from "./cloud-vault";

export type Ticket = TicketRecord;
export { listVaultTickets, createVaultTicket, updateVaultTicket };
