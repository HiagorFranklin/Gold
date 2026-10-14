import type { ProductFormValues } from "@/components/admin/ProductForm";
import type { ProductRow } from "./data";
import { sourcesToText } from "./format";

export function productToFormValues(p: ProductRow | null): ProductFormValues {
  return {
    id: p?.id,
    name: p?.name ?? "",
    active_ingredient: p?.active_ingredient ?? "",
    manufacturer: p?.manufacturer ?? "",
    presentation: p?.presentation ?? "",
    description: p?.description ?? "",
    image_url: p?.image_url ?? "",
    image_alt: p?.image_alt ?? "",
    image_is_illustrative: p ? !!p.image_is_illustrative : true,
    category_id: p?.category_id ? String(p.category_id) : "",
    health_topic_id: p?.health_topic_id ? String(p.health_topic_id) : "",
    price: p?.price_cents != null ? (p.price_cents / 100).toFixed(2).replace(".", ",") : "",
    availability: p?.availability ?? "indisponivel",
    regulatory_status: p?.regulatory_status ?? "pendente_verificacao",
    regulatory_justification: p?.regulatory_justification ?? "",
    regulatory_source: p?.regulatory_source ?? "",
    regulatory_checked_at: p?.regulatory_checked_at ?? "",
    regulatory_reviewer: p?.regulatory_reviewer ?? "",
    anvisa_registration: p?.anvisa_registration ?? "",
    reference_sources: sourcesToText(p?.reference_sources),
    info_reviewed_at: p?.info_reviewed_at ?? "",
    publish_info: !!p?.publish_info,
    show_price: !!p?.show_price,
    commercially_available: !!p?.commercially_available,
    whatsapp_orders: !!p?.whatsapp_orders,
    featured: !!p?.featured,
  };
}
