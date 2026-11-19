import type {OrderStatus} from "@/lib/types";
const LABEL:Record<OrderStatus,string> = {
  PENDING:"Chờ thanh toán",PAID:"Đã thanh toán",PAYMENT_FAILED:"Thanh toán lỗi",PROCESSING:"Đang xử lý",
  PREPARING:"Đang pha chế",READY:"Sẵn sàng",COMPLETED:"Hoàn tất",CANCELLED:"Đã hủy",
};
export function StatusPill({status}:{status:OrderStatus}) {
  return <span className={`status status-${status.toLowerCase()}`}>{LABEL[status]??status}</span>;
}
