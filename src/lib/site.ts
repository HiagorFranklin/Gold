import { getSettings } from "./data";
import { whatsappLink } from "./format";

export function getSiteContext() {
  const settings = getSettings();
  const whatsappHref = whatsappLink(settings.whatsapp_number, settings.whatsapp_message);
  return { settings, whatsappHref };
}

export function productWhatsappMessage(base: string, product: { name: string; presentation: string }) {
  return `${base}\n\nTenho interesse no item: ${product.name}${product.presentation ? ` (${product.presentation})` : ""}.`;
}
